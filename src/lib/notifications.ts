import { prisma } from "@/lib/prisma";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { scadenzaStato, lottoStato, scortaStato, daysUntil } from "@/lib/compliance";
import { ultimoControlloPerTipo } from "@/lib/manutenzione";
import { creaTokenSilenzia, sezioneApp, type TipoVoce } from "@/lib/silence-token";

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Finestra di preavviso del promemoria email: più stretta delle soglie
// "in scadenza" mostrate nell'app (30gg scadenzario, 90gg farmaci/magazzino),
// così il promemoria arriva quando l'azione è davvero imminente. Il cron
// gira ogni giorno e questa funzione ricalcola lo stato da zero, quindi una
// voce ancora in ritardo/in scadenza continua a comparire ogni giorno finché
// non viene risolta (o silenziata) — nessuno storico da tenere.
const SOGLIA_PROMEMORIA_GIORNI = 21;

export type DigestItem = {
  id: string;
  studioId: string;
  tipo: TipoVoce;
  nome: string;
  giorni: number;
  scaduto: boolean;
  dettaglioCustom?: string;
};

export type Digest = {
  scadenzeUrgenti: DigestItem[];
  farmaciUrgenti: DigestItem[];
  lottiUrgenti: DigestItem[];
  scorteBasseUrgenti: DigestItem[];
  manutenzioniUrgenti: DigestItem[];
  forumUrgenti: DigestItem[];
};

export async function buildDigestForStudio(studioId: string): Promise<Digest | null> {
  const [adempimenti, farmaci, magazzino, manutenzioneLog, tipiManutenzione, postConRisposteNonLette] = await Promise.all([
    prisma.adempimento.findMany({ where: { studioId } }),
    prisma.farmaco.findMany({ where: { studioId } }),
    prisma.magazzinoItem.findMany({ where: { studioId } }),
    prisma.manutenzioneLog.findMany({ where: { studioId } }),
    prisma.tipoManutenzione.findMany({ where: { studioId } }),
    prisma.forumPost.findMany({
      where: { studioId, notificaSilenziata: false, commenti: { some: { studioId: { not: studioId }, lettoDaAutore: false } } },
      include: { _count: { select: { commenti: { where: { studioId: { not: studioId }, lettoDaAutore: false } } } } },
    }),
  ]);

  const scadenzeUrgenti: DigestItem[] = adempimenti
    .map((a) => ({ a, ...scadenzaStato(a.dataUltimoControllo, a.mesi, SOGLIA_PROMEMORIA_GIORNI) }))
    .filter((s) => (s.stato === "IN_SCADENZA" || s.stato === "SCADUTO") && !s.a.notificaSilenziata)
    .map((s) => ({ id: s.a.id, studioId, tipo: "adempimento", nome: s.a.nome, giorni: s.giorni ?? 0, scaduto: s.stato === "SCADUTO" }));

  const farmaciUrgenti: DigestItem[] = farmaci
    .map((f) => ({ f, stato: lottoStato(f.scadenza, SOGLIA_PROMEMORIA_GIORNI), giorni: f.scadenza ? (daysUntil(f.scadenza) ?? 0) : 0 }))
    .filter((f) => (f.stato === "IN_SCADENZA" || f.stato === "SCADUTO") && !f.f.notificaSilenziata)
    .map((f) => ({ id: f.f.id, studioId, tipo: "farmaco", nome: f.f.nome, giorni: f.giorni, scaduto: f.stato === "SCADUTO" }));

  const lottiUrgenti: DigestItem[] = magazzino
    .map((m) => ({ m, stato: lottoStato(m.scadenzaLotto, SOGLIA_PROMEMORIA_GIORNI), giorni: m.scadenzaLotto ? (daysUntil(m.scadenzaLotto) ?? 0) : 0 }))
    .filter((m) => (m.stato === "IN_SCADENZA" || m.stato === "SCADUTO") && !m.m.notificaSilenziata)
    .map((m) => ({ id: m.m.id, studioId, tipo: "magazzino", nome: m.m.prodotto, giorni: m.giorni, scaduto: m.stato === "SCADUTO" }));

  // Stessa notificaSilenziata dell'articolo usata per il lotto in scadenza:
  // un solo flag per articolo copre entrambi i promemoria (scadenza + scorta).
  const scorteBasseUrgenti: DigestItem[] = magazzino
    .filter((m) => scortaStato(m.scortaMinima, m.quantitaAttuale) === "DA_RIORDINARE" && !m.notificaSilenziata)
    .map((m) => ({
      id: m.id,
      studioId,
      tipo: "magazzino",
      nome: m.prodotto,
      giorni: 0,
      scaduto: true,
      dettaglioCustom: `sotto scorta minima (${m.quantitaAttuale} ${m.unita} su ${m.scortaMinima} ${m.unita} minimi)`,
    }));

  const manutenzioniUrgenti: DigestItem[] = ultimoControlloPerTipo(manutenzioneLog, tipiManutenzione)
    .filter((t) => t.inRitardo)
    .map((t) => {
      const tipoRow = tipiManutenzione.find((x) => x.chiave === t.tipo)!;
      const scadenzaAttesa = new Date(t.ultima!.data);
      scadenzaAttesa.setUTCDate(scadenzaAttesa.getUTCDate() + t.cadenzaGiorni!);
      return { tipoRow, giorni: daysUntil(scadenzaAttesa) ?? 0 };
    })
    .filter((t) => !t.tipoRow.notificaSilenziata)
    .map((t) => ({ id: t.tipoRow.id, studioId, tipo: "manutenzione", nome: t.tipoRow.nome, giorni: t.giorni, scaduto: true }));

  const forumUrgenti: DigestItem[] = postConRisposteNonLette.map((p) => ({
    id: p.id,
    studioId,
    tipo: "forum",
    nome: p.titolo,
    giorni: 0,
    scaduto: true,
    dettaglioCustom: `${p._count.commenti} nuova${p._count.commenti === 1 ? "" : "e"} risposta${p._count.commenti === 1 ? "" : "e"}`,
  }));

  if (
    scadenzeUrgenti.length === 0 &&
    farmaciUrgenti.length === 0 &&
    lottiUrgenti.length === 0 &&
    scorteBasseUrgenti.length === 0 &&
    manutenzioniUrgenti.length === 0 &&
    forumUrgenti.length === 0
  ) {
    return null;
  }
  return { scadenzeUrgenti, farmaciUrgenti, lottiUrgenti, scorteBasseUrgenti, manutenzioniUrgenti, forumUrgenti };
}

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function renderList(items: DigestItem[]) {
  if (items.length === 0) return "";
  const righe = await Promise.all(
    items.map(async (i) => {
      const token = await creaTokenSilenzia({ studioId: i.studioId, tipo: i.tipo, id: i.id, silenzia: true });
      const silenziaUrl = `${APP_URL()}/api/silenzia?token=${encodeURIComponent(token)}`;
      const sezioneUrl = `${APP_URL()}${sezioneApp(i.tipo, i.id)}`;
      const dettaglio = i.dettaglioCustom
        ? `<span style="color:#dc2626;">${escapeHtml(i.dettaglioCustom)}</span>`
        : i.scaduto
          ? `<span style="color:#dc2626;">scaduto da ${Math.abs(i.giorni)} giorni</span>`
          : `<span style="color:#b45309;">scade tra ${i.giorni} giorni</span>`;
      return `<li style="margin-bottom:6px;"><a href="${sezioneUrl}" style="color:#0f172a;font-weight:bold;text-decoration:none;">${escapeHtml(i.nome)}</a> — ${dettaglio} &nbsp;<a href="${silenziaUrl}" style="font-size:12px;color:#94a3b8;text-decoration:underline;">Silenzia questa voce</a></li>`;
    })
  );
  return `<ul style="padding-left:20px;margin:8px 0;">${righe.join("")}</ul>`;
}

