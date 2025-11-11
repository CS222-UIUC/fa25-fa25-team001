import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const movie = await prisma.movie.findUnique({
      where: { id },
    });

    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, movie });
  } catch (error: any) {
    console.error('Get movie error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get movie' },
      { status: 500 }
    );
  }
}

