import { prisma } from "@/lib/prisma";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { formatCurrency, formatDate } from "@/lib/compliance";
import { toIsoDate } from "@/lib/kpi";
import { MODALITA_INCASSO_OPTIONS, optionLabelCassa } from "@/lib/cassa";

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

export type RecapAttivita = {
  giorno: Date;
  preventivi: { pazienteNome: string | null; dottore: string; totaleProposto: number; stato: string }[];
  totalePreventiviProposto: number;
  preventiviAccettatiOggi: { pazienteNome: string | null; totaleAccettato: number | null }[];
  incassi: { importo: number; modalitaIncasso: string | null; nominativo: string | null }[];
  totaleIncassi: number;
  chiusuraPos: number;
  lavorazioniInviate: { numero: number; riferimentoPaziente: string; laboratorio: string }[];
  lavorazioniConsegnate: { numero: number; riferimentoPaziente: string; laboratorio: string }[];
};

function isVuoto(r: RecapAttivita) {
  return (
    r.preventivi.length === 0 &&
    r.preventiviAccettatiOggi.length === 0 &&
    r.incassi.length === 0 &&
    r.chiusuraPos === 0 &&
    r.lavorazioniInviate.length === 0 &&
    r.lavorazioniConsegnate.length === 0
  );
}

/** "Oggi" allo stesso modo con cui sono salvate le date-giorno nel resto
 * dell'app (mezzanotte UTC) — vedi il commento sulla stessa normalizzazione
 * nella pagina Cassa. */
export async function buildRecapAttivita(studioId: string, giorno: Date = new Date(new Date(toIsoDate(new Date())))): Promise<RecapAttivita | null> {
  const [preventiviOggi, preventiviAccettatiOggi, incassiOggi, kpiOggi, lavorazioniInviateOggi, lavorazioniConsegnateOggi] = await Promise.all([
    prisma.preventivo.findMany({ where: { studioId, data: giorno }, select: { pazienteNome: true, dottore: true, totaleProposto: true, stato: true } }),
    prisma.preventivo.findMany({
      where: { studioId, dataAccettazione: giorno },
      select: { pazienteNome: true, totaleAccettato: true },
    }),
    prisma.movimentoCassa.findMany({
      where: { studioId, data: giorno, tipo: "INCASSO" },
      select: { importo: true, modalitaIncasso: true, nominativo: true },
    }),
    prisma.kpiGiornaliero.findFirst({ where: { studioId, data: giorno }, select: { chiusuraPos: true } }),
    prisma.lavorazione.findMany({
      where: { studioId, dataInvio: giorno },
      select: { numero: true, riferimentoPaziente: true, laboratorio: { select: { ragioneSociale: true } } },
    }),
    prisma.lavorazione.findMany({
      where: { studioId, dataConsegnaEffettiva: giorno },
      select: { numero: true, riferimentoPaziente: true, laboratorio: { select: { ragioneSociale: true } } },
    }),
  ]);

  const recap: RecapAttivita = {
    giorno,
    preventivi: preventiviOggi,
    totalePreventiviProposto: preventiviOggi.reduce((s, p) => s + p.totaleProposto, 0),
    preventiviAccettatiOggi,
    incassi: incassiOggi,
    totaleIncassi: incassiOggi.reduce((s, m) => s + m.importo, 0),
    chiusuraPos: kpiOggi?.chiusuraPos ?? 0,
    lavorazioniInviate: lavorazioniInviateOggi.map((l) => ({ numero: l.numero, riferimentoPaziente: l.riferimentoPaziente, laboratorio: l.laboratorio.ragioneSociale })),
    lavorazioniConsegnate: lavorazioniConsegnateOggi.map((l) => ({ numero: l.numero, riferimentoPaziente: l.riferimentoPaziente, laboratorio: l.laboratorio.ragioneSociale })),
  };

  return isVuoto(recap) ? null : recap;
}

