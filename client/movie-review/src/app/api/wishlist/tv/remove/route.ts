import { NextRequest, NextResponse } from 'next/server';
import { removeTvShowFromWishlist } from '@/actions/wishlist';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: 'itemId is required' },
        { status: 400 }
      );
    }

    const result = await removeTvShowFromWishlist(itemId);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Unauthorized' ? 401 : 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing TV show from wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove TV show from wishlist' },
      { status: 500 }
    );
  }
}


