import { connectDB } from "@/app/lib/mongoose";

 
export async function GET() {
  await connectDB();
  return Response.json({ message: "DB is connected!" });
}