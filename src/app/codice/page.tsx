"use client";

import { useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { redeemCodeForNewStudio } from "@/lib/actions/access-code";
import { Field, SubmitButton, FormError } from "@/components/ui/form";

export default function RedeemCodePage() {
  const [state, formAction] = useActionState(redeemCodeForNewStudio, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium text-brand-700">
          <Image src="/brand/monogram.png" alt="" width={24} height={24} className="h-6 w-6" />
          Vigilo
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">Attiva il tuo codice</h1>
        <p className="mt-1 text-sm text-slate-500">
          Hai acquistato Vigilo sul nostro shop? Inserisci il codice ricevuto e crea
          il tuo account.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <Field label="Codice di attivazione" name="code" required placeholder="SIR-XXXX-XXXX-XXXX" />
          <Field label="Nome dello studio" name="nomeStudio" required placeholder="Studio Dentistico Rossi" />
          <Field label="Il tuo nome" name="name" placeholder="Dott. Mario Rossi" />
          <Field label="Email" name="email" type="email" required placeholder="mario@studiorossi.it" />
          <Field label="Password" name="password" type="password" required placeholder="Almeno 8 caratteri" />
          <FormError error={state?.error} />
          <SubmitButton>Attiva account</SubmitButton>
        </form>

        <p className="mt-6 text-sm text-slate-500">
          Hai già un account?{" "}
          <Link href="/login" className="font-medium text-brand-700">
            Accedi
          </Link>{" "}
          e riscatta il codice dalla pagina Abbonamento.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Preferisci iniziare con la prova gratuita?{" "}
          <Link href="/signup" className="font-medium text-brand-700">
            Registrati senza codice
          </Link>
        </p>
      </div>
    </div>
  );
}
