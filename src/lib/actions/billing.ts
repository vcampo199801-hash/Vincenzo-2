"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/auth-guards";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function startCheckout() {
  const { session, studio } = await requireStudio();

  if (!isStripeConfigured()) {
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
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${appUrl()}/app/abbonamento?success=1`,
    cancel_url: `${appUrl()}/app/abbonamento?canceled=1`,
    client_reference_id: studio.id,
    subscription_data: { metadata: { studioId: studio.id } },
  });

  if (!checkoutSession.url) {
    redirect("/app/abbonamento?error=checkout-failed");
  }
  redirect(checkoutSession.url);
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
