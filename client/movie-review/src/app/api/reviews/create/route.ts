import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, content, rating, movieId, videoGameId, tvShowId } = await request.json();

    if (!content || !rating) {
      return NextResponse.json({ error: 'Content and rating are required' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Ensure only one media type is provided
    const mediaTypes = [movieId, videoGameId, tvShowId].filter(Boolean);
    if (mediaTypes.length !== 1) {
      return NextResponse.json({ error: 'Exactly one media type (movie, game, or TV show) must be provided' }, { status: 400 });
    }

    // Create or find the media item if needed
    let finalMovieId = movieId;
    let finalGameId = videoGameId;
    let finalTvShowId = tvShowId;

    // If media doesn't exist, we might need to create it (for external API items)
    // For now, we'll assume the ID is provided and valid

    const review = await prisma.review.create({
      data: {
        title: title || null,
        content,
        rating: Math.round(rating),
        userId: session.user.id,
        movieId: finalMovieId || null,
        videoGameId: finalGameId || null,
        tvShowId: finalTvShowId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create review' },
      { status: 500 }
    );
  }
}

