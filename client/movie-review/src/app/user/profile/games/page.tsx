'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import MediaStatusHover from '@/components/MediaStatusHover';
import { getMyGames } from '@/actions/media';

export default function MyGamesPage() {
  const { data: session } = useSession();
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameDetails, setGameDetails] = useState<Record<string, { cover?: string; year?: number }>>({});

  useEffect(() => {
    const loadGames = async () => {
      const res = await getMyGames();
      if (!(res as any)?.error && (res as any).games) {
        const gamesList = (res as any).games;
        setGames(gamesList);
        
        // Fetch game details from IGDB
        if (gamesList.length > 0) {
          const gameIds = gamesList.map((g: any) => g.id).filter((id: string) => id);
          const gameTitles = gamesList.map((g: any) => g.title).filter((title: string) => title);
          
          if (gameIds.length > 0 || gameTitles.length > 0) {
            try {
              const params = new URLSearchParams();
              if (gameIds.length > 0) {
                params.append('ids', gameIds.join(','));
              }
              if (gameTitles.length > 0) {
                params.append('titles', gameTitles.join(','));
              }
              
              const detailsRes = await fetch(`/api/games/details?${params.toString()}`);
              const detailsData = await detailsRes.json();
              if (detailsData.success && detailsData.games) {
                const detailsMap: Record<string, { cover?: string; year?: number }> = {};
                
                // Map by both ID and title
                gamesList.forEach((game: any) => {
                  const byId = detailsData.games[game.id];
                  const byTitle = detailsData.games[game.title];
                  const details = byId || byTitle;
                  
                  if (details) {
                    detailsMap[game.id] = {
                      cover: details.cover,
                      year: details.year,
                    };
                  }
                });
                
                setGameDetails(detailsMap);
              }
            } catch (error) {
              console.error('Error fetching game details:', error);
            }
          }
        }
      }
      setLoading(false);
    };
    if (session) {
      loadGames();
    }
  }, [session]);

  const getDefaultCover = () => 'https://via.placeholder.com/300x400?text=No+Cover';

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
        <div className="text-center glass-strong rounded-3xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">Please sign in to view your games</h1>
          <Link href="/auth/signin" className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold py-2 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl glow-soft inline-block">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent drop-shadow-md mb-2">
            My Games
          </h1>
          <p className="text-sky-700 font-medium">Games you've played, completed, or are currently playing</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass-strong rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[3/4] bg-gradient-to-br from-cyan-200 to-teal-200" />
                <div className="p-4">
                  <div className="h-4 bg-sky-200 rounded mb-2" />
                  <div className="h-3 bg-sky-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="glass-strong rounded-2xl p-12 text-center">
            <p className="text-sky-700 text-lg mb-4">You haven't marked any games yet.</p>
            <Link
              href="/games"
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold py-2 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl inline-block"
            >
              Browse Games
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {games.map((game) => (
              <MediaStatusHover
                key={game.id}
                mediaId={game.id}
                mediaType="game"
                mediaTitle={game.title}
                currentStatus={game.status}
              >
                <div className="group glass-strong rounded-2xl overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105 relative">
                  <Link href={`/games/${game.id}`}>
                    <div className="aspect-[3/4] bg-gradient-to-br from-cyan-100 to-teal-100 overflow-hidden rounded-t-2xl">
                      <img
                        src={gameDetails[game.id]?.cover || gameDetails[game.title]?.cover || getDefaultCover()}
                        alt={game.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-sky-800 mb-1 line-clamp-2 group-hover:text-cyan-600 transition-colors">
                        {game.title}
                      </h3>
                      <div className="flex items-center justify-between text-sm text-sky-600">
                        <div className="flex items-center gap-2">
                          {(gameDetails[game.id]?.year || gameDetails[game.title]?.year || game.year) && (
                            <p>{gameDetails[game.id]?.year || gameDetails[game.title]?.year || game.year}</p>
                          )}
                          {game.status && (
                            <span className="text-xs bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-2 py-1 rounded-full">
                              {game.status.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              </MediaStatusHover>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

