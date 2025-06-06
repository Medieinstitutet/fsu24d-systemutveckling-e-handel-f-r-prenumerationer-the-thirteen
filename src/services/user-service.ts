import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { SubscriptionLevel } from "@/types/user";

/**
 * Updates a user's subscription level in the database
 */
export async function updateSubscription(email: string, level: SubscriptionLevel) {
  try {
    await connectDB();
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { subscriptionLevel: level },
      { new: true }
    );
    
    return updatedUser;
  } catch (error) {
    console.error("Failed to update user subscription:", error);
    throw error;
  }
}
