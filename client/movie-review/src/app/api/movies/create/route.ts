import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { title, releaseYear, genre, director, omdbId } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Check if movie already exists
    const existing = await prisma.movie.findFirst({
      where: {
        title: { equals: title, mode: 'insensitive' },
        ...(releaseYear && { releaseYear }),
      },
    });

    if (existing) {
      return NextResponse.json({ success: true, movie: existing });
    }

    // Create new movie
    const movie = await prisma.movie.create({
      data: {
        title,
        releaseYear: releaseYear || null,
        genre: genre || null,
        director: director || null,
      },
    });

    return NextResponse.json({ success: true, movie });
  } catch (error: any) {
    console.error('Create movie error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create movie' },
      { status: 500 }
    );
  }
}

