"use server";

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function updateUserProfile(data: {
  username?: string;
  email?: string;
  profilePicture?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    // Check if username is already taken by another user
    if (data.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: data.username,
          id: { not: session.user.id }
        }
      });

      if (existingUser) {
        return { error: 'Username is already taken' };
      }
    }

    // Check if email is already taken by another user
    if (data.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email,
          id: { not: session.user.id }
        }
      });

      if (existingUser) {
        return { error: 'Email is already in use' };
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(data.username && { username: data.username }),
        ...(data.email && { email: data.email }),
        ...(data.profilePicture && { profilePicture: data.profilePicture }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        profilePicture: true,
      }
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error('Profile update error:', error);
    return { error: 'Failed to update profile' };
  }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    // Get user with current password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true }
    });

    if (!user) {
      return { error: 'User not found' };
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return { error: 'Current password is incorrect' };
    }

    // Validate new password
    if (newPassword.length < 6) {
      return { error: 'New password must be at least 6 characters' };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword }
    });

    return { success: true };
  } catch (error) {
    console.error('Password change error:', error);
    return { error: 'Failed to change password' };
  }
}

export async function deleteUserAccount() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    // Delete user and all related data (CASCADE should handle this)
    await prisma.user.delete({
      where: { id: session.user.id }
    });

    return { success: true };
  } catch (error) {
    console.error('Account deletion error:', error);
    return { error: 'Failed to delete account' };
  }
}

export async function getUserProfile() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        profilePicture: true,
        createdAt: true,
        _count: {
          select: {
            reviews: true,
            lists: true,
            movieRatings: true,
          }
        }
      }
    });

    if (!user) {
      return { error: 'User not found' };
    }

    return { success: true, user };
  } catch (error) {
    console.error('Get profile error:', error);
    return { error: 'Failed to get profile' };
  }
}