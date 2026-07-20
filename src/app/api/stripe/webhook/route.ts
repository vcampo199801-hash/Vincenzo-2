import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe non configurato" }, { status: 501 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Firma mancante" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore di verifica";
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      const studioId = checkoutSession.client_reference_id;
      const subscriptionId =
        typeof checkoutSession.subscription === "string" ? checkoutSession.subscription : checkoutSession.subscription?.id;
      const customerId = typeof checkoutSession.customer === "string" ? checkoutSession.customer : checkoutSession.customer?.id;

      if (studioId && subscriptionId) {
        const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
        await syncSubscription(studioId, stripeSub, customerId);
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.created":
    case "customer.subscription.deleted": {
      const stripeSub = event.data.object as Stripe.Subscription;
      const studioId = stripeSub.metadata?.studioId;
      if (studioId) {
        const customerId = typeof stripeSub.customer === "string" ? stripeSub.customer : stripeSub.customer?.id;
        await syncSubscription(studioId, stripeSub, customerId);
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}

function mapStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case "active":
    case "trialing":
      return status === "trialing" ? "TRIALING" : "ACTIVE";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
    case "incomplete_expired":
      return "CANCELED";
    default:
      return "INCOMPLETE";
  }
}

async function syncSubscription(studioId: string, stripeSub: Stripe.Subscription, customerId?: string) {
  const item = stripeSub.items.data[0];
  const currentPeriodEnd = item?.current_period_end
    ? new Date(item.current_period_end * 1000)
    : null;

  await prisma.subscription.upsert({
    where: { studioId },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: stripeSub.id,
      status: mapStatus(stripeSub.status),
      currentPeriodEnd,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    },
    create: {
      studioId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: stripeSub.id,
      status: mapStatus(stripeSub.status),
      currentPeriodEnd,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    },
  });
}
