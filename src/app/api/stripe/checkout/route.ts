import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { db } from '@/db';
import { users, plans } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  const { planId } = await req.json();
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id));

  if (!user) {
    return new NextResponse('User not found', { status: 404 });
  }

  const [plan] = await db.select().from(plans).where(eq(plans.id, planId));

  if (!plan) {
    return new NextResponse('Plan not found', { status: 404 });
  }

  let stripeCustomerId = user.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      name: user.name!,
    });
    stripeCustomerId = customer.id;
    await db.update(users).set({ stripeCustomerId }).where(eq(users.id, user.id));
  }

  const stripeSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: plan.name,
            description: plan.description!,
          },
          unit_amount: Number(plan.price) * 100,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.NEXTAUTH_URL}/`,
    cancel_url: `${process.env.NEXTAUTH_URL}/`,
    metadata: {
      userId: user.id,
      planId: plan.id,
    },
  });

  return NextResponse.json({ sessionId: stripeSession.id });
}