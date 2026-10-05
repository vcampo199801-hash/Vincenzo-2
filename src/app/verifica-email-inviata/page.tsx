import Link from "next/link";
import Image from "next/image";

export default async function VerificaEmailInviataPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <Link href="/" className="flex items-center justify-center gap-2 text-sm font-medium text-brand-700">
          <Image src="/brand/monogram.png" alt="" width={24} height={24} className="h-6 w-6" />
          Scadenze in Regola
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">Controlla la tua email</h1>
        <p className="mt-3 text-sm text-slate-600">
          Ti abbiamo inviato un&apos;email{email ? <> a <strong>{email}</strong></> : ""} con un link di conferma.
          Cliccalo per attivare l&apos;account e iniziare la prova gratuita.
        </p>
        <p className="mt-3 text-sm text-slate-500">Non la vedi? Controlla anche nello spam.</p>
        <p className="mt-6 text-sm text-slate-500">
          Hai già un account?{" "}
          <Link href="/login" className="font-medium text-brand-700">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}
