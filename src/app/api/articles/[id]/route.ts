import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Content from '@/lib/models/Content';

export async function GET(
    _: NextRequest, 
    { params }: { params: { id: string } }

) {
    await connectDB();
    const doc = await Content.findById(params.id).lean();
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 }); 
    return NextResponse.json(doc);
}