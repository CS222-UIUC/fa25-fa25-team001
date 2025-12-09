import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const movieId = searchParams.get('movieId');
    const videoGameId = searchParams.get('videoGameId');
    const tvShowId = searchParams.get('tvShowId');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (userId) where.userId = userId;
    if (movieId) where.movieId = movieId;
    if (videoGameId) where.videoGameId = videoGameId;
    if (tvShowId) where.tvShowId = tvShowId;

    const reviews = await prisma.review.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
        movie: {
          select: {
            id: true,
            title: true,
            poster: true,
          },
        },
        videoGame: {
          select: {
            id: true,
            title: true,
            cover: true,
          },
        },
        tvShow: {
          select: {
            id: true,
            title: true,
            poster: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, reviews });
  } catch (error: any) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get reviews' },
      { status: 500 }
    );
  }
}

