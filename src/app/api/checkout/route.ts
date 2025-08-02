import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id));

  if (!user) {
    return new NextResponse('User not found', { status: 404 });
  }

  const { priceId } = await req.json();

  try {
    const stripeSession = await stripe.checkout.sessions.create({
      customer: user.stripeCustomerId!,
      payment_method_types: ['card'],
      line_items: [
        { price: priceId, quantity: 1 },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXTAUTH_URL}/`,
      cancel_url: `${process.env.NEXTAUTH_URL}/`,
    });

    return NextResponse.json({ sessionId: stripeSession.id });
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}