"use server";

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function getUserProfile() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      username: true,
      email: true,
      profilePicture: true,
      createdAt: true,
      _count: {
        select: { reviews: true, lists: true, movieRatings: true },
      },
    },
  });

  if (!user) return { error: 'User not found' } as const;
  return { success: true, user } as const;
}

export async function updateUserProfile(data: { username?: string; email?: string; profilePicture?: string }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  if (data.username) {
    const existing = await prisma.user.findFirst({ where: { username: data.username, id: { not: session.user.id } } });
    if (existing) return { error: 'Username is already taken' } as const;
  }
  if (data.email) {
    const existing = await prisma.user.findFirst({ where: { email: data.email, id: { not: session.user.id } } });
    if (existing) return { error: 'Email is already in use' } as const;
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(data.username && { username: data.username }),
      ...(data.email && { email: data.email }),
      ...(data.profilePicture && { profilePicture: data.profilePicture }),
    },
    select: { id: true, username: true, email: true, profilePicture: true },
  });

  return { success: true, user: updated } as const;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { password: true } });
  if (!user) return { error: 'User not found' } as const;

  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) return { error: 'Current password is incorrect' } as const;

  if (newPassword.length < 6) return { error: 'New password must be at least 6 characters' } as const;

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } });
  return { success: true } as const;
}

export async function deleteUserAccount() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  await prisma.user.delete({ where: { id: session.user.id } });
  return { success: true } as const;
}
