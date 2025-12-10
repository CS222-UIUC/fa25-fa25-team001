import { NextRequest, NextResponse } from 'next/server';
import { reorderListItems } from '@/actions/lists';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { itemIds } = body;

    if (!Array.isArray(itemIds)) {
      return NextResponse.json(
        { error: 'itemIds must be an array' },
        { status: 400 }
      );
    }

    const result = await reorderListItems(params.id, itemIds);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Unauthorized' ? 401 : result.error === 'Forbidden' ? 403 : 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering list items:', error);
    return NextResponse.json(
      { error: 'Failed to reorder items' },
      { status: 500 }
    );
  }
}


