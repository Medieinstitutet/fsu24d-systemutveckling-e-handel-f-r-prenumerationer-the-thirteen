import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { stripe } from '@/lib/stripe';
import { connectDB } from '@/lib/mongoose';
import User from '@/models/User';

function mapPriceIdToLevel(priceId: string): 'free' | 'basic' | 'pro' | 'premium' {
  if (priceId === process.env.STRIPE_PRICE_BASIC) {
    return "basic";
  } else if (priceId === process.env.STRIPE_PRICE_PRO) {
    return "pro";
  } else if (priceId === process.env.STRIPE_PRICE_PREMIUM) {
    return "premium";
  }
  return "free";
}

export async function GET() {
  try {
  
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Du måste vara inloggad för att se din prenumerationsstatus' },
        { status: 401 }
      );
    }

    
    try {
      await connectDB();
    } catch (dbError: any) {
      console.error('DB anslutningsfel i status endpoint:', dbError.message);
      return NextResponse.json(
        { 
          error: 'Kunde inte hämta prenumerationsstatus på grund av databasfel', 
          dbError: dbError.message,
          dbErrorCode: dbError.code || 'UNKNOWN'
        },
        { status: 503 } 
      );
    }

    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'Användaren hittades inte' },
        { status: 404 }
      );
    }

    console.log(`Hämtar prenumerationsstatus för användare: ${user.email}`);
    
    
    let stripeDetails: any = {...(user.stripeDetails || {})};
    let status = user.subscriptionStatus || "free";
    let subscriptionLevel = user.subscriptionLevel;
    let subscriptionUpdated = false;
    
    if (user.stripeSubscriptionId && user.subscriptionLevel === "free" && status === "active") {
      console.log(`Användare ${user.email} har en aktiv prenumeration men är markerad som "free". Försöker korrigera...`);
      
      try {

        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        if (subscription.items?.data?.length > 0) {
          const priceId = subscription.items.data[0].price.id;
          subscriptionLevel = mapPriceIdToLevel(priceId);
          
          console.log(`Korrigerar prenumerationsnivå för ${user.email} från "free" till "${subscriptionLevel}" baserat på priceId: ${priceId}`);
          
     
          user.subscriptionLevel = subscriptionLevel;
          await user.save();
          subscriptionUpdated = true;
          
          console.log(`Prenumerationsnivå för ${user.email} har uppdaterats till ${subscriptionLevel}`);
        }
      } catch (stripeError: any) {
        console.error(`Fel vid hämtning av prenumerationsdetaljer för korrigering:`, stripeError.message);
      }
    }
   
    if (user.stripeSubscriptionId) {
      try {
        console.log(`Hämtar Stripe-prenumeration med ID: ${user.stripeSubscriptionId}`);
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        const currentPeriodStart = 
          subscription.items?.data?.[0]?.current_period_start 
          ? new Date(subscription.items.data[0].current_period_start * 1000)
          : new Date(subscription.current_period_start * 1000);
          
        const currentPeriodEnd = 
          subscription.items?.data?.[0]?.current_period_end 
          ? new Date(subscription.items.data[0].current_period_end * 1000)
          : new Date(subscription.current_period_end * 1000);
        
        console.log(`Prenumerationsstatus: ${subscription.status}, cancel_at_period_end: ${subscription.cancel_at_period_end}`);
        console.log(`Period: ${currentPeriodStart} till ${currentPeriodEnd}`);
        
        
        const cancelAtDate = subscription.cancel_at 
          ? new Date(subscription.cancel_at * 1000) 
          : null;
          
        if (cancelAtDate) {
          console.log(`Prenumeration avbryts: ${cancelAtDate}`);
        }
        
        stripeDetails = {
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodStart: currentPeriodStart,
          currentPeriodEnd: currentPeriodEnd,
          cancelAt: cancelAtDate
        };
        
        
        user.stripeDetails = stripeDetails;
        
        
        if (subscription.cancel_at_period_end) {
          status = "canceled";
          
          user.subscriptionEndDate = currentPeriodEnd;
        } else {
          
          if (["active", "past_due", "unpaid"].includes(subscription.status)) {
            status = subscription.status;
          }
        }
        
    
        if (!user.subscriptionStartDate) {
          user.subscriptionStartDate = currentPeriodStart;
        }
        
        if (subscription.status === "active" && user.subscriptionLevel === "free" && !subscriptionUpdated) {
          if (subscription.items?.data?.length > 0) {
            const priceId = subscription.items.data[0].price.id;
            subscriptionLevel = mapPriceIdToLevel(priceId);
            
            if (subscriptionLevel !== "free") {
              console.log(`Uppdaterar prenumerationsnivå för ${user.email} från "free" till "${subscriptionLevel}"`);
              user.subscriptionLevel = subscriptionLevel;
            }
          }
        }
        
        await user.save();
        console.log(`Uppdaterade användarens prenumerationsuppgifter i databasen`);
        
      } catch (stripeError: any) {
        console.error("Fel vid hämtning av Stripe-prenumeration:", stripeError.message);
      }
    }
    
   
    if (status !== user.subscriptionStatus) {
      console.log(`Uppdaterar status från ${user.subscriptionStatus} till ${status}`);
      user.subscriptionStatus = status;
      try {
        await user.save();
      } catch (saveError: any) {
        console.error("Kunde inte spara användarens statusuppdatering:", saveError.message);
      }
    }
    
   
    if ((!stripeDetails.currentPeriodEnd || !stripeDetails.currentPeriodStart) && user.stripeDetails) {
      stripeDetails = {
        ...stripeDetails,
        currentPeriodStart: user.stripeDetails.currentPeriodStart || user.subscriptionStartDate,
        currentPeriodEnd: user.stripeDetails.currentPeriodEnd || user.subscriptionEndDate
      };
    }
    
   
    if (!stripeDetails.currentPeriodStart) {
      stripeDetails.currentPeriodStart = user.subscriptionStartDate || new Date();
    }
    
    if (!stripeDetails.currentPeriodEnd) {
      stripeDetails.currentPeriodEnd = user.subscriptionEndDate;
      
     
      if (!stripeDetails.currentPeriodEnd) {
        const estimatedEnd = new Date(stripeDetails.currentPeriodStart);
        estimatedEnd.setDate(estimatedEnd.getDate() + 30);
        stripeDetails.currentPeriodEnd = estimatedEnd;
      }
    }
    
   
    const response = {
      email: user.email,
      level: user.subscriptionLevel,
      status: status,
      startDate: user.subscriptionStartDate,
      endDate: user.subscriptionEndDate,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
      stripeDetails: stripeDetails
    };
    
    console.log(`Returnerar prenumerationsdata: ${JSON.stringify(response)}`);
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error("Fel vid hämtning av prenumerationsstatus:", error.message);
    return NextResponse.json(
      { 
        error: "Det gick inte att hämta prenumerationsstatus",
        details: error.message 
      },
      { status: 500 }
    );
  }
}