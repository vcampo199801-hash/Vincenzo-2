import { redirect } from "next/navigation";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { creaPost } from "@/lib/actions/forum";
import { CATEGORIA_FORUM_OPTIONS } from "@/lib/forum";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SelectField, TextAreaField, SubmitButton } from "@/components/ui/form";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function NuovoPostForumPage() {
  const { studio } = await requireActiveSubscription("forum");
  if (!studio.forumAttivo) redirect("/app/forum");

  return (
    <div className="max-w-xl">
      <PageHeader title="Nuovo post" description="Sarà firmato con il nome del tuo studio, visibile a tutti gli studi iscritti al forum." />
      <form action={creaPost} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <SelectField label="Categoria" name="categoria" options={[...CATEGORIA_FORUM_OPTIONS]} defaultValue="BACHECA" required />
        <Field label="Titolo" name="titolo" required placeholder="Es. Consiglio su fornitore materiali" />
        <TextAreaField label="Messaggio" name="corpo" placeholder="Scrivi qui il tuo post…" />
        <SubmitButton>Pubblica</SubmitButton>
      </form>
    </div>
  );
}
