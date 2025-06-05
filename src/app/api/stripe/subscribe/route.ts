import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { level, email } = await req.json();

    const priceMap: Record<string, string> = {
      basic: process.env.STRIPE_PRICE_BASIC!,
      pro: process.env.STRIPE_PRICE_PRO!,
      premium: process.env.STRIPE_PRICE_PREMIUM!,
    };

    const priceId = priceMap[level.toLowerCase()];
    if (!priceId) {
      return NextResponse.json({ error: "Invalid subscription level" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: process.env.STRIPE_SUCCESS_URL!,
      cancel_url: process.env.STRIPE_CANCEL_URL!,
      customer_email: email,
      metadata: {
        price_id: priceId, 
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe Checkout error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
