import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import Stripe from "stripe";

type SubscriptionLevel = "free" | "basic" | "pro" | "premium";

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

interface StripeInvoiceWithSubscription {
  subscription?: string;
  customer?: string;
  lines?: {
    data: Array<{
      price?: {
        id: string;
      };
    }>;
  };
  period_end?: number;
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
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }

  try {
    await connectDB();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_email;
        const priceId = session.metadata?.price_id;
        const customerId = session.customer as string;

        if (!email || !priceId) {
          return NextResponse.json(
            { error: "Missing required data in checkout session" },
            { status: 400 }
          );
        }

        const subscriptionLevel = mapPriceIdToLevel(priceId);

        if (subscriptionLevel === "free") {
          return NextResponse.json(
            { error: "Invalid subscription level" },
            { status: 400 }
          );
        }

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
            updateData.subscriptionEndDate = new Date(
              subscriptionResponse.current_period_end * 1000
            );
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            return NextResponse.json(
              { error: `Error retrieving subscription: ${errorMessage}` },
              { status: 500 }
            );
          }
        } else if (customerId) {
          try {
            const subscriptions = await stripe.subscriptions.list({
              customer: customerId,
              limit: 1,
              status: "active"
            });

            if (subscriptions.data.length > 0) {
              const subscription = subscriptions.data[0];
              updateData.stripeSubscriptionId = subscription.id;
              updateData.subscriptionEndDate = new Date(
                subscription.current_period_end * 1000
              );
            } else {
              const endDate = new Date();
              endDate.setDate(endDate.getDate() + 30);
              updateData.subscriptionEndDate = endDate;
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            return NextResponse.json(
              { error: `Error listing subscriptions: ${errorMessage}` },
              { status: 500 }
            );
          }
        }

        try {
          const user = await User.findOneAndUpdate(
            { email },
            updateData,
            { new: true, upsert: false }
          );

          if (!user) {
            return NextResponse.json(
              { error: `User with email ${email} not found` },
              { status: 404 }
            );
          }

          return NextResponse.json({ success: true });
        } catch (dbError) {
          const errorMessage = dbError instanceof Error ? dbError.message : "Unknown database error";
          return NextResponse.json(
            { error: `Database error: ${errorMessage}` },
            { status: 500 }
          );
        }
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as StripeSubscriptionWithEndDate;
        const customerId = subscription.customer as string;

        if (!subscription.items?.data?.length) {
          return NextResponse.json(
            { error: "No subscription items found" },
            { status: 400 }
          );
        }

        try {
          const customer = await stripe.customers.retrieve(customerId);

          if ("deleted" in customer && customer.deleted) {
            return NextResponse.json(
              { error: "Customer has been deleted" },
              { status: 400 }
            );
          }

          if (!("email" in customer) || !customer.email) {
            return NextResponse.json(
              { error: "No email found for customer" },
              { status: 400 }
            );
          }

          let subscriptionLevel: SubscriptionLevel = "free";
          if (subscription.items?.data?.length > 0) {
            const priceId = subscription.items.data[0].price.id;
            subscriptionLevel = mapPriceIdToLevel(priceId);
          }

          const updateData: SubscriptionUpdateData = {
            stripeCustomerId: customer.id,
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
            subscriptionEndDate: new Date(subscription.current_period_end * 1000),
            subscriptionLevel: subscriptionLevel
          };

          const user = await User.findOneAndUpdate(
            { email: customer.email },
            updateData,
            { new: true }
          );

          if (!user) {
            return NextResponse.json(
              { error: `User with email ${customer.email} not found` },
              { status: 404 }
            );
          }

          return NextResponse.json({ success: true });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          return NextResponse.json(
            { error: `Error processing subscription creation: ${errorMessage}` },
            { status: 500 }
          );
        }
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as StripeSubscriptionWithEndDate;
        let subscriptionLevel: SubscriptionLevel = "free";

        if (subscription.items?.data?.length > 0) {
          const priceId = subscription.items.data[0].price.id;
          subscriptionLevel = mapPriceIdToLevel(priceId);
        }

        const updateData: SubscriptionUpdateData = {
          subscriptionLevel: subscriptionLevel,
          subscriptionEndDate: new Date(subscription.current_period_end * 1000)
        };

        if (subscription.cancel_at_period_end) {
          updateData.subscriptionStatus = "canceled";
        } else {
          updateData.subscriptionStatus = subscription.status;
        }

        try {
          let user = await User.findOneAndUpdate(
            { stripeSubscriptionId: subscription.id },
            updateData,
            { new: true }
          );

          if (!user && subscription.customer) {
            user = await User.findOneAndUpdate(
              { stripeCustomerId: subscription.customer },
              {
                ...updateData,
                stripeSubscriptionId: subscription.id
              },
              { new: true }
            );

            if (!user) {
              try {
                const customer = await stripe.customers.retrieve(subscription.customer as string);
                if ("email" in customer && customer.email) {
                  user = await User.findOneAndUpdate(
                    { email: customer.email },
                    {
                      ...updateData,
                      stripeCustomerId: subscription.customer as string,
                      stripeSubscriptionId: subscription.id
                    },
                    { new: true }
                  );
                }
              } catch (customerError) {
              }
            }
          }

          return NextResponse.json({ success: true });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          return NextResponse.json(
            { error: `Error updating subscription: ${errorMessage}` },
            { status: 500 }
          );
        }
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        try {
          let user = await User.findOneAndUpdate(
            { stripeSubscriptionId: subscription.id },
            {
              subscriptionLevel: "free",
              subscriptionStatus: "canceled",
              subscriptionEndDate: new Date()
            },
            { new: true }
          );

          if (!user && subscription.customer) {
            user = await User.findOneAndUpdate(
              { stripeCustomerId: subscription.customer },
              {
                subscriptionLevel: "free",
                subscriptionStatus: "canceled",
                subscriptionEndDate: new Date()
              },
              { new: true }
            );

            if (!user) {
              try {
                const customer = await stripe.customers.retrieve(subscription.customer as string);
                if ("email" in customer && customer.email) {
                  user = await User.findOneAndUpdate(
                    { email: customer.email },
                    {
                      subscriptionLevel: "free",
                      subscriptionStatus: "canceled",
                      subscriptionEndDate: new Date()
                    },
                    { new: true }
                  );
                }
              } catch (customerError) {
              }
            }
          }

          return NextResponse.json({ success: true });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          return NextResponse.json(
            { error: `Error deleting subscription: ${errorMessage}` },
            { status: 500 }
          );
        }
      }

      case "invoice.payment_succeeded": {
        try {
          const invoice = event.data.object as unknown as StripeInvoiceWithSubscription;
          const subscriptionId = invoice.subscription;
          const customerId = invoice.customer;

          if (!subscriptionId) {
            return NextResponse.json({ 
              received: true,
              message: "No subscription found in invoice"
            });
          }

          try {
            const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
            const subscription = subscriptionResponse as StripeSubscriptionWithEndDate;

            let subscriptionLevel: SubscriptionLevel = "free";
            
            if (invoice.lines?.data?.length > 0) {
              const priceId = invoice.lines.data[0].price?.id;
              if (priceId) {
                subscriptionLevel = mapPriceIdToLevel(priceId);
              }
            }
            
            if (subscriptionLevel === "free" && subscription.items?.data?.length > 0) {
              const priceId = subscription.items.data[0].price.id;
              subscriptionLevel = mapPriceIdToLevel(priceId);
            }

            let user = await User.findOne({ stripeSubscriptionId: subscriptionId });

            if (!user && customerId) {
              user = await User.findOne({ stripeCustomerId: customerId });
              
              if (user) {
                user.stripeSubscriptionId = subscriptionId;
              } else {
                try {
                  const customer = await stripe.customers.retrieve(customerId as string);
                  if ("email" in customer && customer.email) {
                    user = await User.findOne({ email: customer.email });
                    
                    if (user) {
                      user.stripeCustomerId = customerId as string;
                      user.stripeSubscriptionId = subscriptionId;
                    }
                  }
                } catch (customerError) {
                }
              }
            }

            if (!user) {
              return NextResponse.json({ 
                received: true,
                error: "No user found for this subscription or customer"
              });
            }

            if (subscriptionLevel !== "free") {
              user.subscriptionLevel = subscriptionLevel;
            }

            user.subscriptionStatus = "active";
            
            if (subscription.current_period_end) {
              user.subscriptionEndDate = new Date(subscription.current_period_end * 1000);
            }

            await user.save();

            return NextResponse.json({ 
              received: true,
              success: true,
              message: `Subscription level updated to ${subscriptionLevel} for user ${user.email}`
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            return NextResponse.json({ 
              received: true,
              error: `Error processing invoice payment: ${errorMessage}`
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          return NextResponse.json({ 
            received: true,
            error: `Error processing invoice: ${errorMessage}`
          });
        }
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown as StripeInvoiceWithSubscription;
        const subscriptionId = invoice.subscription;
        const customerId = invoice.customer;

        if (!subscriptionId && !customerId) {
          return NextResponse.json({ 
            received: true,
            error: "No subscription or customer found in failed invoice"
          });
        }

        try {
          let user = subscriptionId 
            ? await User.findOne({ stripeSubscriptionId: subscriptionId }) 
            : null;
          
          if (!user && customerId) {
            user = await User.findOne({ stripeCustomerId: customerId });
          }

          if (user) {
            user.subscriptionStatus = "past_due";
            await user.save();
            
            return NextResponse.json({ 
              received: true,
              message: `Marked subscription as past_due for user ${user.email}`
            });
          } else {
            return NextResponse.json({ 
              received: true,
              error: "No user found for this subscription or customer"
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          return NextResponse.json({ 
            received: true,
            error: `Error processing failed invoice: ${errorMessage}`
          });
        }
      }

      default:
        return NextResponse.json({ 
          received: true,
          message: `Unhandled event type: ${event.type}`
        });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { received: true, error: errorMessage },
      { status: 200 }
    );
  }
}
