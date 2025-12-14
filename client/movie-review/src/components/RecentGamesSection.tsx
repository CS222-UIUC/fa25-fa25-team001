'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { rateGame, getUserGameRatings } from '@/actions/gameRatings';

interface Game {
  name: string;
  posterUrl: string;
  platform: string;
  playtimeHours?: number | string;
  lastPlayed?: string;
  igdbId?: number;
}

interface StarRatingProps {
  gameName: string;
  currentRating: number | null;
  onRate: (rating: number) => void;
}

function StarRating({ gameName, currentRating, onRate }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const starContainer = containerRef.current.querySelector('div.flex');
    if (!starContainer) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const starRect = starContainer.getBoundingClientRect();
    
    // Calculate relative to the star container, accounting for padding
    const starX = e.clientX - starRect.left;
    const starWidth = starRect.width;
    
    // Add padding area on both sides for easier 0.5 and 5.0 rating
    const padding = starWidth * 0.1; // 10% padding on each side
    const adjustedX = starX + padding;
    const adjustedWidth = starWidth + (padding * 2);
    
    const starWidthEach = adjustedWidth / 5;
    const starIndex = Math.floor(adjustedX / starWidthEach);
    const positionInStar = (adjustedX % starWidthEach) / starWidthEach;
    
    const isHalfStar = positionInStar < 0.5;
    const starValue = starIndex + 1;
    const finalRating = isHalfStar ? starIndex + 0.5 : starValue;
    
    // Clamp between 0.5 and 5.0, ensuring we can easily reach both extremes
    let clampedRating = Math.max(0.5, Math.min(5.0, finalRating));
    
    // Ensure we can reach 0.5 by checking if we're at the very left edge
    if (starX < padding * 0.5) {
      clampedRating = 0.5;
    }
    // Ensure we can reach 5.0 by checking if we're at the very right edge
    if (starX > starWidth - padding * 0.5) {
      clampedRating = 5.0;
    }
    
    setHoverRating(clampedRating);
  };

  const handleMouseLeave = () => {
    setHoverRating(null);
  };

  const handleClick = () => {
    if (hoverRating !== null) {
      onRate(hoverRating);
    }
  };

  const displayRating = hoverRating !== null ? hoverRating : (currentRating || 0);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30 cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div className="flex items-center gap-1 px-2" style={{ direction: 'ltr' }}>
        {[1, 2, 3, 4, 5].map((star) => {
          const starValue = star;
          const isHalfStar = displayRating >= starValue - 0.5 && displayRating < starValue;
          const isFullStar = displayRating >= starValue;
          
          return (
            <div key={star} className="relative w-6 h-6">
              {/* Empty star background */}
              <svg
                className="w-full h-full text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              
              {/* Filled star overlay */}
              {(isFullStar || isHalfStar) && (
                <div
                  className="absolute top-0 left-0 h-full w-full"
                  style={{ 
                    clipPath: isHalfStar ? 'inset(0 50% 0 0)' : 'none'
                  }}
                >
                  <svg
                    className="w-full h-full text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {currentRating && (
        <div className="absolute bottom-4 text-white text-xs font-semibold">
          Your rating: {currentRating.toFixed(1)} ⭐
        </div>
      )}
    </div>
  );
}

export default function RecentGamesSection() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [ratingGames, setRatingGames] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRecentGames();
  }, []);

  const loadRecentGames = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/games/posters');
      const data = await response.json();
      
      if (data.success && data.games) {
        setGames(data.games);
        // Load ratings for the games
        await loadRatings(data.games);
      }
    } catch (error) {
      console.error('Error loading recent games:', error);
    }
    setLoading(false);
  };

  const loadRatings = async (gamesList: Game[]) => {
    try {
      const gameTitles = gamesList.map(g => g.name);
      if (gameTitles.length === 0) return;
      const result = await getUserGameRatings(gameTitles);
      if (result.ratings) {
        setRatings(result.ratings);
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
    }
  };

  const handleRateGame = async (gameName: string, rating: number) => {
    if (ratingGames.has(gameName)) return; // Prevent duplicate requests
    
    setRatingGames(prev => new Set(prev).add(gameName));
    try {
      const result = await rateGame(gameName, rating);
      if (result.success && result.rating !== undefined) {
        setRatings(prev => ({ ...prev, [gameName]: result.rating }));
      }
    } catch (error) {
      console.error('Error rating game:', error);
    } finally {
      setRatingGames(prev => {
        const next = new Set(prev);
        next.delete(gameName);
        return next;
      });
    }
  };

  const getPlatformLogo = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'steam':
        return 'https://static.vecteezy.com/system/resources/previews/020/975/553/non_2x/steam-logo-steam-icon-transparent-free-png.png';
      case 'xbox':
        return 'https://www.pngall.com/wp-content/uploads/13/Xbox-Logo-PNG-File.png';
      case 'playstation':
        return 'https://th.bing.com/th/id/R.cfb016ea519990f1f005f960c8463d60?rik=IksI2%2fGWtxNogQ&riu=http%3a%2f%2fpluspng.com%2fimg-png%2fplaystation-png-playstation-icon-512.png&ehk=3D4u7afiw1vNwCkR6Gp42plDgOizum%2fz%2bxDOL0fzVDM%3d&risl=&pid=ImgRaw&r=0';
      case 'nintendo':
        return 'https://clipground.com/images/nintendo-switch-logo-png-4.png';
      default:
        return 'https://static.vecteezy.com/system/resources/previews/020/975/553/non_2x/steam-logo-steam-icon-transparent-free-png.png';
    }
  };

  const formatPlatformName = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'steam':
        return 'Steam';
      case 'xbox':
        return 'Xbox';
      case 'playstation':
        return 'PlayStation';
      case 'nintendo':
        return 'Nintendo Switch';
      default:
        return platform.charAt(0).toUpperCase() + platform.slice(1).toLowerCase();
    }
  };

  const formatPlaytime = (hours?: number | string) => {
    if (!hours) return '';
    const numHours = typeof hours === 'string' ? parseFloat(hours) : hours;
    if (isNaN(numHours)) return '';
    if (numHours < 1) return '< 1h';
    if (numHours < 10) return `${numHours.toFixed(1)}h`;
    return `${Math.round(numHours)}h`;
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-sky-700 font-medium">
        Loading recent games...
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="glass-strong rounded-2xl shadow-xl p-6 border-2 border-cyan-300/50">
        <h3 className="text-xl font-semibold text-sky-800 mb-4">
          Recent Games
        </h3>
        <div className="text-center text-sky-600 py-8">
          <p className="mb-2">No games found.</p>
          <p className="text-sm">
            Connect your gaming platforms (Steam, Xbox, PlayStation) to see your recently played games here!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-strong rounded-2xl shadow-xl p-6 border-2 border-cyan-300/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-sky-800">Recent Games</h3>
        <button
          onClick={loadRecentGames}
          className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold py-2 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl glow-soft text-sm"
        >
          Refresh
        </button>
      </div>
      
             <p className="text-sm text-sky-600 mb-4">
         Your most recently played games from Steam, Xbox, PlayStation, or Nintendo Switch platforms.
       </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {games.map((game, index) => (
          <div
            key={index}
            className="relative group cursor-pointer transition-transform hover:scale-105"
          >
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-200 shadow-lg">
              {game.posterUrl ? (
                <Image
                  src={game.posterUrl}
                  alt={game.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 text-sm text-center p-2">
                  <div className="relative w-12 h-12 mb-2">
                    <Image
                      src={getPlatformLogo(game.platform)}
                      alt={game.platform}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="font-semibold">{game.name}</div>
                </div>
              )}
              
              {/* Star Rating Overlay - appears on hover */}
              <StarRating
                gameName={game.name}
                currentRating={ratings[game.name] || null}
                onRate={(rating) => handleRateGame(game.name, rating)}
              />
              
              {/* Rating badge - top right corner */}
              {ratings[game.name] && (
                <div className="absolute top-2 right-2 bg-black/80 text-yellow-400 text-xs font-semibold px-2 py-1 rounded flex items-center gap-1 z-20 backdrop-blur-sm">
                  <span>⭐</span>
                  <span>{ratings[game.name].toFixed(1)}</span>
                </div>
              )}
              
              {/* Platform badge */}
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-semibold px-2 py-1 rounded flex items-center gap-1 z-20">
                <div className="relative w-4 h-4">
                  <Image
                    src={getPlatformLogo(game.platform)}
                    alt={game.platform}
                    fill
                    className="object-contain"
                  />
                </div>
                <span>{formatPlatformName(game.platform)}</span>
              </div>

              {/* Playtime overlay */}
              {game.playtimeHours && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-xs z-20">
                  <div className="font-semibold">{formatPlaytime(game.playtimeHours)}</div>
                  {game.lastPlayed && (
                    <div className="text-xs opacity-75">
                      {new Date(game.lastPlayed).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="mt-2 text-sm font-semibold text-sky-800 text-center line-clamp-2">
              {game.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
