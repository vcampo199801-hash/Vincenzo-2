"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/actions/auth";
import { Field, SubmitButton, FormError } from "@/components/ui/form";

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="text-sm font-medium text-blue-700">
          ← Sorrisi in Regola
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">Accedi</h1>
        <p className="mt-1 text-sm text-slate-500">Bentornato nel tuo cruscotto compliance.</p>

        <form action={formAction} className="mt-6 space-y-4">
          <Field label="Email" name="email" type="email" required placeholder="mario@studiorossi.it" />
          <Field label="Password" name="password" type="password" required />
          <FormError error={state?.error} />
          <SubmitButton>Accedi</SubmitButton>
        </form>

        <p className="mt-6 text-sm text-slate-500">
          Non hai un account?{" "}
          <Link href="/signup" className="font-medium text-blue-700">
            Registrati
          </Link>
        </p>
      </div>
    </div>
  );
}
