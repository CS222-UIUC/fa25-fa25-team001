import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { title, releaseYear, genre, creator, omdbId } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Check if TV show already exists
    const existing = await prisma.tvShow.findFirst({
      where: {
        title: { equals: title, mode: 'insensitive' },
        ...(releaseYear && { releaseYear }),
      },
    });

    if (existing) {
      return NextResponse.json({ success: true, tvShow: existing });
    }

    // Create new TV show
    const tvShow = await prisma.tvShow.create({
      data: {
        title,
        releaseYear: releaseYear || null,
        genre: genre || null,
        creator: creator || null,
      },
    });

    return NextResponse.json({ success: true, tvShow });
  } catch (error: any) {
    console.error('Create TV show error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create TV show' },
      { status: 500 }
    );
  }
}

