import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || session.user.id;

    // Get user's friends
    const friendships = await prisma.userFriend.findMany({
      where: { userId },
      include: {
        friend: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            bio: true,
          },
        },
      },
    });

    const friends = friendships.map((f) => ({
      id: f.friend.id,
      username: f.friend.username,
      profilePicture: f.friend.profilePicture,
      bio: f.friend.bio,
      friendsSince: f.createdAt,
    }));

    // Get friend count
    const friendCount = await prisma.userFriend.count({
      where: { userId },
    });

    return NextResponse.json({
      success: true,
      friends,
      count: friendCount,
    });
  } catch (error: any) {
    console.error('Get friends error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get friends' },
      { status: 500 }
    );
  }
}

