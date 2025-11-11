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

    // Get followers count (users who follow this user)
    const followersCount = await prisma.userFriend.count({
      where: {
        friendId: userId,
      },
    });

    // Get followers list
    const followers = await prisma.userFriend.findMany({
      where: {
        friendId: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            bio: true,
          },
        },
      },
    });

    const followersList = followers.map((f) => ({
      id: f.user.id,
      username: f.user.username,
      profilePicture: f.user.profilePicture,
      bio: f.user.bio,
    }));

    return NextResponse.json({
      success: true,
      count: followersCount,
      followers: followersList,
    });
  } catch (error: any) {
    console.error('Get followers error:', error);
    return NextResponse.json({ error: 'Failed to get followers' }, { status: 500 });
  }
}
