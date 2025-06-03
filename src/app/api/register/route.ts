import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const {  email, password, subscriptionLevel } = await req.json();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({error: "User already exists"}, {status: 400});
    };

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      subscriptionLevel
    });

    return NextResponse.json({message: "User registered", userId: user._id});
  } catch (error) {
    console.log(error);
  }
}