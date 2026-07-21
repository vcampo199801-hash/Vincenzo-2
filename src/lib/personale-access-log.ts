import { prisma } from "@/lib/prisma";

// Azione: VIEW_LISTA | VIEW_DIPENDENTE | VIEW_ALLEGATO | EXPORT_PDF | EXPORT_CSV | MODIFICA
export type PersonaleAzione = "VIEW_LISTA" | "VIEW_DIPENDENTE" | "VIEW_ALLEGATO" | "EXPORT_PDF" | "EXPORT_CSV" | "MODIFICA";

/** Every read/write against Gestione Personale is logged — it's the audit trail
 * that justifies keeping this special-category data (health, sick leave,
 * fitness certificates) inside the app at all. Never let a logging failure
 * block the actual request. */
export async function logPersonaleAccess(params: {
  studioId: string;
  userId: string;
  dipendenteId?: string;
  azione: PersonaleAzione;
}) {
  try {
    await prisma.personaleAccessLog.create({
      data: {
        studioId: params.studioId,
        userId: params.userId,
        dipendenteId: params.dipendenteId ?? null,
        azione: params.azione,
      },
    });
  } catch (err) {
    console.error("logPersonaleAccess failed:", err);
  }
}
