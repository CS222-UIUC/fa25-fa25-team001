import { NextRequest, NextResponse } from 'next/server';
import { isMovieInWishlist } from '@/actions/wishlist';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        { error: 'itemId is required' },
        { status: 400 }
      );
    }

    const isInWishlist = await isMovieInWishlist(itemId);

    return NextResponse.json({ isInWishlist });
  } catch (error) {
    console.error('Error checking movie wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to check wishlist' },
      { status: 500 }
    );
  }
}


