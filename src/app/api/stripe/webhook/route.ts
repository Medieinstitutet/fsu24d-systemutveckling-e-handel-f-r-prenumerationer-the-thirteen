import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import User from "@/models/User";
import { connectDB } from "@/lib/mongoose";

export const config = {
  api: {
    bodyParser: false,
  },
};

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const buf = await req.arrayBuffer();
  const body = Buffer.from(buf);
  const sig = req.headers.get("stripe-signature")!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature error:", err);
    return new NextResponse(`Webhook Error: ${err}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;

    console.log("Webhook session received:", session);

    const email = session.customer_email;
    const priceId = session?.metadata?.price_id;

    console.log("Email:", email);
    console.log("Price ID:", priceId);

    const priceToLevel: Record<string, "basic" | "pro" | "premium"> = {
      [process.env.STRIPE_PRICE_BASIC!]: "basic",
      [process.env.STRIPE_PRICE_PRO!]: "pro",
      [process.env.STRIPE_PRICE_PREMIUM!]: "premium",
    };

    const level = priceToLevel[priceId];
    console.log("Matched level:", level);

    if (email && level) {
      try {
        await connectDB();
        const result = await User.findOneAndUpdate(
          { email },
          { subscriptionLevel: level },
          { new: true }
        );

        if (!result) {
          console.warn("No user found with email:", email);
        } else {
          console.log("User updated:", result);
        }
      } catch (dbErr) {
        console.error("DB update failed:", dbErr);
      }
    } else {
      console.warn("Missing email or level");
    }
  }

  return NextResponse.json({ received: true });
}
