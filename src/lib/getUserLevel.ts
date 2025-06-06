import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { AccessLevel } from '@/types/access'; 

export async function getUserLevel(): Promise<AccessLevel> {
    const session = await getServerSession(authOptions); 
    return (session?.user.subscriptionLevel as AccessLevel) || 'free';
}