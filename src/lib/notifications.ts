import { prisma } from "@/lib/prisma";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { sendSms, isSmsConfigured } from "@/lib/sms";
import { scadenzaStato, lottoStato } from "@/lib/compliance";

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export type Digest = {
  scadenzeUrgenti: { nome: string; giorni: number; scaduto: boolean }[];
  farmaciUrgenti: { nome: string; giorni: number; scaduto: boolean }[];
  lottiUrgenti: { nome: string; giorni: number; scaduto: boolean }[];
};

export async function buildDigestForStudio(studioId: string): Promise<Digest | null> {
  const [adempimenti, farmaci, magazzino] = await Promise.all([
    prisma.adempimento.findMany({ where: { studioId } }),
    prisma.farmaco.findMany({ where: { studioId } }),
    prisma.magazzinoItem.findMany({ where: { studioId } }),
  ]);

  const scadenzeUrgenti = adempimenti
    .map((a) => ({ nome: a.nome, ...scadenzaStato(a.dataUltimoControllo, a.mesi) }))
    .filter((s) => s.stato === "IN_SCADENZA" || s.stato === "SCADUTO")
    .map((s) => ({ nome: s.nome, giorni: s.giorni ?? 0, scaduto: s.stato === "SCADUTO" }));

  const farmaciUrgenti = farmaci
    .map((f) => ({ nome: f.nome, stato: lottoStato(f.scadenza, 90), giorni: f.scadenza ? Math.round((f.scadenza.getTime() - Date.now()) / 86_400_000) : 0 }))
    .filter((f) => f.stato === "IN_SCADENZA" || f.stato === "SCADUTO")
    .map((f) => ({ nome: f.nome, giorni: f.giorni, scaduto: f.stato === "SCADUTO" }));

  const lottiUrgenti = magazzino
    .map((m) => ({ nome: m.prodotto, stato: lottoStato(m.scadenzaLotto), giorni: m.scadenzaLotto ? Math.round((m.scadenzaLotto.getTime() - Date.now()) / 86_400_000) : 0 }))
    .filter((m) => m.stato === "IN_SCADENZA" || m.stato === "SCADUTO")
    .map((m) => ({ nome: m.nome, giorni: m.giorni, scaduto: m.stato === "SCADUTO" }));

  if (scadenzeUrgenti.length === 0 && farmaciUrgenti.length === 0 && lottiUrgenti.length === 0) {
    return null;
  }
  return { scadenzeUrgenti, farmaciUrgenti, lottiUrgenti };
}

function renderList(items: { nome: string; giorni: number; scaduto: boolean }[]) {
  if (items.length === 0) return "";
  return `<ul style="padding-left:20px;margin:8px 0;">${items
    .map(
      (i) =>
        `<li style="margin-bottom:4px;"><strong>${i.nome}</strong> — ${
          i.scaduto ? `<span style="color:#dc2626;">scaduto da ${Math.abs(i.giorni)} giorni</span>` : `<span style="color:#b45309;">scade tra ${i.giorni} giorni</span>`
        }</li>`
    )
    .join("")}</ul>`;
}

export function renderDigestHtml(studioName: string, digest: Digest) {
  const sections = [
    { title: "Scadenze normative", items: digest.scadenzeUrgenti },
    { title: "Farmaci di emergenza", items: digest.farmaciUrgenti },
    { title: "Lotti di magazzino", items: digest.lottiUrgenti },
  ].filter((s) => s.items.length > 0);

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;max-width:560px;margin:0 auto;">
      <h1 style="font-size:18px;color:#3d7076;">Scadenze in Regola</h1>
      <p>Ciao, ecco cosa richiede attenzione per <strong>${studioName}</strong>:</p>
      ${sections.map((s) => `<h2 style="font-size:15px;margin-top:20px;">${s.title}</h2>${renderList(s.items)}`).join("")}
      <p style="margin-top:24px;">
        <a href="${APP_URL()}/app" style="background:#4e888f;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;">
          Apri Scadenze in Regola
        </a>
      </p>
      <p style="margin-top:24px;font-size:12px;color:#94a3b8;">
        Ricevi questa email perché le notifiche sono attive per il tuo studio. Puoi disattivarle da Impostazioni.
      </p>
    </div>
  `;
}

export function renderDigestText(studioName: string, digest: Digest) {
  const all = [...digest.scadenzeUrgenti, ...digest.farmaciUrgenti, ...digest.lottiUrgenti];
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

  const totalCount = digest.scadenzeUrgenti.length + digest.farmaciUrgenti.length + digest.lottiUrgenti.length;
  let sent = false;

  if (studio.notificheAttive && studio.email && isEmailConfigured()) {
    await sendEmail({
      to: studio.email,
      subject: `${totalCount} ${totalCount === 1 ? "cosa richiede" : "cose richiedono"} attenzione — ${studio.name}`,
      html: renderDigestHtml(studio.name, digest),
    });
    sent = true;
  }

  if (studio.notificheSms && studio.telefonoSms && isSmsConfigured()) {
    await sendSms({ to: studio.telefonoSms, body: renderDigestText(studio.name, digest) });
    sent = true;
  }

  return sent;
}
