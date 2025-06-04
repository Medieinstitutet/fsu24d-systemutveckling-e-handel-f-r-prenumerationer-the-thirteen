import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Content from '@/lib/models/Content';
import type { AccessLevel } from '@/types/access';

export async function GET(req: NextRequest) {
    await connectDB(); 

    const { searchParams } = new URL(req.url); 
    const level = searchParams.get('level') as AccessLevel | null;

    const query = level ? { accessLevel: level } : {};
    const articles = await Content.find(query).lean(); 

    return NextResponse.json(articles); 
}