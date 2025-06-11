import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { SubscriptionLevel } from "@/types/user";
import Stripe from "stripe";


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


interface SubscriptionUpdateData {
  subscriptionLevel?: SubscriptionLevel;
  subscriptionStatus?: string;
  subscriptionEndDate?: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}


interface StripeSubscriptionWithEndDate extends Stripe.Subscription {
  current_period_end: number;
}

interface StripeInvoiceWithSubscription extends Stripe.Invoice {
  subscription?: string;
  customer?: string;
}

export async function POST(req: Request) {
  let event: Stripe.Event;
  
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature") as string;
    
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: Error | unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }

  try {
    
    await connectDB();
    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_email;
        const priceId = session.metadata?.price_id;
        const customerId = session.customer as string;
        
        if (!email) {
          console.error("Missing email in checkout session");
          break;
        }
        
        if (!priceId) {
          console.error("Missing price_id in checkout session metadata");
          break;
        }
        
        const subscriptionLevel = mapPriceIdToLevel(priceId);
        
        if (subscriptionLevel !== "free") {
          console.log(`Updating user ${email} to level ${subscriptionLevel}`);

          
          const updateData: SubscriptionUpdateData = { 
            subscriptionLevel,
            subscriptionStatus: "active",
            stripeCustomerId: customerId
          };
          
          
          if (session.subscription) {
            try {
              
              const subscriptionResponse = await stripe.subscriptions.retrieve(
                session.subscription as string
              );
              
              
              updateData.stripeSubscriptionId = subscriptionResponse.id;
              updateData.subscriptionEndDate = new Date(subscriptionResponse.current_period_end * 1000);
              
              console.log(`Found subscription ${subscriptionResponse.id} with end date: ${updateData.subscriptionEndDate}`);
            } catch (error) {
              console.error(`Failed to retrieve subscription details: ${error}`);
            }
          } else {
            console.log("No subscription ID found in checkout session");
            
            
            try {
              if (customerId) {
                const subscriptions = await stripe.subscriptions.list({
                  customer: customerId,
                  limit: 1,
                  status: 'active'
                });
                
                if (subscriptions.data.length > 0) {
                  const subscription = subscriptions.data[0];
                  updateData.stripeSubscriptionId = subscription.id;
                  updateData.subscriptionEndDate = new Date(subscription.current_period_end * 1000);
                  
                  console.log(`Found subscription ${subscription.id} through customer lookup`);
                }
              }
            } catch (error) {
              console.error(`Failed to lookup subscriptions for customer: ${error}`);
            }
            
            
            if (!updateData.subscriptionEndDate) {
              const endDate = new Date();
              endDate.setDate(endDate.getDate() + 7); 
              updateData.subscriptionEndDate = endDate;
              console.log(`Using default end date: ${endDate}`);
            }
          }
          
          
          console.log(`Updating user ${email} with data:`, updateData);
          
          
          const user = await User.findOneAndUpdate(
            { email },
            updateData,
            { new: true }
          );
          
          if (!user) {
            console.error(`User with email ${email} not found when updating subscription level`);
          } else {
            console.log(`Updated user ${email} with subscription data`);
          }
        }
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as StripeSubscriptionWithEndDate;
        const customerId = subscription.customer as string;
        
        
        if (!subscription.items?.data?.length) {
          console.error(`No subscription items found for subscription ${subscription.id}`);
          break;
        }
        
        try {
          const customer = await stripe.customers.retrieve(customerId);
          
          if ('deleted' in customer && customer.deleted) {
            console.error(`Customer ${customerId} has been deleted`);
            break;
          }
          
          if (!('email' in customer) || !customer.email) {
            console.error(`No email found for customer ${customerId}`);
            break;
          }
          
          console.log(`Creating subscription for user with email ${customer.email}`);
          const user = await User.findOneAndUpdate(
            { email: customer.email },
            {
              stripeCustomerId: customer.id,
              stripeSubscriptionId: subscription.id,
              subscriptionStatus: subscription.status,
              subscriptionEndDate: new Date(subscription.current_period_end * 1000),
            },
            { new: true }
          );
          
          if (!user) {
            console.error(`User with email ${customer.email} not found when creating subscription`);
          } else {
            console.log(`Updated user ${customer.email} with subscription data: ${subscription.id}`);
          }
        } catch (error: Error | unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Error retrieving customer ${customerId}: ${errorMessage}`);
        }
        break;
      }
      
      case "customer.subscription.updated": {
        const subscription = event.data.object as StripeSubscriptionWithEndDate;
        
        console.log(`Updating subscription ${subscription.id} with status ${subscription.status}`);
        
        let subscriptionLevel: SubscriptionLevel = "free";
        
        
        if (subscription.items?.data?.length > 0) {
          const priceId = subscription.items.data[0].price.id;
          subscriptionLevel = mapPriceIdToLevel(priceId);
        } else {
          console.warn(`No items found for subscription ${subscription.id}`);
        }

        
        const updateData: SubscriptionUpdateData = {
          subscriptionLevel: subscriptionLevel,
          subscriptionEndDate: new Date(subscription.current_period_end * 1000)
        };

        
        
        if (subscription.cancel_at_period_end) {
          console.log(`Subscription ${subscription.id} is set to cancel at period end`);
          updateData.subscriptionStatus = "canceled";
        } else {
          
          updateData.subscriptionStatus = subscription.status;
        }

        const user = await User.findOneAndUpdate(
          { stripeSubscriptionId: subscription.id },
          updateData,
          { new: true }
        );
        
        if (!user) {
          console.error(`No user found with subscription ID ${subscription.id}`);
          
          istället
          if (subscription.customer) {
            console.log(`Trying to find user with customer ID: ${subscription.customer}`);
            const userByCustomerId = await User.findOneAndUpdate(
              { stripeCustomerId: subscription.customer },
              {
                ...updateData,
                stripeSubscriptionId: subscription.id
              },
              { new: true }
            );
            
            if (userByCustomerId) {
              console.log(`Updated user ${userByCustomerId.email} with subscription data using customer ID`);
            } else {
              console.error(`No user found with customer ID ${subscription.customer} either`);
            }
          }
        } else {
          console.log(`Updated user ${user.email} to level ${subscriptionLevel} with status ${updateData.subscriptionStatus}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        console.log(`Subscription ${subscription.id} was deleted in Stripe`);
        
        const user = await User.findOneAndUpdate(
          { stripeSubscriptionId: subscription.id },
          {
            subscriptionLevel: "free",
            subscriptionStatus: "canceled",
            
            subscriptionEndDate: new Date()
          },
          { new: true }
        );
        
        if (!user) {
          console.error(`No user found with subscription ID ${subscription.id}`);
          
          
          if (subscription.customer) {
            console.log(`Trying to find user with customer ID: ${subscription.customer}`);
            const userByCustomerId = await User.findOneAndUpdate(
              { stripeCustomerId: subscription.customer },
              {
                subscriptionLevel: "free",
                subscriptionStatus: "canceled",
                subscriptionEndDate: new Date()
              },
              { new: true }
            );
            
            if (userByCustomerId) {
              console.log(`Marked subscription as canceled for user ${userByCustomerId.email} using customer ID`);
            } else {
              console.error(`No user found with customer ID ${subscription.customer} either`);
            }
          }
        } else {
          console.log(`Marked subscription as canceled for user ${user.email}`);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        
        try {
          const invoice = event.data.object as StripeInvoiceWithSubscription;
          const subscriptionId = invoice.subscription;
          const customerId = invoice.customer;
          
          console.log(`Processing invoice.payment_succeeded event for subscription: ${subscriptionId || "unknown"}, customer: ${customerId || "unknown"}`);
          
          if (!subscriptionId) {
            console.log("No subscription found in invoice, skipping");
            return NextResponse.json({ received: true });
          }
          
   
          const periodEnd = invoice.period_end ? new Date(invoice.period_end * 1000) : undefined;
          console.log(`Invoice period end: ${periodEnd ? periodEnd.toISOString() : 'undefined'}`);
          
      
          let subscriptionLevel: SubscriptionLevel | undefined = undefined;
          if (invoice.lines?.data?.length > 0) {
            
            const priceId = invoice.lines.data[0].price?.id;
            if (priceId) {
              subscriptionLevel = mapPriceIdToLevel(priceId);
              console.log(`Mapped subscription level from invoice price: ${subscriptionLevel} (price_id: ${priceId})`);
            }
          }
          
          const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
          const subscription = subscriptionResponse as StripeSubscriptionWithEndDate;
          
          console.log(`Found subscription: ${subscription.id}, status: ${subscription.status}, end date: ${new Date(subscription.current_period_end * 1000)}`);
          
          prenumerationsdata
          if (!subscriptionLevel && subscription.items?.data?.length > 0) {
            const priceId = subscription.items.data[0].price.id;
            subscriptionLevel = mapPriceIdToLevel(priceId);
            console.log(`Mapped subscription level from subscription data: ${subscriptionLevel}`);
          }
          
          
          let user = await User.findOne({ stripeSubscriptionId: subscriptionId });
          
          
          if (!user && customerId) {
            console.log(`No user found with subscription ID ${subscriptionId}, trying customer ID: ${customerId}`);
            user = await User.findOne({ stripeCustomerId: customerId });
            
            if (user) {
              user.stripeSubscriptionId = subscriptionId;
              console.log(`Found user ${user.email} via customer ID, updating subscription ID`);
            }
          }
          
          if (!user && customerId) {
            try {
              const customer = await stripe.customers.retrieve(customerId);
              if ('email' in customer && customer.email) {
                console.log(`Trying to find user with email: ${customer.email}`);
                user = await User.findOne({ email: customer.email });
                
                
                if (user) {
                  user.stripeCustomerId = customerId;
                  user.stripeSubscriptionId = subscriptionId;
                  console.log(`Found user ${user.email} via email, updating Stripe IDs`);
                }
              }
            } catch (customerError) {
              console.error(`Error retrieving customer information: ${customerError}`);
            }
          }
          
          
          if (!user) {
            console.error(`No user found for subscription ${subscriptionId} or customer ${customerId}`);
            return NextResponse.json({ received: true });
          }
           
          console.log(`Updating user ${user.email} with subscription details`);
          
          if (subscriptionLevel && subscriptionLevel !== "free") {
            user.subscriptionLevel = subscriptionLevel;
          }
          
          user.subscriptionStatus = "active";
          
          if (periodEnd) {
            user.subscriptionEndDate = periodEnd;
          } else if (subscription.current_period_end) {
            user.subscriptionEndDate = new Date(subscription.current_period_end * 1000);
          }
          
          
          await user.save();
          
          console.log(`Successfully updated user ${user.email} with subscription details:`, {
            level: user.subscriptionLevel,
            status: user.subscriptionStatus,
            endDate: user.subscriptionEndDate
          });
          
          return NextResponse.json({ received: true });
        } catch (error: any) {
          console.error(`Error processing invoice.payment_succeeded event: ${error.message}`);
          if (error.stack) console.error(error.stack);
          
          return NextResponse.json({ received: true, error: error.message });
        }
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as StripeInvoiceWithSubscription;
        const subscriptionId = invoice.subscription;
        
        if (!subscriptionId) {
          console.log("No subscription found in invoice, skipping");
          break;
        }
        
        console.log(`Invoice payment failed for subscription ${subscriptionId}`);
        
        
        let user = await User.findOne({ stripeSubscriptionId: subscriptionId });
        
        
        if (!user && invoice.customer) {
          console.log(`No user found with subscription ID ${subscriptionId}, trying customer ID: ${invoice.customer}`);
          user = await User.findOne({ stripeCustomerId: invoice.customer });
        }
        
        if (user) {
          user.subscriptionStatus = "past_due";
          await user.save();
          console.log(`Updated subscription status to past_due for user ${user.email}`);
        } else {
          console.error(`No user found for subscription ${subscriptionId} or customer ${invoice.customer}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Webhook error: ${errorMessage}`);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }  
    
    return NextResponse.json(
      { received: true, error: errorMessage },
      { status: 200 }
    );
  }
}
