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