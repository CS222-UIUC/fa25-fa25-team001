/**
 * ============================================================================
 * PAGE: Game Detail Page
 * ============================================================================
 * Route: /games/[id]
 * Purpose: Display detailed information about a specific game
 * Features:
 *   - Game information from IGDB (cover, name, rating, genres, platforms, summary)
 *   - HowLongToBeat completion time data (Main Story, Main + Extras, Completionist)
 *   - Links back to games browse page
 * ============================================================================
 */

import { getGame, getCoverImageUrl } from '@/lib/api/igdb';
import Header from '@/components/Header';
import Image from 'next/image';
import Link from 'next/link';
import { headers } from 'next/headers';

type PageProps = {
  params: { id: string };
};

interface Game {
  id: number;
  name: string;
  slug?: string;
  summary?: string;
  genres?: Array<{ name: string }>;
  platforms?: Array<{ name: string }>;
  rating?: number;
  rating_count?: number;
  cover?: { image_id: string };
  first_release_date?: number;
  storyline?: string;
}

interface HowLongToBeatData {
  name: string;
  imageUrl?: string;
  gameplayMain?: number;
  gameplayMainExtra?: number;
  gameplayCompletionist?: number;
  similarity?: number;
  playableOn?: string[];
}

async function getHowLongToBeatData(gameName: string): Promise<HowLongToBeatData | null> {
  try {
    // Use the API route instead of direct import - this avoids 403 errors
    // Construct the URL using headers for server components
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;
    
    const response = await fetch(`${baseUrl}/api/hltb?q=${encodeURIComponent(gameName)}`, {
      cache: 'no-store', // Don't cache to get fresh data
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      // If it's a 503 (rate limited), just return null gracefully
      if (response.status === 503) {
        console.warn('HowLongToBeat rate limited');
        return null;
      }
      return null;
    }
    
    const result = await response.json();
    
    if (!result.success || !result.data) {
      return null;
    }
    
    // Log the data for debugging
    console.log('HowLongToBeat data received:', {
      name: result.data.name,
      gameplayMain: result.data.gameplayMain,
      gameplayMainExtra: result.data.gameplayMainExtra,
      gameplayCompletionist: result.data.gameplayCompletionist,
    });
    
    return {
      name: result.data.name,
      imageUrl: result.data.imageUrl,
      gameplayMain: result.data.gameplayMain,
      gameplayMainExtra: result.data.gameplayMainExtra,
      gameplayCompletionist: result.data.gameplayCompletionist,
      similarity: result.data.similarity,
      playableOn: result.data.playableOn,
    };
  } catch (error) {
    // Silently handle errors - HowLongToBeat may have rate limits or block requests
    console.error('Error in getHowLongToBeatData:', error);
    return null;
  }
}

function formatTime(hours: number | undefined): string {
  if (!hours) return 'N/A';
  if (hours < 1) return '< 1 hour';
  if (hours === 1) return '1 hour';
  return `${hours} hours`;
}

export default async function GameDetailPage({ params }: PageProps) {
  const gameId = parseInt(params.id);
  
  if (isNaN(gameId)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-sky-800 mb-4">Invalid Game ID</h1>
            <Link href="/games" className="text-cyan-600 hover:text-cyan-500">
              Return to Games
            </Link>
          </div>
        </div>
      </div>
    );
  }

  let game: Game | undefined;
  try {
    game = await getGame(gameId) as Game | undefined;
  } catch (error) {
    console.error('Error fetching game:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-sky-800 mb-4">Game Not Found</h1>
            <Link href="/games" className="text-cyan-600 hover:text-cyan-500">
              Return to Games
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-sky-800 mb-4">Game Not Found</h1>
            <Link href="/games" className="text-cyan-600 hover:text-cyan-500">
              Return to Games
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fetch HowLongToBeat data
  const hltbData = await getHowLongToBeatData(game.name);

  const coverUrl = game.cover?.image_id
    ? getCoverImageUrl(game.cover.image_id, 'cover_big')
    : null;

  const releaseYear = game.first_release_date
    ? new Date(game.first_release_date * 1000).getFullYear()
    : null;

  const rating = game.rating ? (game.rating / 10).toFixed(1) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Game Header */}
        <section className="glass-strong rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
            <div className="relative w-full h-[400px] rounded-xl overflow-hidden bg-gradient-to-br from-cyan-100 to-teal-100">
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={game.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sky-600 font-medium">
                  No Cover
                </div>
              )}
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-4xl font-bold text-sky-800 mb-2">{game.name}</h1>
                <div className="flex items-center gap-4 text-sm text-sky-600">
                  {releaseYear && <span>{releaseYear}</span>}
                  {rating && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="flex items-center text-amber-500">
                        ⭐ {rating}/10
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              {game.genres && game.genres.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-sky-700 mb-2">Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {game.genres.map((genre: any, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-cyan-500/20 text-cyan-800 rounded-full text-sm"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {game.platforms && game.platforms.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-sky-700 mb-2">Platforms</h3>
                  <div className="flex flex-wrap gap-2">
                    {game.platforms.map((platform: any, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-teal-500/20 text-teal-800 rounded-full text-sm"
                      >
                        {platform.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {game.summary && (
                <div>
                  <h3 className="text-sm font-semibold text-sky-700 mb-2">Summary</h3>
                  <p className="text-base leading-7 text-sky-800">{game.summary}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* HowLongToBeat Section */}
        {hltbData && (
          <section className="glass-strong rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-sky-800 mb-4">How Long To Beat</h2>
            {hltbData.name && (
              <p className="text-sm text-sky-600 mb-4">
                Data for: <span className="font-semibold">{hltbData.name}</span>
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(hltbData.gameplayMain !== undefined && hltbData.gameplayMain !== null && hltbData.gameplayMain > 0) ? (
                <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-sky-700 mb-2">Main Story</h3>
                  <p className="text-2xl font-bold text-sky-800">{formatTime(hltbData.gameplayMain)}</p>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-gray-200/20 to-gray-300/20 rounded-xl p-4 opacity-50">
                  <h3 className="text-sm font-semibold text-sky-700 mb-2">Main Story</h3>
                  <p className="text-2xl font-bold text-sky-800">N/A</p>
                </div>
              )}
              {(hltbData.gameplayMainExtra !== undefined && hltbData.gameplayMainExtra !== null && hltbData.gameplayMainExtra > 0) ? (
                <div className="bg-gradient-to-br from-teal-500/20 to-teal-600/20 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-sky-700 mb-2">Main + Extras</h3>
                  <p className="text-2xl font-bold text-sky-800">{formatTime(hltbData.gameplayMainExtra)}</p>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-gray-200/20 to-gray-300/20 rounded-xl p-4 opacity-50">
                  <h3 className="text-sm font-semibold text-sky-700 mb-2">Main + Extras</h3>
                  <p className="text-2xl font-bold text-sky-800">N/A</p>
                </div>
              )}
              {(hltbData.gameplayCompletionist !== undefined && hltbData.gameplayCompletionist !== null && hltbData.gameplayCompletionist > 0) ? (
                <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-sky-700 mb-2">Completionist</h3>
                  <p className="text-2xl font-bold text-sky-800">{formatTime(hltbData.gameplayCompletionist)}</p>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-gray-200/20 to-gray-300/20 rounded-xl p-4 opacity-50">
                  <h3 className="text-sm font-semibold text-sky-700 mb-2">Completionist</h3>
                  <p className="text-2xl font-bold text-sky-800">N/A</p>
                </div>
              )}
            </div>
            {hltbData.playableOn && hltbData.playableOn.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-sky-600">
                  <span className="font-semibold">Playable on:</span>{' '}
                  {hltbData.playableOn.join(', ')}
                </p>
              </div>
            )}
          </section>
        )}

        {!hltbData && (
          <section className="glass-strong rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-sky-800 mb-2">How Long To Beat</h2>
            <p className="text-sky-600">
              No completion time data available for this game. This may be due to rate limiting or the game not being found in the HowLongToBeat database.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

