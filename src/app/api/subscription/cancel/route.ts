import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { stripe } from '@/lib/stripe';
import { connectDB } from '@/lib/mongoose';
import User from '@/models/User';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Du måste vara inloggad för att avbryta din prenumeration' },
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

    console.log(`Avbryter prenumeration för användare: ${user.email}`);
    console.log(`Användardata: ${JSON.stringify({
      level: user.subscriptionLevel,
      status: user.subscriptionStatus,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId
    })}`);

    if (user.subscriptionLevel === 'free') {
      return NextResponse.json(
        { error: 'Du har ingen aktiv prenumeration att avbryta' },
        { status: 400 }
      );
    }

    if (!user.stripeSubscriptionId && user.stripeCustomerId) {
      try {
        console.log(`Söker efter aktiva prenumerationer för customer_id: ${user.stripeCustomerId}`);
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripeCustomerId,
          status: 'active',
          limit: 1
        });
        
        if (subscriptions.data.length > 0) {
          user.stripeSubscriptionId = subscriptions.data[0].id;
          await user.save();
          console.log(`Hittade och sparade prenumerations-ID: ${user.stripeSubscriptionId}`);
        }
      } catch (error) {
        console.error("Fel vid sökning efter prenumerationer via kund-ID:", error);
      }
    }

    if (!user.stripeSubscriptionId && !user.stripeCustomerId) {
      try {
        console.log(`Söker efter Stripe-kund via e-post: ${user.email}`);
        const customers = await stripe.customers.list({
          email: user.email,
          limit: 1
        });
        
        if (customers.data.length > 0) {
          const customerId = customers.data[0].id;
          user.stripeCustomerId = customerId;
          console.log(`Hittade och sparade customer_id: ${customerId}`);
          
          const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
            limit: 1
          });
          
          if (subscriptions.data.length > 0) {
            user.stripeSubscriptionId = subscriptions.data[0].id;
            await user.save();
            console.log(`Hittade och sparade prenumerations-ID via e-postsökning: ${user.stripeSubscriptionId}`);
          }
        }
      } catch (error) {
        console.error("Fel vid sökning efter kund via e-post:", error);
      }
    }

    if (!user.stripeSubscriptionId) {
      console.log("Ingen Stripe-prenumeration hittades, markerar prenumeration som avslutad lokalt");

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);
      
   
      user.subscriptionStatus = "canceled";
      user.subscriptionEndDate = endDate;
      await user.save();

      return NextResponse.json({
        message: 'Din prenumeration kommer att avslutas efter nuvarande period',
        endDate: user.subscriptionEndDate
      });
    }

    console.log(`Avbryter Stripe prenumeration med ID: ${user.stripeSubscriptionId}`);
    try {
      const subscription = await stripe.subscriptions.update(
        user.stripeSubscriptionId, 
        { cancel_at_period_end: true }
      );

      user.subscriptionStatus = "canceled";
      if (subscription.current_period_end) {
        user.subscriptionEndDate = new Date(subscription.current_period_end * 1000);
      }
      await user.save();
      
      console.log(`Prenumeration avbruten, slutdatum: ${user.subscriptionEndDate}`);
      return NextResponse.json({
        message: 'Din prenumeration kommer att avslutas efter nuvarande period',
        endDate: user.subscriptionEndDate
      });
    } catch (stripeError: any) {
      console.error(`Stripe-fel vid avbrytning:`, stripeError);

      if (stripeError.code === 'resource_missing') {
        console.log("Stripe-prenumerationen hittades inte, markerar som avslutad lokalt");
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7);
        
        user.subscriptionStatus = "canceled";
        user.subscriptionEndDate = endDate;
        user.stripeSubscriptionId = undefined;
        await user.save();
        
        return NextResponse.json({
          message: 'Din prenumeration kommer att avslutas efter nuvarande period',
          endDate: user.subscriptionEndDate
        });
      }
      
      throw stripeError;
    }

  } catch (error: any) {
    console.error('Fel vid avbrytning av prenumeration:', error);
    return NextResponse.json(
      { error: 'Kunde inte avbryta prenumerationen: ' + error.message },
      { status: 500 }
    );
  }
}