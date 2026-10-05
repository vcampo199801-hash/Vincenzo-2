"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction } from "@/lib/actions/auth";
import Image from "next/image";
import { Field, SubmitButton, FormError } from "@/components/ui/form";
import { ResendVerificationForm } from "@/components/resend-verification-form";

const MESSAGGI_ERRORE: Record<string, string> = {
  "link-scaduto": "Il link di conferma è scaduto o non è valido. Accedi con la tua password per richiederne uno nuovo.",
  "token-mancante": "Link di conferma incompleto. Accedi con la tua password per richiederne uno nuovo.",
  "studio-mancante": "Non troviamo uno studio associato a questo account. Scrivici per assistenza.",
};

function LoginForm() {
  const [state, formAction] = useActionState(loginAction, undefined);
  const searchParams = useSearchParams();
  const erroreLink = searchParams.get("errore");
  const messaggioErroreLink = erroreLink ? MESSAGGI_ERRORE[erroreLink] : null;

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <Link href="/" className="flex items-center gap-2 text-sm font-medium text-brand-700">
        <Image src="/brand/monogram.png" alt="" width={24} height={24} className="h-6 w-6" />
        Scadenze in Regola
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-slate-900">Accedi</h1>
      <p className="mt-1 text-sm text-slate-500">Bentornato nel tuo cruscotto compliance.</p>

      {messaggioErroreLink && !state && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {messaggioErroreLink}
        </p>
      )}

      <form action={formAction} className="mt-6 space-y-4">
        <Field label="Email" name="email" type="email" required placeholder="mario@studiorossi.it" />
        <Field label="Password" name="password" type="password" required />
        <FormError error={state?.error} />
        {state?.emailDaVerificare && <ResendVerificationForm defaultEmail={state.emailDaVerificare} />}
        <SubmitButton>Accedi</SubmitButton>
      </form>

      <p className="mt-6 text-sm text-slate-500">
        Non hai un account?{" "}
        <Link href="/signup" className="font-medium text-brand-700">
          Registrati
        </Link>
      </p>
      <p className="mt-2 text-sm text-slate-500">
        Hai un codice di attivazione?{" "}
        <Link href="/codice" className="font-medium text-brand-700">
          Attivalo qui
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
