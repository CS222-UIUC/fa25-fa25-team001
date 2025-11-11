import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const title = searchParams.get('title');

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const movie = await prisma.movie.findFirst({
      where: {
        title: { equals: title, mode: 'insensitive' },
      },
    });

    return NextResponse.json({ success: true, movie });
  } catch (error: any) {
    console.error('Find movie error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to find movie' },
      { status: 500 }
    );
  }
}

