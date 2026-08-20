import { requireStudio } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { updateStudioInfo } from "@/lib/actions/studio";
import { removeMember } from "@/lib/actions/team";
import { PageHeader } from "@/components/ui/page-header";
import { Field, CheckboxField, SubmitButton } from "@/components/ui/form";
import { DeleteButton } from "@/components/ui/delete-button";
import { InviteMemberForm } from "@/components/app/invite-member-form";
import { MemberPermissionsForm } from "@/components/app/member-permissions-form";
import { TestDigestButton } from "@/components/app/test-digest-button";
import { formatDate } from "@/lib/compliance";
import { isEmailConfigured } from "@/lib/email";
import { parsePermessi, APP_MODULES } from "@/lib/modules";
import { PIANI, normalizzaPiano } from "@/lib/plans";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = { OWNER: "Titolare", MEMBER: "Collaboratore" };

export default async function ImpostazioniPage() {
  const { session, studio } = await requireStudio();

  const memberships = await prisma.membership.findMany({
    where: { studioId: studio.id },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
  const isOwner = memberships.find((m) => m.userId === session.userId)?.role === "OWNER";
  const collaboratorCount = memberships.filter((m) => m.role === "MEMBER").length;
  const maxCollaboratori = PIANI[normalizzaPiano(studio.subscription?.plan)].maxCollaboratori;
  const atCap = collaboratorCount >= maxCollaboratori;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <PageHeader title="Impostazioni studio" description="Dati anagrafici che compaiono nel cruscotto e nei documenti." />
        <form action={updateStudioInfo} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Field label="Nome dello studio" name="name" required defaultValue={studio.name} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Titolare" name="titolare" defaultValue={studio.titolare} />
            <Field
              label="N. iscrizione Albo del titolare"
              name="numeroAlboTitolare"
              defaultValue={studio.numeroAlboTitolare}
              hint="Compare nell'intestazione dei moduli di consenso informato."
            />
          </div>
          <Field label="Indirizzo" name="indirizzo" defaultValue={studio.indirizzo} hint="Compare nell'intestazione dei moduli di consenso informato." />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Città" name="citta" defaultValue={studio.citta} />
            <Field label="Telefono" name="telefono" defaultValue={studio.telefono} />
          </div>
          <Field label="Email" name="email" type="email" defaultValue={studio.email} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Partita IVA"
              name="partitaIva"
              defaultValue={studio.partitaIva}
              hint="Serve per ricevere la fattura elettronica dell'abbonamento."
            />
            <Field
              label="Codice Fiscale"
              name="codiceFiscale"
              defaultValue={studio.codiceFiscale}
              hint="Se diverso dalla Partita IVA (es. libero professionista)."
            />
          </div>
          <Field
            label="PEC o Codice Destinatario SDI"
            name="pec"
            defaultValue={studio.pec}
            hint="Dove va inviata la fattura elettronica dell'abbonamento."
          />
          <CheckboxField
            label="Ricevi via email un riepilogo delle scadenze in arrivo o già scadute"
            name="notificheAttive"
            defaultChecked={studio.notificheAttive}
          />
          <SubmitButton>Salva impostazioni</SubmitButton>
        </form>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Notifiche</h2>
        <p className="mb-3 text-sm text-slate-500">
          Ogni giorno controlliamo scadenze, farmaci e lotti di magazzino in scadenza o scaduti: se c&apos;è
          qualcosa da segnalare, arriva un promemoria automatico via email, se attivato qui sopra.
        </p>
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Email</p>
            <TestDigestButton />
            {!isEmailConfigured() && (
              <p className="mt-3 text-xs text-slate-400">
                Nota per lo sviluppatore: imposta RESEND_API_KEY e EMAIL_FROM in .env per abilitare l&apos;invio reale.
              </p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Account</h2>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-sm text-slate-600">
          <p>Email di accesso: <span className="font-medium text-slate-900">{session.email}</span></p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Team dello studio</h2>
        <p className="mb-3 text-sm text-slate-500">
          Il titolare più un massimo di {maxCollaboratori} collaborator{maxCollaboratori === 1 ? "e" : "i"} per il
          tuo piano ({collaboratorCount}/{maxCollaboratori} usati) — tutti possono accedere in contemporanea da
          telefono e computer. Per ogni collaboratore puoi scegliere quali sezioni può vedere.
          {atCap && (
            <>
              {" "}
              <a href="/app/abbonamento" className="font-medium text-brand-700 underline">
                Passa a un piano superiore
              </a>{" "}
              per invitarne altri.
            </>
          )}
        </p>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Ruolo</th>
                <th className="px-4 py-3">Membro dal</th>
                <th className="px-4 py-3">Sezioni</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {memberships.map((m) => {
                const allowedKeys = parsePermessi(m.permessi);
                const sectionsLabel =
                  m.role === "OWNER"
                    ? "Tutte"
                    : allowedKeys === null
                      ? "Tutte"
                      : allowedKeys.length === 0
                        ? "Nessuna"
                        : `${allowedKeys.length}/${APP_MODULES.length}`;
                return (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{m.user.name ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{m.user.email}</td>
                    <td className="px-4 py-3 text-slate-600">{ROLE_LABELS[m.role] ?? m.role}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(m.createdAt)}</td>
                    <td className="px-4 py-3 text-slate-600">{m.role !== "OWNER" ? sectionsLabel : "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {isOwner && m.role !== "OWNER" && (
                        <DeleteButton action={removeMember.bind(null, m.id)} label="Rimuovi" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {isOwner &&
          memberships
            .filter((m) => m.role !== "OWNER")
            .map((m) => (
              <details key={m.id} className="mt-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <summary className="cursor-pointer text-sm font-medium text-slate-700">
                  Permessi di {m.user.name ?? m.user.email}
                </summary>
                <div className="mt-3">
                  <MemberPermissionsForm membershipId={m.id} allowedKeys={parsePermessi(m.permessi)} />
                </div>
              </details>
            ))}

        {isOwner && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="mb-3 text-sm font-medium text-slate-700">Invita un collaboratore</p>
            <InviteMemberForm atCap={atCap} />
          </div>
        )}
      </div>
    </div>
  );
}
