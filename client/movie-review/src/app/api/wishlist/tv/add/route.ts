import { NextRequest, NextResponse } from 'next/server';
import { addTvShowToWishlist } from '@/actions/wishlist';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, itemName, itemCover, itemYear } = body;

    if (!itemId || !itemName) {
      return NextResponse.json(
        { error: 'itemId and itemName are required' },
        { status: 400 }
      );
    }

    const result = await addTvShowToWishlist({
      showId: itemId,
      showName: itemName,
      showPoster: itemCover,
      showYear: itemYear,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Unauthorized' ? 401 : 400 }
      );
    }

    return NextResponse.json({ success: true, item: result.item });
  } catch (error) {
    console.error('Error adding TV show to wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to add TV show to wishlist' },
      { status: 500 }
    );
  }
}


