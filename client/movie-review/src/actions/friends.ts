"use server";

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

/**
 * Search for users by username
 */
export async function searchUsers(query: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  if (!query || query.trim().length < 2) {
    return { users: [] } as const;
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: query.trim(),
          mode: 'insensitive',
        },
        id: {
          not: session.user.id, // Exclude current user
        },
      },
      select: {
        id: true,
        username: true,
        profilePicture: true,
        createdAt: true,
        _count: {
          select: {
            reviews: true,
            lists: true,
            friends: true,
          },
        },
      },
      take: 20,
    });

    return { users } as const;
  } catch (error) {
    console.error('Error searching users:', error);
    return { error: 'Failed to search users' } as const;
  }
}

/**
 * Get public profile of a user by username
 */
export async function getPublicProfile(username: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        profilePicture: true,
        createdAt: true,
        _count: {
          select: {
            reviews: true,
            lists: true,
            friends: true,
            friendOf: true,
          },
        },
      },
    });

    if (!user) {
      return { error: 'User not found' } as const;
    }

    // Check if current user is friends with this user
    const isFriend = await prisma.userFriend.findFirst({
      where: {
        OR: [
          { userId: session.user.id, friendId: user.id },
          { userId: user.id, friendId: session.user.id },
        ],
      },
    });

    return {
      user: {
        ...user,
        isFriend: !!isFriend,
        isCurrentUser: user.id === session.user.id,
      },
    } as const;
  } catch (error) {
    console.error('Error fetching public profile:', error);
    return { error: 'Failed to fetch profile' } as const;
  }
}

/**
 * Get current user's friends list
 */
export async function getFriends() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  try {
    const friends = await prisma.userFriend.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        friend: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            createdAt: true,
            _count: {
              select: {
                reviews: true,
                lists: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      friends: friends.map((f) => ({
        id: f.friend.id,
        username: f.friend.username,
        profilePicture: f.friend.profilePicture,
        createdAt: f.friend.createdAt,
        reviewsCount: f.friend._count.reviews,
        listsCount: f.friend._count.lists,
        addedAt: f.createdAt,
      })),
    } as const;
  } catch (error) {
    console.error('Error fetching friends:', error);
    return { error: 'Failed to fetch friends' } as const;
  }
}

/**
 * Add a friend
 */
export async function addFriend(friendId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  if (friendId === session.user.id) {
    return { error: 'Cannot add yourself as a friend' } as const;
  }

  try {
    // Check if user exists
    const friend = await prisma.user.findUnique({
      where: { id: friendId },
      select: { id: true },
    });

    if (!friend) {
      return { error: 'User not found' } as const;
    }

    // Check if already friends
    const existing = await prisma.userFriend.findFirst({
      where: {
        userId: session.user.id,
        friendId: friendId,
      },
    });

    if (existing) {
      return { error: 'Already friends' } as const;
    }

    // Add friend
    await prisma.userFriend.create({
      data: {
        userId: session.user.id,
        friendId: friendId,
      },
    });

    return { success: true } as const;
  } catch (error) {
    console.error('Error adding friend:', error);
    return { error: 'Failed to add friend' } as const;
  }
}

/**
 * Remove a friend
 */
export async function removeFriend(friendId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  try {
    await prisma.userFriend.deleteMany({
      where: {
        userId: session.user.id,
        friendId: friendId,
      },
    });

    return { success: true } as const;
  } catch (error) {
    console.error('Error removing friend:', error);
    return { error: 'Failed to remove friend' } as const;
  }
}

