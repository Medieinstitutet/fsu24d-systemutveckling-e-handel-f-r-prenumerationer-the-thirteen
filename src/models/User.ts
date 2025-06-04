import mongoose, {Document, Model, Schema} from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  subscriptionLevel: "free" | "basic" | "pro" | "premium";
}

const UserSchema: Schema<IUser> = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  subscriptionLevel: { type: String, enum: ["free", "basic", "pro", "premium",], default: "free", required: true }
})

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;