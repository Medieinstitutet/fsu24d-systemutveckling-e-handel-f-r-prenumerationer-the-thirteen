import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { stripe } from '@/lib/stripe';
import { connectDB } from '@/lib/mongoose';
import User from '@/models/User';

type SubscriptionLevel = 'free' | 'basic' | 'pro' | 'premium';
type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid';

interface StripeDetails {
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAt: Date | null;
}

interface SubscriptionStatusResponse {
  email: string;
  level: SubscriptionLevel;
  status: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  stripeCustomerId: string | undefined;
  stripeSubscriptionId: string | undefined;
  stripeDetails: StripeDetails;
}

function mapPriceIdToLevel(priceId: string): SubscriptionLevel {
  if (priceId === process.env.STRIPE_PRICE_BASIC) {
    return "basic";
  } else if (priceId === process.env.STRIPE_PRICE_PRO) {
    return "pro";
  } else if (priceId === process.env.STRIPE_PRICE_PREMIUM) {
    return "premium";
  }
  return "free";
}

export async function GET(): Promise<NextResponse<SubscriptionStatusResponse | { error: string, details?: string, dbError?: string, dbErrorCode?: string }>> {
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
    
    let stripeDetails: StripeDetails = {...(user.stripeDetails || {})} as StripeDetails;
    let status: SubscriptionStatus = (user.subscriptionStatus as SubscriptionStatus) || "active"; 
    let subscriptionLevel: SubscriptionLevel = user.subscriptionLevel;
    let subscriptionUpdated = false;
    
    if (user.stripeSubscriptionId && user.subscriptionLevel === "free" && status === "active") {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        if (subscription.items?.data?.length > 0) {
          const priceId = subscription.items.data[0].price.id;
          subscriptionLevel = mapPriceIdToLevel(priceId);
          
          user.subscriptionLevel = subscriptionLevel;
          await user.save();
          subscriptionUpdated = true;
        }
      } catch (stripeError: any) {
      }
    }
   
    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        const currentPeriodStart = 
          subscription.items?.data?.[0]?.current_period_start 
          ? new Date(subscription.items.data[0].current_period_start * 1000)
          : new Date(subscription.current_period_start * 1000);
          
        const currentPeriodEnd = 
          subscription.items?.data?.[0]?.current_period_end 
          ? new Date(subscription.items.data[0].current_period_end * 1000)
          : new Date(subscription.current_period_end * 1000);
        
        const cancelAtDate = subscription.cancel_at 
          ? new Date(subscription.cancel_at * 1000) 
          : null;
        
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
            status = subscription.status as SubscriptionStatus;
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
              user.subscriptionLevel = subscriptionLevel;
            }
          }
        }
        
        await user.save();
        
      } catch (stripeError: any) {
      }
    }
    
    if (status !== user.subscriptionStatus) {
      if (["active", "canceled", "past_due", "unpaid"].includes(status)) {
        user.subscriptionStatus = status;
        try {
          await user.save();
        } catch (saveError: any) {
        }
      }
    }
    
    if ((!stripeDetails.currentPeriodEnd || !stripeDetails.currentPeriodStart) && user.stripeDetails) {
      stripeDetails = {
        ...stripeDetails,
        currentPeriodStart: user.stripeDetails.currentPeriodStart || user.subscriptionStartDate || new Date(),
        currentPeriodEnd: user.stripeDetails.currentPeriodEnd || user.subscriptionEndDate || new Date()
      };
    }
    
    if (!stripeDetails.currentPeriodStart) {
      stripeDetails.currentPeriodStart = user.subscriptionStartDate || new Date();
    }
    
    if (!stripeDetails.currentPeriodEnd) {
      stripeDetails.currentPeriodEnd = user.subscriptionEndDate || (() => {
        const estimatedEnd = new Date(stripeDetails.currentPeriodStart);
        estimatedEnd.setDate(estimatedEnd.getDate() + 30);
        return estimatedEnd;
      })();
    }
    
    const response: SubscriptionStatusResponse = {
      email: user.email,
      level: user.subscriptionLevel,
      status: status,
      startDate: user.subscriptionStartDate,
      endDate: user.subscriptionEndDate,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
      stripeDetails: stripeDetails
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: "Det gick inte att hämta prenumerationsstatus",
        details: error.message 
      },
      { status: 500 }
    );
  }
}