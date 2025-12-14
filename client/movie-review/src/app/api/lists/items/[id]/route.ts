import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: itemId } = await params;

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    // Verify the item belongs to a list owned by the user
    const listItem = await prisma.listItem.findUnique({
      where: { id: itemId },
      include: {
        list: true,
      },
    });

    if (!listItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (listItem.list.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.listItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete list item error:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}
