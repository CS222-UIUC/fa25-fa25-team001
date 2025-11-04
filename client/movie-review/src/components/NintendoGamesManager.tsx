'use client';

import { useState } from 'react';
import Image from 'next/image';

interface NintendoGame {
  name: string;
  posterUrl: string;
  playtimeHours?: number;
  lastPlayed?: string;
  igdbId?: number;
}

interface NintendoGamesManagerProps {
  games: NintendoGame[];
  onGamesUpdate: (games: NintendoGame[]) => void;
}

export default function NintendoGamesManager({ games, onGamesUpdate }: NintendoGamesManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [editingGame, setEditingGame] = useState<string | null>(null);
  const [playtimeInput, setPlaytimeInput] = useState('');
  const [lastPlayedInput, setLastPlayedInput] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(`/api/search?type=games&q=${encodeURIComponent(searchQuery)}&platform=nintendo`);
      const data = await response.json();
      
      if (data.success && data.results) {
        setSearchResults(data.results);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
    setSearchLoading(false);
  };

  const handleAddGame = (game: any) => {
    const newGame: NintendoGame = {
      name: game.title,
      posterUrl: game.posterUrl || '',
      playtimeHours: 0,
      lastPlayed: new Date().toISOString().split('T')[0],
      igdbId: game.igdbId,
    };

    // Check if game already exists
    if (games.some(g => g.name.toLowerCase() === newGame.name.toLowerCase())) {
      alert('This game is already in your library!');
      return;
    }

    onGamesUpdate([...games, newGame]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveGame = (gameName: string) => {
    onGamesUpdate(games.filter(g => g.name !== gameName));
  };

  const handleStartEdit = (game: NintendoGame) => {
    setEditingGame(game.name);
    setPlaytimeInput(game.playtimeHours?.toString() || '0');
    setLastPlayedInput(game.lastPlayed ? new Date(game.lastPlayed).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  };

  const handleSaveEdit = () => {
    if (!editingGame) return;

    const updatedGames = games.map(g => {
      if (g.name === editingGame) {
        return {
          ...g,
          playtimeHours: parseFloat(playtimeInput) || 0,
          lastPlayed: lastPlayedInput,
        };
      }
      return g;
    });

    onGamesUpdate(updatedGames);
    setEditingGame(null);
    setPlaytimeInput('');
    setLastPlayedInput('');
  };

  const handleCancelEdit = () => {
    setEditingGame(null);
    setPlaytimeInput('');
    setLastPlayedInput('');
  };

  return (
    <div className="space-y-4">
      {/* Search and Add Section */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
            placeholder="Search for Nintendo Switch games..."
            className="flex-1 glass-strong rounded-xl px-3 py-2 text-sky-900 placeholder-sky-600/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
          />
          <button
            onClick={handleSearch}
            disabled={searchLoading || !searchQuery.trim()}
            className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold py-2 px-4 rounded-xl disabled:opacity-50 transition-all shadow-lg hover:shadow-xl glow-soft"
          >
            {searchLoading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="max-h-60 overflow-y-auto space-y-2 glass rounded-xl p-3">
            {searchResults.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 hover:bg-white/20 rounded-lg cursor-pointer"
                onClick={() => handleAddGame(item)}
              >
                <div className="flex items-center gap-3">
                  {item.posterUrl && (
                    <img
                      src={item.posterUrl}
                      alt={item.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div>
                    <div className="font-semibold text-sky-800">{item.title}</div>
                    {item.year && (
                      <div className="text-xs text-sky-600">{item.year}</div>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddGame(item);
                  }}
                  className="bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-white font-semibold py-1 px-3 rounded-lg transition-all text-sm"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Games List */}
      {games.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-sky-800">Your Nintendo Games</h4>
          <div className="space-y-2">
            {games.map((game, index) => (
              <div
                key={index}
                className="glass rounded-xl p-4 flex items-center gap-4 hover:bg-white/10 transition-colors"
              >
                {game.posterUrl ? (
                  <div className="relative w-16 h-20 rounded overflow-hidden flex-shrink-0">
                    <Image
                      src={game.posterUrl}
                      alt={game.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-20 rounded bg-gray-300 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-gray-600 text-center px-1">No Image</span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sky-800 truncate">{game.name}</div>
                  {editingGame === game.name ? (
                    <div className="mt-2 space-y-2">
                      <div className="flex gap-2 items-center">
                        <label className="text-xs text-sky-600 w-20">Playtime (h):</label>
                        <input
                          type="number"
                          step="0.1"
                          value={playtimeInput}
                          onChange={(e) => setPlaytimeInput(e.target.value)}
                          className="flex-1 glass-strong rounded px-2 py-1 text-sm text-sky-900"
                          placeholder="0"
                        />
                      </div>
                      <div className="flex gap-2 items-center">
                        <label className="text-xs text-sky-600 w-20">Last Played:</label>
                        <input
                          type="date"
                          value={lastPlayedInput}
                          onChange={(e) => setLastPlayedInput(e.target.value)}
                          className="flex-1 glass-strong rounded px-2 py-1 text-sm text-sky-900"
                        />
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={handleSaveEdit}
                          className="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-1 px-3 rounded transition-all"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="bg-gray-500 hover:bg-gray-600 text-white text-xs font-semibold py-1 px-3 rounded transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 space-y-1">
                      <div className="text-xs text-sky-600">
                        Playtime: {game.playtimeHours ? `${game.playtimeHours.toFixed(1)}h` : '0h'}
                      </div>
                      <div className="text-xs text-sky-600">
                        Last Played: {game.lastPlayed 
                          ? new Date(game.lastPlayed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'Never'}
                      </div>
                    </div>
                  )}
                </div>

                {editingGame !== game.name && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleStartEdit(game)}
                      className="bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold py-2 px-3 rounded transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleRemoveGame(game.name)}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-2 px-3 rounded transition-all"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {games.length === 0 && !searchResults.length && (
        <div className="text-center text-sky-600 py-8">
          <p className="mb-2">No Nintendo games added yet.</p>
          <p className="text-sm">Search and add games to track your Nintendo Switch library!</p>
        </div>
      )}
    </div>
  );
}
