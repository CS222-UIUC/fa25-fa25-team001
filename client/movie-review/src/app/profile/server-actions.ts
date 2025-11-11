"use server";

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { userQueries } from '@/lib/db/users';
import { platformQueries } from '@/lib/db/platforms';
import { revalidatePath } from 'next/cache';

export async function getUserProfileData() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  const user = await userQueries.findById(session.user.id);
  if (!user) return { error: 'User not found' } as const;
  
  return { success: true, user } as const;
}

export async function getSteamConnection() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  const connection = await platformQueries.getSteamConnection(session.user.id);
  return { success: true, connection } as const;
}

export async function getXboxConnection() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  const connection = await platformQueries.getXboxConnection(session.user.id);
  return { success: true, connection } as const;
}

export async function updateProfile(data: { username?: string; bio?: string; profilePicture?: string }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  try {
    const updatedUser = await userQueries.updateProfile(session.user.id, data);
    revalidatePath('/profile');
    return { success: true, user: updatedUser } as const;
  } catch (error: any) {
    return { error: error.message || 'Failed to update profile' } as const;
  }
}