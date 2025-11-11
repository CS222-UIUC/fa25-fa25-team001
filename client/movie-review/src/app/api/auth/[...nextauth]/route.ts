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
    async redirect({ url, baseUrl }) {
      // Handle infinite redirect loops
      if (url.includes('/auth/signin') && url.includes('callbackUrl')) {
        try {
          const urlObj = new URL(url, baseUrl);
          const callbackUrl = urlObj.searchParams.get('callbackUrl');
          
          // If callback URL also points to signin or has multiple encodings, break the loop
          if (callbackUrl && (
            callbackUrl.includes('/auth/signin') || 
            callbackUrl.includes('%2Fauth%2Fsignin') ||
            callbackUrl.includes('%252F')
          )) {
            return baseUrl; // Redirect to home instead
          }
        } catch (e) {
          return baseUrl;
        }
      }
      
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      try {
        if (new URL(url).origin === new URL(baseUrl).origin) return url;
      } catch (e) {
        // Invalid URL, return baseUrl
      }
      return baseUrl;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.image = user.image;
        token.name = user.name;
      }
      
      // Handle session updates (when update() is called) - fetch fresh data from DB
      if (trigger === "update") {
        if (token.id) {
          try {
            const prisma = (await import("@/lib/prisma")).default;
            const freshUser = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: {
                username: true,
                profilePicture: true,
              },
            });
            
            if (freshUser) {
              token.name = freshUser.username;
              token.image = freshUser.profilePicture;
            }
          } catch (error) {
            console.error("Error fetching fresh user data:", error);
          }
        }
        
        // Also use any data passed in the session update
        if (session?.user?.name !== undefined) {
          token.name = session.user.name;
        }
        if (session?.user?.image !== undefined) {
          token.image = session.user.image;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          name: token.name as string,
          display_name: token.name as string,
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