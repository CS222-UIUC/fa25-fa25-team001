import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { title, releaseYear, genre, creator, omdbId, poster } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Check if TV show already exists by title (case-insensitive)
    const existing = await prisma.tvShow.findFirst({
      where: {
        title: { equals: title, mode: 'insensitive' },
        ...(releaseYear && { releaseYear }),
      },
    });

    if (existing) {
      return NextResponse.json({ success: true, tvShow: existing });
    }

    // Create new TV show using OMDB ID as the database ID if provided
    const tvShow = await prisma.tvShow.create({
      data: {
        ...(omdbId && { id: omdbId }), // Use OMDB ID as database ID for consistency
        title,
        releaseYear: releaseYear || null,
        genre: genre || null,
        creator: creator || null,
        poster: poster && poster !== 'N/A' ? poster : null,
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

