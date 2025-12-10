import { NextRequest, NextResponse } from 'next/server';
import { getList, updateList, deleteList } from '@/actions/lists';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getList(params.id);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Unauthorized' ? 401 : result.error === 'Forbidden' ? 403 : 404 }
      );
    }

    return NextResponse.json({ success: true, list: result.list });
  } catch (error) {
    console.error('Error fetching list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch list' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, description, mediaType, isPublic } = body;

    const result = await updateList(params.id, {
      title,
      description,
      mediaType,
      isPublic,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Unauthorized' ? 401 : result.error === 'Forbidden' ? 403 : 404 }
      );
    }

    return NextResponse.json({ success: true, list: result.list });
  } catch (error) {
    console.error('Error updating list:', error);
    return NextResponse.json(
      { error: 'Failed to update list' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await deleteList(params.id);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Unauthorized' ? 401 : result.error === 'Forbidden' ? 403 : 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting list:', error);
    return NextResponse.json(
      { error: 'Failed to delete list' },
      { status: 500 }
    );
  }
}

