'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import type { PlatformConnection as PrismaPlatformConnection } from '../generated/prisma';

export interface PlatformConnection {
  id: string;
  platformType: string;
  platformUserId: string | null;
  connectedAt: Date;
  lastSyncedAt: Date | null;
  gamesData: any;
}

/**
 * Get all platform connections for the current user
 */
export async function getUserPlatformConnections(): Promise<{
  success: boolean;
  connections?: PlatformConnection[];
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const connections = await prisma.platformConnection.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      connections: connections.map((conn: PrismaPlatformConnection) => ({
        id: conn.id,
        platformType: conn.platformType,
        platformUserId: conn.platformUserId,
        connectedAt: conn.createdAt,
        lastSyncedAt: conn.lastSyncedAt,
        gamesData: conn.gamesData,
      })),
    };
  } catch (error) {
    console.error('Error fetching platform connections:', error);
    return { success: false, error: 'Failed to fetch connections' };
  }
}

/**
 * Connect a platform account
 */
export async function connectPlatform(data: {
  platformType: string;
  platformUserId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    // Check if connection already exists
    const existing = await prisma.platformConnection.findUnique({
      where: {
        userId_platformType: {
          userId: session.user.id,
          platformType: data.platformType,
        },
      },
    });

    if (existing) {
      return { success: false, error: 'Platform already connected' };
    }

    await prisma.platformConnection.create({
      data: {
        userId: session.user.id,
        platformType: data.platformType,
        platformUserId: data.platformUserId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt,
        gamesData: {},
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error connecting platform:', error);
    return { success: false, error: 'Failed to connect platform' };
  }
}

/**
 * Disconnect a platform account
 */
export async function disconnectPlatform(platformType: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    await prisma.platformConnection.delete({
      where: {
        userId_platformType: {
          userId: session.user.id,
          platformType,
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error disconnecting platform:', error);
    return { success: false, error: 'Failed to disconnect platform' };
  }
}

/**
 * Update platform data (after syncing)
 */
export async function updatePlatformData(
  platformType: string,
  gamesData: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    await prisma.platformConnection.update({
      where: {
        userId_platformType: {
          userId: session.user.id,
          platformType,
        },
      },
      data: {
        gamesData,
        lastSyncedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating platform data:', error);
    return { success: false, error: 'Failed to update platform data' };
  }
}

