/**
 * ============================================================================
 * ROUTE: NextAuth Authentication Handler
 * ============================================================================
 * 
 * Endpoint: GET/POST /api/auth/[...nextauth]
 * Purpose: NextAuth.js authentication handler for user sign-in/sign-out
 * 
 * Authentication: Handles authentication, not requires it
 * 
 * Features:
 * - Credentials-based authentication (email/password)
 * - JWT session strategy
 * - Custom sign-in page at /auth/signin
 * - Stores user ID and profile picture in session
 * 
 * This is a catch-all route that handles all NextAuth endpoints:
 * - /api/auth/signin
 * - /api/auth/signout
 * - /api/auth/session
 * - /api/auth/csrf
 * - etc.
 * 
 * ============================================================================
 */

import NextAuth, { NextAuthOptions } from "next-auth"
import { DefaultSession } from "next-auth"
import type { User } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authenticate_user } from "./server_actions"
import prisma from "@/lib/prisma"

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
      display_name: string;
    } & DefaultSession["user"];
  }
  interface User {
    id: string;
    display_name?: string;
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "development-secret-key-change-in-production",
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: 'Sign in',
      credentials: {
        email: { label: 'Email', type: 'email'},
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials || !credentials.email || !credentials.password) {
          return null;
        }
        const user = await authenticate_user(credentials.email, credentials.password);
        if (user) {
          return {
            id: String(user.id),
            email: user.email,
            name: user.username,
            image: user.profilePicture,
          };
        }
        return null;
      },
    }),
    Credentials({
      id: 'google',
      name: 'Google',
      credentials: {
        idToken: { label: 'ID Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials || !credentials.idToken) {
          return null;
        }

        try {
          // Verify the token with Google
          const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credentials.idToken}`);
          
          if (!response.ok) {
            return null;
          }
          
          const data = await response.json();
          
          // Verify the token is for our client
          if (data.aud !== '544117421120-m7dmair6nqjo89pcu2kvsoq4a64h003p.apps.googleusercontent.com') {
            return null;
          }

          if (!data.email) {
            return null;
          }

          // Find or create user
          let user = await prisma.user.findUnique({
            where: { email: data.email },
          });

          if (!user) {
            // Create new user with Google account
            const baseUsername = data.email.split('@')[0];
            let username = baseUsername;
            let counter = 1;

            // Ensure username is unique
            while (await prisma.user.findUnique({ where: { username } })) {
              username = `${baseUsername}${counter}`;
              counter++;
            }

            // Create user with placeholder password
            user = await prisma.user.create({
              data: {
                email: data.email,
                username: username,
                password: 'google_oauth_user', // Placeholder
                profilePicture: data.picture || '/default.jpg',
              },
            });
          } else {
            // Update profile picture if it's different
            if (data.picture && user.profilePicture !== data.picture) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { profilePicture: data.picture },
              });
            }
          }

          return {
            id: String(user.id),
            email: user.email,
            name: user.username,
            image: user.profilePicture,
          };
        } catch (error) {
          console.error('Google authentication error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    // No special signIn callback required for credentials
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          image: token.image as string,
        },
      };
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };