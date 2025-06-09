import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";

export async function updateSubscription(
  email: string,
  level: "free" | "basic" | "pro" | "premium"
) {
  if (!email || !level) {
    throw new Error("Email and subscription level are required");
  }

  try {
    await connectDB();

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { subscriptionLevel: level },
      { new: true }
    );

    if (!updatedUser) {
      console.warn(`Ingen användare hittades med e-post: ${email}`);
    }

    return updatedUser;
  } catch (error) {
    console.error("Fel vid uppdatering av prenumerationsnivå:", error);
    throw new Error("Failed to update subscription level");
  }
}