export async function renderDigestHtml(studioName: string, digest: Digest) {
  const sections = [
    { title: "Scadenze normative", items: digest.scadenzeUrgenti },
    { title: "Farmaci di emergenza", items: digest.farmaciUrgenti },
    { title: "Lotti di magazzino", items: digest.lottiUrgenti },
    { title: "Scorte sotto la soglia minima", items: digest.scorteBasseUrgenti },
    { title: "Manutenzione staff", items: digest.manutenzioniUrgenti },
    { title: "Forum — nuove risposte", items: digest.forumUrgenti },
  ].filter((s) => s.items.length > 0);

  const sectionsHtml = (
    await Promise.all(sections.map(async (s) => `<h2 style="font-size:15px;margin-top:20px;">${s.title}</h2>${await renderList(s.items)}`))
  ).join("");

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;max-width:560px;margin:0 auto;">
      <h1 style="font-size:18px;color:#3d7076;">Scadenze in Regola</h1>
      <p>Ciao, ecco cosa richiede attenzione per <strong>${escapeHtml(studioName)}</strong>:</p>
      ${sectionsHtml}
      <p style="margin-top:24px;">
        <a href="${APP_URL()}/app" style="background:#4e888f;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;">
          Apri Scadenze in Regola
        </a>
      </p>
      <p style="margin-top:24px;font-size:12px;color:#94a3b8;">
        Ricevi questa email perché le notifiche sono attive per il tuo studio (ogni giorno, finché la voce resta in scadenza). Puoi
        disattivarle del tutto da Impostazioni, oppure silenziare solo una voce specifica con il link accanto ad essa.
      </p>
    </div>
  `;
}

export async function sendDigestForStudio(studio: {
  id: string;
  name: string;
  email: string | null;
  notificheAttive: boolean;
}) {
  const digest = await buildDigestForStudio(studio.id);
  if (!digest) return false;

  if (!studio.notificheAttive || !studio.email || !isEmailConfigured()) return false;

  const totalCount =
    digest.scadenzeUrgenti.length +
    digest.farmaciUrgenti.length +
    digest.lottiUrgenti.length +
    digest.scorteBasseUrgenti.length +
    digest.manutenzioniUrgenti.length +
    digest.forumUrgenti.length;
  await sendEmail({
    to: studio.email,
    subject: `${totalCount} ${totalCount === 1 ? "cosa richiede" : "cose richiedono"} attenzione — ${studio.name}`,
    html: await renderDigestHtml(studio.name, digest),
  });
  return true;
}
