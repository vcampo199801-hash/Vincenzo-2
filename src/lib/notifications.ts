import { prisma } from "@/lib/prisma";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { sendSms, isSmsConfigured } from "@/lib/sms";
import { scadenzaStato, lottoStato, daysUntil } from "@/lib/compliance";
import { ultimoControlloPerTipo } from "@/lib/manutenzione";
import { creaTokenSilenzia, type TipoVoce } from "@/lib/silence-token";

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Finestra di preavviso del promemoria email/SMS: più stretta delle soglie
// "in scadenza" mostrate nell'app (30gg scadenzario, 90gg farmaci/magazzino),
// così il promemoria arriva quando l'azione è davvero imminente. Il cron
// gira ogni giorno e questa funzione ricalcola lo stato da zero, quindi una
// voce ancora in ritardo/in scadenza continua a comparire ogni giorno finché
// non viene risolta (o silenziata) — nessuno storico da tenere.
const SOGLIA_PROMEMORIA_GIORNI = 21;

export type DigestItem = { id: string; studioId: string; tipo: TipoVoce; nome: string; giorni: number; scaduto: boolean };

export type Digest = {
  scadenzeUrgenti: DigestItem[];
  farmaciUrgenti: DigestItem[];
  lottiUrgenti: DigestItem[];
  manutenzioniUrgenti: DigestItem[];
};

export async function buildDigestForStudio(studioId: string): Promise<Digest | null> {
  const [adempimenti, farmaci, magazzino, manutenzioneLog, tipiManutenzione] = await Promise.all([
    prisma.adempimento.findMany({ where: { studioId } }),
    prisma.farmaco.findMany({ where: { studioId } }),
    prisma.magazzinoItem.findMany({ where: { studioId } }),
    prisma.manutenzioneLog.findMany({ where: { studioId } }),
    prisma.tipoManutenzione.findMany({ where: { studioId } }),
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

  if (scadenzeUrgenti.length === 0 && farmaciUrgenti.length === 0 && lottiUrgenti.length === 0 && manutenzioniUrgenti.length === 0) {
    return null;
  }
  return { scadenzeUrgenti, farmaciUrgenti, lottiUrgenti, manutenzioniUrgenti };
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
      const dettaglio = i.scaduto
        ? `<span style="color:#dc2626;">scaduto da ${Math.abs(i.giorni)} giorni</span>`
        : `<span style="color:#b45309;">scade tra ${i.giorni} giorni</span>`;
      return `<li style="margin-bottom:6px;"><strong>${escapeHtml(i.nome)}</strong> — ${dettaglio} &nbsp;<a href="${silenziaUrl}" style="font-size:12px;color:#94a3b8;text-decoration:underline;">Silenzia questa voce</a></li>`;
    })
  );
  return `<ul style="padding-left:20px;margin:8px 0;">${righe.join("")}</ul>`;
}

export async function renderDigestHtml(studioName: string, digest: Digest) {
  const sections = [
    { title: "Scadenze normative", items: digest.scadenzeUrgenti },
    { title: "Farmaci di emergenza", items: digest.farmaciUrgenti },
    { title: "Lotti di magazzino", items: digest.lottiUrgenti },
    { title: "Manutenzione staff", items: digest.manutenzioniUrgenti },
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

export function renderDigestText(studioName: string, digest: Digest) {
  const all = [...digest.scadenzeUrgenti, ...digest.farmaciUrgenti, ...digest.lottiUrgenti, ...digest.manutenzioniUrgenti];
  const top = all
    .slice(0, 3)
    .map((i) => `${i.nome} (${i.scaduto ? `scaduto da ${Math.abs(i.giorni)}gg` : `scade tra ${i.giorni}gg`})`);
  const extra = all.length > top.length ? ` e altri ${all.length - top.length}` : "";

  return `Scadenze in Regola — ${studioName}: ${all.length} ${
    all.length === 1 ? "cosa richiede" : "cose richiedono"
  } attenzione. ${top.join("; ")}${extra}. Apri l'app: ${APP_URL()}/app`;
}

export async function sendDigestForStudio(studio: {
  id: string;
  name: string;
  email: string | null;
  telefonoSms: string | null;
  notificheAttive: boolean;
  notificheSms: boolean;
}) {
  const digest = await buildDigestForStudio(studio.id);
  if (!digest) return false;

  const totalCount =
    digest.scadenzeUrgenti.length + digest.farmaciUrgenti.length + digest.lottiUrgenti.length + digest.manutenzioniUrgenti.length;
  let sent = false;

  if (studio.notificheAttive && studio.email && isEmailConfigured()) {
    await sendEmail({
      to: studio.email,
      subject: `${totalCount} ${totalCount === 1 ? "cosa richiede" : "cose richiedono"} attenzione — ${studio.name}`,
      html: await renderDigestHtml(studio.name, digest),
    });
    sent = true;
  }

  if (studio.notificheSms && studio.telefonoSms && isSmsConfigured()) {
    await sendSms({ to: studio.telefonoSms, body: renderDigestText(studio.name, digest) });
    sent = true;
  }

  return sent;
}
