import { NextRequest, NextResponse } from 'next/server';
import { getList, updateList, deleteList } from '@/actions/lists';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const result = await getList(resolvedParams.id);

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
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const body = await request.json();
    const { title, description, isPublic } = body;

    const result = await updateList(resolvedParams.id, {
      title,
      description,
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
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  console.log('DELETE request received for list');
  
  try {
    // Handle both sync and async params (Next.js 15 compatibility)
    const resolvedParams = params instanceof Promise ? await params : params;
    const listId = resolvedParams.id;

    console.log('Resolved list ID:', listId);

    if (!listId) {
      console.error('No list ID provided');
      return NextResponse.json(
        { error: 'List ID is required' },
        { status: 400 }
      );
    }

    console.log('Calling deleteList with ID:', listId);
    const result = await deleteList(listId);
    console.log('deleteList result:', result);

    if (result.error) {
      console.error('Delete list error:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Unauthorized' ? 401 : result.error === 'Forbidden' ? 403 : 404 }
      );
    }

    console.log('List deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting list:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to delete list: ${errorMessage}` },
      { status: 500 }
    );
  }
}

