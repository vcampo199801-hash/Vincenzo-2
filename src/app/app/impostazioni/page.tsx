import { requireStudio } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { updateStudioInfo } from "@/lib/actions/studio";
import { removeMember } from "@/lib/actions/team";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SubmitButton } from "@/components/ui/form";
import { DeleteButton } from "@/components/ui/delete-button";
import { InviteMemberForm } from "@/components/app/invite-member-form";
import { formatDate } from "@/lib/compliance";

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

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <PageHeader title="Impostazioni studio" description="Dati anagrafici che compaiono nel cruscotto e nei documenti." />
        <form action={updateStudioInfo} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Field label="Nome dello studio" name="name" required defaultValue={studio.name} />
          <Field label="Titolare" name="titolare" defaultValue={studio.titolare} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Città" name="citta" defaultValue={studio.citta} />
            <Field label="Telefono" name="telefono" defaultValue={studio.telefono} />
          </div>
          <Field label="Email" name="email" type="email" defaultValue={studio.email} />
          <SubmitButton>Salva impostazioni</SubmitButton>
        </form>
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
          Utenti illimitati inclusi nell&apos;abbonamento: igienisti, assistenti e colleghi possono
          accedere allo stesso studio con il proprio login.
        </p>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Ruolo</th>
                <th className="px-4 py-3">Membro dal</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {memberships.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{m.user.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{m.user.email}</td>
                  <td className="px-4 py-3 text-slate-600">{ROLE_LABELS[m.role] ?? m.role}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(m.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {isOwner && m.role !== "OWNER" && (
                      <DeleteButton action={removeMember.bind(null, m.id)} label="Rimuovi" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isOwner && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="mb-3 text-sm font-medium text-slate-700">Invita un collaboratore</p>
            <InviteMemberForm />
          </div>
        )}
      </div>
    </div>
  );
}
