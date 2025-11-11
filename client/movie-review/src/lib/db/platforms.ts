import prisma from '@/lib/prisma';

export const platformQueries = {
  upsertSteamConnection: async (userId: string, steamId: string, gamesData: any[]) => {
    return prisma.platform_connections.upsert({
      where: { userId_platformType: { userId, platformType: 'steam' } },
      update: {
        platformUserId: steamId,
        gamesData,
        lastSyncedAt: new Date(),
        updatedAt: new Date()
      },
      create: {
        id: `steam_${userId}`,
        userId,
        platformType: 'steam',
        platformUserId: steamId,
        gamesData,
        lastSyncedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  },

  getSteamConnection: (userId: string) =>
    prisma.platform_connections.findUnique({
      where: { userId_platformType: { userId, platformType: 'steam' } },
    }),

  upsertXboxConnection: async (userId: string, gamertag: string, gamesData: any[]) => {
    return prisma.platform_connections.upsert({
      where: { userId_platformType: { userId, platformType: 'xbox' } },
      update: {
        platformUserId: gamertag,
        gamesData,
        lastSyncedAt: new Date(),
        updatedAt: new Date()
      },
      create: {
        id: `xbox_${userId}`,
        userId,
        platformType: 'xbox',
        platformUserId: gamertag,
        gamesData,
        lastSyncedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  },

  getXboxConnection: (userId: string) =>
    prisma.platform_connections.findUnique({
      where: { userId_platformType: { userId, platformType: 'xbox' } },
    }),
};