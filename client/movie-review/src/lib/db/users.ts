import prisma from '@/lib/prisma';

export const userQueries = {
  findByUsername: (username: string) => 
    prisma.user.findMany({
      where: { username: { contains: username, mode: 'insensitive' } },
      select: { id: true, username: true, profilePicture: true },
    }),

  findById: (id: string) =>
    prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, bio: true, profilePicture: true },
    }),

  updateProfile: (id: string, data: { username?: string; bio?: string; profilePicture?: string }) =>
    prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, bio: true, profilePicture: true },
    }),

  getSteamConnection: (userId: string) =>
    prisma.platform_connections.findUnique({
      where: { userId_platformType: { userId, platformType: 'steam' } },
    }),
};