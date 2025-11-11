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

    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (userId === session.user.id) {
      return NextResponse.json({ error: 'You cannot follow yourself' }, { status: 400 });
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // For now, we'll use a workaround: create a one-way friend relationship
    // This represents "following" - the follower follows the user but it's not mutual
    const existingFollow = await prisma.userFriend.findFirst({
      where: {
        userId: session.user.id,
        friendId: userId,
      },
    });

    if (existingFollow) {
      return NextResponse.json({ error: 'Already following this user' }, { status: 400 });
    }

    await prisma.userFriend.create({
      data: {
        userId: session.user.id,
        friendId: userId,
      },
    });

    return NextResponse.json({ success: true, message: 'Now following user' });
  } catch (error: any) {
    console.error('Follow error:', error);
    return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 });
  }
}
