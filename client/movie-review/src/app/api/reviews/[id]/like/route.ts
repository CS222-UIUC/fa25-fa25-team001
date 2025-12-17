import { NextRequest, NextResponse } from 'next/server';
import { likeReview } from '@/actions/reviews';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const reviewId = resolvedParams.id;

    if (!reviewId) {
      return NextResponse.json(
        { error: 'Review ID is required' },
        { status: 400 }
      );
    }

    const result = await likeReview(reviewId);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Unauthorized' ? 401 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      liked: result.liked,
      likesCount: result.likesCount,
    });
  } catch (error) {
    console.error('Error liking review:', error);
    return NextResponse.json(
      { error: 'Failed to like review' },
      { status: 500 }
    );
  }
}

