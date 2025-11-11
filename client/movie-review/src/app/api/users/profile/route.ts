import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    // Get user by username
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        bio: true,
        profilePicture: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get friends count
    const friendsCount = await prisma.userFriend.count({
      where: { userId: user.id },
    });

    // Get reviews count
    const reviewsCount = await prisma.review.count({
      where: { userId: user.id },
    });

    // Check if current user is friends with this user
    let isFriend = false;
    if (session?.user?.id && session.user.id !== user.id) {
      const friendship = await prisma.userFriend.findUnique({
        where: {
          userId_friendId: {
            userId: session.user.id,
            friendId: user.id,
          },
        },
      });
      isFriend = !!friendship;
    }

    return NextResponse.json({
      success: true,
      user,
      friendsCount,
      reviewsCount,
      isFriend,
    });
  } catch (error: any) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get user profile' },
      { status: 500 }
    );
  }
}

