/** Durata della prova gratuita: unica fonte di verità, usata sia per
 * calcolare trialEndsAt alla registrazione (vedi signupAction) sia in tutti
 * i testi (email, landing, pagine dell'app) che la citano — cambiarla qui
 * (o con la variabile d'ambiente TRIAL_DAYS) basta a tenerli allineati. */
export function trialDays() {
  const raw = Number(process.env.TRIAL_DAYS ?? "14");
  return Number.isFinite(raw) && raw > 0 ? raw : 14;
}
