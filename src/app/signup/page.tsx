"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction } from "@/lib/actions/auth";
import { Field, SubmitButton, FormError } from "@/components/ui/form";

export default function SignupPage() {
  const [state, formAction] = useActionState(signupAction, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="text-sm font-medium text-blue-700">
          ← Sorrisi in Regola
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">Crea il tuo account</h1>
        <p className="mt-1 text-sm text-slate-500">
          14 giorni di prova gratuita, nessuna carta richiesta.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <Field label="Nome dello studio" name="nomeStudio" required placeholder="Studio Dentistico Rossi" />
          <Field label="Il tuo nome" name="name" placeholder="Dott. Mario Rossi" />
          <Field label="Email" name="email" type="email" required placeholder="mario@studiorossi.it" />
          <Field label="Password" name="password" type="password" required placeholder="Almeno 8 caratteri" />
          <FormError error={state?.error} />
          <SubmitButton>Crea account</SubmitButton>
        </form>

        <p className="mt-6 text-sm text-slate-500">
          Hai già un account?{" "}
          <Link href="/login" className="font-medium text-blue-700">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}
