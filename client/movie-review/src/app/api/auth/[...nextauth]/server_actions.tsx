"use server"
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';

export async function register_user(email: string, username: string, password: string) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return { error: 'Email already registered' };
      }
      if (existingUser.username === username) {
        return { error: 'Username already taken' };
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
    });

    return { success: true, user: { id: user.id, email: user.email, username: user.username } };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'Failed to create account' };
  }
}

export async function authenticate_user(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return null;
  }

  // If user record does not have a password, it's not a local account
  if (!user.password) {
    return null;
  }

  // Check that the password is valid
  const passwordValid = await bcrypt.compare(password, user.password!);
  if (!passwordValid) {
    return null;
  }

  // Return the user
  return user;
}
