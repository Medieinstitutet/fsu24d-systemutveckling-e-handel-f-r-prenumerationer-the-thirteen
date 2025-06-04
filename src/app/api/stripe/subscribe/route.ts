import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { level, email } = await req.json();

  const priceMap: Record<string, string> = {
    Explorer: process.env.STRIPE_PRICE_EXPLORER!,
    Odyssey: process.env.STRIPE_PRICE_ODYSSEY!,
    Mastermind: process.env.STRIPE_PRICE_MASTERMINDED!,
  };

  const priceId = priceMap[level];

  if (!priceId) {
    return NextResponse.json(
      { error: "Invalid subscription level" },
      { status: 400 }
    );
  }

  try {
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
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe session error:", err);
    return NextResponse.json(
      { error: "Stripe session failed" },
      { status: 500 }
    );
  }
}
