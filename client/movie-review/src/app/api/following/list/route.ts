import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const count = await prisma.userFriend.count({
      where: {
        userId,
      },
    });

    const following = await prisma.userFriend.findMany({
      where: {
        userId,
      },
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    const followingList = following.map((f) => ({
      id: f.friend.id,
      username: f.friend.username,
      profilePicture: f.friend.profilePicture,
      bio: f.friend.bio,
    }));

    return NextResponse.json({
      success: true,
      count,
      following: followingList,
    });
  } catch (error: any) {
    console.error('Get following error:', error);
    return NextResponse.json({ error: 'Failed to get following' }, { status: 500 });
  }
}
