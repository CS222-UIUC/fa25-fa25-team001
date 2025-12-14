/**
 * ============================================================================
 * ROUTE: Google OAuth Authentication
 * ============================================================================
 * 
 * Endpoint: POST /api/auth/google
 * Purpose: Authenticate user with Google ID token
 * 
 * Authentication: Not required (public endpoint)
 * 
 * Request Body: { idToken: string }
 * 
 * Returns: { success: boolean, user?: {...}, error?: string }
 * 
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

async function verifyGoogleToken(idToken: string) {
  try {
    // Verify the token with Google
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    // Verify the token is for our client
    if (data.aud !== '544117421120-m7dmair6nqjo89pcu2kvsoq4a64h003p.apps.googleusercontent.com') {
      return null;
    }
    
    return {
      email: data.email,
      name: data.name,
      picture: data.picture,
      sub: data.sub, // Google user ID
    };
  } catch (error) {
    console.error('Error verifying Google token:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Verify the Google ID token
    const googleUser = await verifyGoogleToken(idToken);

    if (!googleUser || !googleUser.email) {
      return NextResponse.json(
        { error: 'Invalid Google token' },
        { status: 401 }
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      // Create new user with Google account
      // Generate a random username from email if needed
      const baseUsername = googleUser.email.split('@')[0];
      let username = baseUsername;
      let counter = 1;

      // Ensure username is unique
      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      // Create user without password (Google OAuth users don't need passwords)
      // We'll use a placeholder password that will never be used
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          username: username,
          password: 'google_oauth_user', // Placeholder - will never be used for login
          profilePicture: googleUser.picture || '/default.jpg',
        },
      });
    } else {
      // Update profile picture if it's different
      if (googleUser.picture && user.profilePicture !== googleUser.picture) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { profilePicture: googleUser.picture },
        });
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error('Google authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

