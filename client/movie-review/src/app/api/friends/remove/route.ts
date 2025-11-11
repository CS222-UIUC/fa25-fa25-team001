import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const friendId = searchParams.get('friendId');

    if (!friendId) {
      return NextResponse.json({ error: 'Friend ID required' }, { status: 400 });
    }

    // Remove friendship (both directions)
    await prisma.userFriend.deleteMany({
      where: {
        OR: [
          { userId: session.user.id, friendId: friendId },
          { userId: friendId, friendId: session.user.id },
        ],
      },
    });

    return NextResponse.json({ success: true, message: 'Friend removed successfully' });
  } catch (error: any) {
    console.error('Remove friend error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove friend' },
      { status: 500 }
    );
  }
}

