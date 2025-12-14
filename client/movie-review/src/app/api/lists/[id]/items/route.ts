import { NextRequest, NextResponse } from 'next/server';
import { addItemToList } from '@/actions/lists';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { itemType, externalId, itemName, itemCover, itemYear, notes } = body;

    if (!itemType || !externalId || !itemName) {
      return NextResponse.json(
        { error: 'itemType, externalId, and itemName are required' },
        { status: 400 }
      );
    }

    if (!['game', 'movie', 'tv'].includes(itemType)) {
      return NextResponse.json(
        { error: 'itemType must be game, movie, or tv' },
        { status: 400 }
      );
    }

    const result = await addItemToList(params.id, {
      itemType: itemType as 'game' | 'movie' | 'tv',
      externalId,
      itemName,
      itemCover,
      itemYear,
      notes,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Unauthorized' ? 401 : result.error === 'Forbidden' ? 403 : 400 }
      );
    }

    return NextResponse.json({ success: true, item: result.item });
  } catch (error) {
    console.error('Error adding item to list:', error);
    return NextResponse.json(
      { error: 'Failed to add item to list' },
      { status: 500 }
    );
  }
}


