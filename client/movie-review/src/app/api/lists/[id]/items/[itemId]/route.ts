import { NextRequest, NextResponse } from 'next/server';
import { removeItemFromList } from '@/actions/lists';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const result = await removeItemFromList(params.id, params.itemId);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Unauthorized' ? 401 : result.error === 'Forbidden' ? 403 : 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing item from list:', error);
    return NextResponse.json(
      { error: 'Failed to remove item from list' },
      { status: 500 }
    );
  }
}


