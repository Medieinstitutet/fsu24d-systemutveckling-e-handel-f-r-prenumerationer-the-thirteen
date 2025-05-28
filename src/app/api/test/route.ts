import { connectDB } from "@/lib/mongoose";
import { NextResponse } from "next/server";
 
export async function GET(): Promise<NextResponse> {
  try {
    await connectDB();
    return NextResponse.json({ message: "DB is connected!" });
  } catch (error) {
    return NextResponse.json(
      { error: "DB connection failed" },
      { status: 500 }
    );
  }
}