import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { friendId } = await request.json();
    if (!friendId) {
      return NextResponse.json({ error: 'Friend ID required' }, { status: 400 });
    }

    if (session.user.id === friendId) {
      return NextResponse.json({ error: 'Cannot add yourself as a friend' }, { status: 400 });
    }

    // Check if friend exists
    const friend = await prisma.user.findUnique({
      where: { id: friendId },
      select: { id: true, username: true },
    });

    if (!friend) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already friends
    const existingFriendship = await prisma.userFriend.findUnique({
      where: {
        userId_friendId: {
          userId: session.user.id,
          friendId: friendId,
        },
      },
    });

    if (existingFriendship) {
      return NextResponse.json({ error: 'Already friends' }, { status: 400 });
    }

    // Create friendship (bidirectional)
    await prisma.userFriend.createMany({
      data: [
        { userId: session.user.id, friendId: friendId },
        { userId: friendId, friendId: session.user.id }, // Mutual friendship
      ],
      skipDuplicates: true,
    });

    return NextResponse.json({ success: true, message: 'Friend added successfully' });
  } catch (error: any) {
    console.error('Add friend error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add friend' },
      { status: 500 }
    );
  }
}

