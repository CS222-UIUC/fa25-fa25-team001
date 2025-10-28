import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ reviews: [] }, { status: 200 });

    const reviews = await prisma.review.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        rating: true,
        createdAt: true,
        movie: { select: { title: true } },
      }
    });

    return NextResponse.json({
      reviews: reviews.map(r => ({
        id: r.id,
        movieTitle: r.movie?.title || 'Untitled',
        rating: r.rating,
        comment: r.content,
        date: r.createdAt.toISOString().split('T')[0],
      }))
    });
  } catch (e) {
    return NextResponse.json({ reviews: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { movieTitle, rating, comment } = await request.json();
    if (!movieTitle || !rating || !comment) {
      return NextResponse.json({ error: 'movieTitle, rating, and comment are required' }, { status: 400 });
    }

    // Find or create movie by title (title is not unique)
    let movie = await prisma.movie.findFirst({ where: { title: movieTitle }, select: { id: true, title: true } });
    if (!movie) {
      movie = await prisma.movie.create({ data: { title: movieTitle }, select: { id: true, title: true } });
    }

    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        movieId: movie.id,
        content: comment,
        rating: Number(rating),
      },
      select: { id: true, createdAt: true }
    });

    return NextResponse.json({
      review: {
        id: review.id,
        movieTitle: movie.title,
        rating: Number(rating),
        comment,
        date: review.createdAt.toISOString().split('T')[0],
      }
    }, { status: 201 });
  } catch (e) {
    console.error('Create review error', e);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}