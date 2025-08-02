import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';
import { db } from '@/db';
import { users, plans, payments, subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === 'checkout.session.completed') {
    const { userId, planId } = session.metadata!;

    const [plan] = await db.select().from(plans).where(eq(plans.id, planId));

    if (!plan) {
      return new NextResponse('Plan not found', { status: 404 });
    }

    // Create payment record
    await db.insert(payments).values({
      userId: userId,
      planId: planId,
      amount: String(session.amount_total! / 100),
      currency: session.currency!,
      status: 'completed',
      paymentDate: new Date(),
      stripePaymentIntentId: session.payment_intent as string,
    });

    // Create subscription
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationInDays);

    const [subscription] = await db.insert(subscriptions).values({
      userId: userId,
      planId: planId,
      startDate: new Date(),
      endDate: endDate,
      creditsRemaining: plan.credits,
      isActive: true,
      stripeSubscriptionId: session.subscription as string,
    }).returning();

    // Update user
    await db.update(users).set({
      planId: plan.id,
      planName: plan.name,
      credits: plan.credits,
    }).where(eq(users.id, userId));
  }

  return new NextResponse(null, { status: 200 });
}