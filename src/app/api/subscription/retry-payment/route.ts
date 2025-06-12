import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { stripe } from '@/lib/stripe';
import { connectDB } from '@/lib/mongoose';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Du måste vara inloggad för att uppdatera din betalningsinformation' },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'Användaren hittades inte' },
        { status: 404 }
      );
    }

    if (!user.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'Ingen aktiv prenumeration hittades' },
        { status: 400 }
      );
    }

    try {
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
  
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/account`,
      });

      return NextResponse.redirect(session.url);
    } catch (stripeError: any) {
      console.error('Stripe-fel vid uppdatering av betalning:', stripeError);
      return NextResponse.json(
        { error: `Kunde inte skapa en betalningssession: ${stripeError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Fel vid uppdatering av betalning:', error);
    return NextResponse.json(
      { error: 'Ett oväntat fel inträffade: ' + error.message },
      { status: 500 }
    );
  }
}