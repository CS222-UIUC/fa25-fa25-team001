import { NextRequest, NextResponse } from 'next/server';
import { getMyLists, createList } from '@/actions/lists';

export async function GET(request: NextRequest) {
  try {
    const result = await getMyLists();
    return NextResponse.json({ success: true, lists: result.lists });
  } catch (error) {
    console.error('Error fetching lists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lists' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, mediaType, isPublic } = body;

    console.log('Creating list with data:', { title, description, mediaType, isPublic });

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const result = await createList({
      title: title.trim(),
      description: description?.trim(),
      mediaType: mediaType || null,
      isPublic: isPublic !== undefined ? isPublic : true,
    });

    console.log('Create list result:', result);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Unauthorized' ? 401 : 400 }
      );
    }

    if (!result.list) {
      return NextResponse.json(
        { error: 'List was not created' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, list: result.list });
  } catch (error) {
    console.error('Error creating list:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create list: ${errorMessage}` },
      { status: 500 }
    );
  }
}

