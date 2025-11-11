import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { searchGames, getCoverImageUrl } from '@/lib/api/igdb';

/**
 * GET /api/games/posters
 * Fetches game posters from IGDB for games synced from gaming platforms
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user's favorite games to match posters
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { favoriteGames: true },
    });

    const favoriteGames = (user?.favoriteGames as any[]) || [];
    // Create a map of favorite games by normalized title for quick lookup
    const favoriteGamesMap = new Map<string, any>();
    favoriteGames.forEach((fav: any) => {
      if (fav?.title) {
        const normalizedTitle = fav.title.toLowerCase().trim();
        favoriteGamesMap.set(normalizedTitle, fav);
      }
    });

    // Get user's platform connections
    const connections = await prisma.platformConnection.findMany({
      where: { userId: session.user.id },
      select: { platformType: true, gamesData: true },
    });

    const gamesWithPosters: Array<{
      name: string;
      posterUrl: string;
      platform: string;
      playtimeHours?: number;
      lastPlayed?: string;
      igdbId?: number;
    }> = [];

    // Process each platform's games
    for (const connection of connections) {
      if (!connection.gamesData || !Array.isArray(connection.gamesData)) {
        continue;
      }

      // Handle Nintendo games (stored as { games: [...] })
      const gamesData = connection.gamesData as any;
      const gamesArray = Array.isArray(gamesData?.games) 
        ? gamesData.games 
        : Array.isArray(gamesData) 
        ? gamesData 
        : [];

      // Sort games by last played date (most recent first) and limit to 5 per platform
      const recentGames = gamesArray
        .filter((game: any) => game.name)
        .sort((a: any, b: any) => {
          const aDate = a.lastPlayed ? new Date(a.lastPlayed).getTime() : 0;
          const bDate = b.lastPlayed ? new Date(b.lastPlayed).getTime() : 0;
          return bDate - aDate;
        })
        .slice(0, 5);

      // Fetch posters for each game from IGDB
      for (const game of recentGames) {
        try {
          const normalizedGameName = game.name.toLowerCase().trim();
          const favoriteMatch = favoriteGamesMap.get(normalizedGameName);

          // If game already has posterUrl (like Nintendo games), use it
          if (game.posterUrl && game.igdbId) {
            gamesWithPosters.push({
              name: game.name,
              posterUrl: game.posterUrl,
              platform: connection.platformType,
              playtimeHours: game.playtimeHours,
              lastPlayed: game.lastPlayed,
              igdbId: game.igdbId,
            });
            continue;
          }

          // If we have a matching favorite game, use its posterUrl and igdbId
          if (favoriteMatch?.posterUrl && favoriteMatch?.igdbId) {
            gamesWithPosters.push({
              name: game.name,
              posterUrl: favoriteMatch.posterUrl,
              platform: connection.platformType,
              playtimeHours: game.playtimeHours,
              lastPlayed: game.lastPlayed,
              igdbId: favoriteMatch.igdbId,
            });
            continue;
          }

          // Otherwise, search IGDB for the game (skip for Nintendo if no poster)
          if (connection.platformType === 'nintendo' && !game.posterUrl) {
            // Nintendo games should already have posters, but if not, skip API call
            gamesWithPosters.push({
              name: game.name,
              posterUrl: '',
              platform: connection.platformType,
              playtimeHours: game.playtimeHours,
              lastPlayed: game.lastPlayed,
            });
            continue;
          }

          const igdbResults = await searchGames(game.name, 1);
          
          if (igdbResults.length > 0) {
            const igdbGame = igdbResults[0];
            const posterUrl = igdbGame.cover 
              ? getCoverImageUrl(igdbGame.cover.image_id, 'cover_big')
              : '';

            gamesWithPosters.push({
              name: game.name,
              posterUrl,
              platform: connection.platformType,
              playtimeHours: game.playtimeHours,
              lastPlayed: game.lastPlayed,
              igdbId: igdbGame.id,
            });
          } else {
            // Game not found in IGDB, add without poster
            gamesWithPosters.push({
              name: game.name,
              posterUrl: '',
              platform: connection.platformType,
              playtimeHours: game.playtimeHours,
              lastPlayed: game.lastPlayed,
            });
          }

          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error fetching poster for ${game.name}:`, error);
          // Add game without poster if IGDB fails
          gamesWithPosters.push({
            name: game.name,
            posterUrl: '',
            platform: connection.platformType,
            playtimeHours: game.playtimeHours,
            lastPlayed: game.lastPlayed,
          });
        }
      }
    }

    // Sort all games by last played date (most recent first)
    gamesWithPosters.sort((a, b) => {
      const aDate = a.lastPlayed ? new Date(a.lastPlayed).getTime() : 0;
      const bDate = b.lastPlayed ? new Date(b.lastPlayed).getTime() : 0;
      return bDate - aDate;
    });

    return NextResponse.json({
      success: true,
      games: gamesWithPosters.slice(0, 5), // Limit to 5 most recent games
    });
  } catch (error) {
    console.error('Error fetching game posters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game posters' },
      { status: 500 }
    );
  }
}