export function renderRecapAttivitaHtml(studioName: string, r: RecapAttivita) {
  const righePreventivi = r.preventivi
    .map((p) => `<li>${escapeHtml(p.pazienteNome ?? "Paziente")} — ${escapeHtml(p.dottore)} — ${formatCurrency(p.totaleProposto)} (${escapeHtml(p.stato)})</li>`)
    .join("");
  const righeAccettati = r.preventiviAccettatiOggi
    .map((p) => `<li>${escapeHtml(p.pazienteNome ?? "Paziente")} — ${p.totaleAccettato !== null ? formatCurrency(p.totaleAccettato) : "—"}</li>`)
    .join("");
  const righeIncassi = r.incassi
    .map(
      (m) =>
        `<li>${formatCurrency(m.importo)} — ${escapeHtml(optionLabelCassa([...MODALITA_INCASSO_OPTIONS], m.modalitaIncasso))}${m.nominativo ? ` — ${escapeHtml(m.nominativo)}` : ""}</li>`
    )
    .join("");
  const righeInviate = r.lavorazioniInviate.map((l) => `<li>N. ${l.numero} — ${escapeHtml(l.riferimentoPaziente)} — ${escapeHtml(l.laboratorio)}</li>`).join("");
  const righeConsegnate = r.lavorazioniConsegnate.map((l) => `<li>N. ${l.numero} — ${escapeHtml(l.riferimentoPaziente)} — ${escapeHtml(l.laboratorio)}</li>`).join("");

  const sezione = (title: string, righe: string, vuoto: string) => `
    <h2 style="font-size:15px;margin-top:20px;">${title}</h2>
    ${righe ? `<ul style="padding-left:18px;margin:6px 0;">${righe}</ul>` : `<p style="color:#94a3b8;font-size:13px;margin:4px 0;">${vuoto}</p>`}
  `;

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;max-width:560px;margin:0 auto;">
      <h1 style="font-size:18px;color:#3d7076;">Scadenze in Regola</h1>
      <p>Recap attività di <strong>${escapeHtml(studioName)}</strong> — ${formatDate(r.giorno)}:</p>
      ${sezione("Preventivi caricati oggi", righePreventivi, "Nessun preventivo caricato oggi.")}
      ${r.totalePreventiviProposto > 0 ? `<p style="font-size:13px;color:#475569;">Totale proposto oggi: <strong>${formatCurrency(r.totalePreventiviProposto)}</strong></p>` : ""}
      ${sezione("Preventivi accettati oggi", righeAccettati, "Nessun preventivo accettato oggi.")}
      ${sezione("Incassi di Cassa oggi", righeIncassi, "Nessun incasso registrato oggi in Cassa.")}
      ${r.chiusuraPos > 0 ? `<p style="font-size:13px;color:#475569;">Chiusura POS: <strong>${formatCurrency(r.chiusuraPos)}</strong></p>` : ""}
      <p style="font-size:13px;color:#475569;">Totale incassi oggi (contanti/assegni/bonifici/altro + POS): <strong>${formatCurrency(r.totaleIncassi + r.chiusuraPos)}</strong></p>
      ${sezione("Lavorazioni inviate al laboratorio oggi", righeInviate, "Nessuna lavorazione inviata oggi.")}
      ${sezione("Lavorazioni consegnate dal laboratorio oggi", righeConsegnate, "Nessuna lavorazione consegnata oggi.")}
      <p style="margin-top:24px;">
        <a href="${APP_URL()}/app/kpi/preventivi" style="background:#4e888f;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;">
          Apri Scadenze in Regola
        </a>
      </p>
      <p style="margin-top:24px;font-size:12px;color:#94a3b8;">
        Ricevi questo recap perché è attivo in Impostazioni → Notifiche. Puoi disattivarlo o cambiare l'indirizzo da lì in qualsiasi momento.
      </p>
    </div>
  `;
}

export async function sendRecapAttivitaForStudio(studio: {
  id: string;
  name: string;
  email: string | null;
  recapAttivitaAttivo: boolean;
  emailRecapAttivita: string | null;
}) {
  if (!studio.recapAttivitaAttivo) return false;
  const destinatario = studio.emailRecapAttivita || studio.email;
  if (!destinatario) return false;
  if (!isEmailConfigured()) return false;

  const recap = await buildRecapAttivita(studio.id);
  if (!recap) return false;

  const html = renderRecapAttivitaHtml(studio.name, recap);
  await sendEmail({ to: destinatario, subject: `Recap attività di oggi — ${studio.name}`, html });
  return true;
}
