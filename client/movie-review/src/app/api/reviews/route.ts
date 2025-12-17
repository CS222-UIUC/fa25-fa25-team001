import { NextRequest, NextResponse } from 'next/server';
import { getAllReviews, createReview } from '@/actions/reviews';

export async function GET(request: NextRequest) {
  try {
    const result = await getAllReviews();
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Unauthorized' ? 401 : 500 }
      );
    }

    return NextResponse.json({ success: true, reviews: result.reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mediaType, mediaId, mediaTitle, rating, title, content } = body;

    if (!mediaType || !mediaId || !mediaTitle || !rating || !content) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const result = await createReview({
      mediaType,
      mediaId,
      mediaTitle,
      rating: Number(rating),
      title,
      content,
    });

    if (result.error) {
      console.error('createReview error:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Unauthorized' ? 401 : 400 }
      );
    }

    if (!result.review) {
      console.error('createReview returned no review:', result);
      return NextResponse.json(
        { error: 'Failed to create review: No review returned' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, review: result.review });
  } catch (error) {
    console.error('Error creating review:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error stack:', errorStack);
    return NextResponse.json(
      { error: `Failed to create review: ${errorMessage}` },
      { status: 500 }
    );
  }
}

