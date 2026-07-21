"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/auth-guards";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { isPianoKey, stripePriceIdPerPiano } from "@/lib/plans";

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function startCheckout(formData: FormData) {
  const { session, studio } = await requireStudio();

  const piano = String(formData.get("piano") ?? "");
  if (!isPianoKey(piano)) {
    redirect("/app/abbonamento?error=piano-non-valido");
  }

  if (!isStripeConfigured()) {
    redirect("/app/abbonamento?error=stripe-not-configured");
  }

  const priceId = stripePriceIdPerPiano(piano);
  if (!priceId) {
    redirect("/app/abbonamento?error=stripe-not-configured");
  }

  const stripe = getStripe()!;
  let customerId = studio.subscription?.stripeCustomerId ?? undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.email,
      name: studio.name,
      metadata: { studioId: studio.id },
    });
    customerId = customer.id;
    await prisma.subscription.upsert({
      where: { studioId: studio.id },
      update: { stripeCustomerId: customerId },
      create: { studioId: studio.id, stripeCustomerId: customerId, status: "INCOMPLETE" },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl()}/app/abbonamento?success=1`,
    cancel_url: `${appUrl()}/app/abbonamento?canceled=1`,
    client_reference_id: studio.id,
    subscription_data: { metadata: { studioId: studio.id, piano } },
  });

  if (!checkoutSession.url) {
    redirect("/app/abbonamento?error=checkout-failed");
  }
  redirect(checkoutSession.url);
}

/** Cambia il piano di un abbonamento Stripe già attivo (upgrade/downgrade),
 * aggiornando la subscription esistente invece di aprire una nuova Checkout Session. */
export async function changePlan(formData: FormData) {
  const { studio } = await requireStudio();

  const piano = String(formData.get("piano") ?? "");
  if (!isPianoKey(piano)) {
    redirect("/app/abbonamento?error=piano-non-valido");
  }

  const sub = studio.subscription;
  if (!isStripeConfigured() || !sub?.stripeSubscriptionId) {
    redirect("/app/abbonamento?error=no-billing-account");
  }

  const priceId = stripePriceIdPerPiano(piano);
  if (!priceId) {
    redirect("/app/abbonamento?error=stripe-not-configured");
  }

  const stripe = getStripe()!;
  const stripeSub = await stripe.subscriptions.retrieve(sub!.stripeSubscriptionId!);
  const itemId = stripeSub.items.data[0]?.id;
  if (!itemId) {
    redirect("/app/abbonamento?error=checkout-failed");
  }

  await stripe.subscriptions.update(sub!.stripeSubscriptionId!, {
    items: [{ id: itemId, price: priceId }],
    metadata: { studioId: studio.id, piano },
    proration_behavior: "create_prorations",
  });

  await prisma.subscription.update({ where: { studioId: studio.id }, data: { plan: piano } });

  redirect("/app/abbonamento?success=1");
}

export async function openBillingPortal() {
  const { studio } = await requireStudio();

  if (!isStripeConfigured() || !studio.subscription?.stripeCustomerId) {
    redirect("/app/abbonamento?error=no-billing-account");
  }

  const stripe = getStripe()!;
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: studio.subscription!.stripeCustomerId!,
    return_url: `${appUrl()}/app/abbonamento`,
  });

  redirect(portalSession.url);
}
