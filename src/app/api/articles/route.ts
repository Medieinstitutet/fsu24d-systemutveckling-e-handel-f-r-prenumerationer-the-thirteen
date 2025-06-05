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
};

export async function POST(req: NextRequest) {
    await connectDB();

    const articleBody = await req.json();
    const { title, body, accessLevel } = articleBody;

    if (!title || !body || !accessLevel) {
        return NextResponse.json(
            { message: 'Missing required properties.'},
            { status: 400 }
        );
    };

    try {
        const newArticle = await Content.create({
            title,
            body,
            accessLevel
        });

        return NextResponse.json(
            { message: "Article created:", article: newArticle },
            { status: 201 }
        );

    } catch (error) {
        console.error("Error creating article", error)
        return NextResponse.json(
            { message: "Server error", error },
            { status: 500 }
        );
    };
};