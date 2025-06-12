import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  subscriptionLevel: "free" | "basic" | "pro" | "premium";
  role: "customer" | "admin";
  subscriptionStatus?: "active" | "canceled" | "past_due" | "unpaid";
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeDetails?: {

    status?: string;
    cancelAtPeriodEnd?: boolean;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
  };
}

const UserSchema: Schema<IUser> = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  subscriptionLevel: {
    type: String,
    enum: ["free", "basic", "pro", "premium"],
    default: "free",
    required: true,
  },
  role: {
    type: String,
    enum: ["customer", "admin"],
    default: "customer",
    required: true,
  },
  subscriptionStatus: {
    type: String,
    enum: ["active", "canceled", "past_due", "unpaid"],
  },
  subscriptionStartDate: { type: Date }, 
  subscriptionEndDate: { type: Date },
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String },
  stripeDetails: {
    status: { type: String },
    cancelAtPeriodEnd: { type: Boolean },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
  },
});

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
