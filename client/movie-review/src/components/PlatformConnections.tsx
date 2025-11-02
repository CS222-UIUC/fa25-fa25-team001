'use client';

import { useEffect, useState } from 'react';
import { getUserPlatformConnections } from '@/actions/platform';

interface PlatformConnection {
  id: string;
  platformType: string;
  platformUserId: string | null;
  connectedAt: Date;
  lastSyncedAt: Date | null;
  gamesData: any;
}

const PLATFORM_INFO = {
  steam: {
    name: 'Steam',
    color: 'bg-blue-600',
    icon: 'https://static.vecteezy.com/system/resources/previews/020/975/553/non_2x/steam-logo-steam-icon-transparent-free-png.png',
    instructions: 'Enter your Steam ID to link',
    description: 'Link your Steam account to track playtime',
  },
  nintendo: {
    name: 'Nintendo Switch',
    color: 'bg-red-600',
    icon: 'https://creazilla-store.fra1.digitaloceanspaces.com/icons/3210154/nintendo-switch-icon-md.png',
    instructions: 'Link your Nintendo account',
    description: 'Coming soon: Link your Nintendo account to track playtime',
  },
  xbox: {
    name: 'Xbox',
    color: 'bg-green-600',
    icon: 'https://www.pngall.com/wp-content/uploads/13/Xbox-Logo-PNG-File.png',
    instructions: 'Enter your Xbox User ID to link',
    description: 'Link your Xbox account to track playtime',
  },
  playstation: {
    name: 'PlayStation',
    color: 'bg-blue-500',
    icon: 'https://th.bing.com/th/id/R.cfb016ea519990f1f005f960c8463d60?rik=IksI2%2fGWtxNogQ&riu=http%3a%2f%2fpluspng.com%2fimg-png%2fplaystation-png-playstation-icon-512.png&ehk=3D4u7afiw1vNwCkR6Gp42plDgOizum%2fz%2bxDOL0fzVDM%3d&risl=&pid=ImgRaw&r=0',
    instructions: 'Link your PlayStation account',
    description: 'Coming soon: Link your PlayStation account to track playtime',
  },
};

export default function PlatformConnections() {
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [steamId, setSteamId] = useState('');
  const [xboxUserId, setXboxUserId] = useState('');
  const [syncStatus, setSyncStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    setLoading(true);
    const result = await getUserPlatformConnections();
    if (result.success && result.connections) {
      setConnections(result.connections);
    }
    setLoading(false);
  };

  const handleConnectSteam = async () => {
    if (!steamId) {
      alert('Please enter your Steam ID');
      return;
    }

    setConnecting('steam');
    try {
      const response = await fetch('/api/platforms/steam/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steamId }),
      });

      const data = await response.json();

      if (data.success) {
        setSteamId('');
        loadConnections();
        alert('Steam account connected successfully!');
      } else {
        alert(data.error || 'Failed to connect Steam account');
      }
    } catch (error) {
      console.error('Error connecting Steam:', error);
      alert('Failed to connect Steam account');
    } finally {
      setConnecting(null);
    }
  };

  const handleConnectXbox = async () => {
    if (!xboxUserId) {
      alert('Please enter your Xbox User ID');
      return;
    }

    setConnecting('xbox');
    try {
      const response = await fetch('/api/platforms/xbox/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xboxUserId }),
      });

      const data = await response.json();

      if (data.success) {
        setXboxUserId('');
        loadConnections();
        alert('Xbox account connected successfully!');
      } else {
        alert(data.error || 'Failed to connect Xbox account');
      }
    } catch (error) {
      console.error('Error connecting Xbox:', error);
      alert('Failed to connect Xbox account');
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platformType: string) => {
    if (!confirm(`Disconnect your ${PLATFORM_INFO[platformType as keyof typeof PLATFORM_INFO]?.name} account?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/platforms/disconnect?platformType=${platformType}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        loadConnections();
        alert('Account disconnected successfully');
      } else {
        alert(data.error || 'Failed to disconnect account');
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      alert('Failed to disconnect account');
    }
  };

  const handleSyncGames = async (platformType: string) => {
    setSyncStatus({ ...syncStatus, [platformType]: true });
    try {
      const response = await fetch(`/api/platforms/${platformType}/games`);
      const data = await response.json();

      if (data.success) {
        alert(`Synced ${data.games?.length || 0} games successfully!`);
        loadConnections();
      } else {
        alert(data.error || 'Failed to sync games');
      }
    } catch (error) {
      console.error('Error syncing games:', error);
      alert('Failed to sync games');
    } finally {
      setSyncStatus({ ...syncStatus, [platformType]: false });
    }
  };

  const getConnectedPlatform = (platformType: string) => {
    return connections.find((c) => c.platformType === platformType);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return <div className="text-center py-8">Loading connections...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Gaming Platforms</h2>
        <p className="text-gray-600">
          Link your gaming accounts to automatically track your playtime and game library. 
          <span className="font-medium"> You'll still sign in with your email/password.</span>
        </p>
      </div>

      {/* Steam Connection */}
      <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <img src={PLATFORM_INFO.steam.icon} alt="Steam logo" className="w-8 h-8 object-contain" />
            <div>
              <h3 className="text-xl font-semibold">Steam</h3>
              {getConnectedPlatform('steam') ? (
                <p className="text-sm text-gray-600">
                  Connected • Last synced: {formatDate(getConnectedPlatform('steam')!.lastSyncedAt)}
                </p>
              ) : (
                <p className="text-sm text-gray-500">Not connected</p>
              )}
            </div>
          </div>
          {getConnectedPlatform('steam') && (
            <div className="flex space-x-2">
              <button
                onClick={() => handleSyncGames('steam')}
                disabled={syncStatus.steam}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {syncStatus.steam ? 'Syncing...' : 'Sync Games'}
              </button>
              <button
                onClick={() => handleDisconnect('steam')}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {!getConnectedPlatform('steam') && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Steam ID or Profile URL
              </label>
              <input
                type="text"
                value={steamId}
                onChange={(e) => setSteamId(e.target.value)}
                placeholder="Enter Steam ID (e.g., 76561198000000000)"
                className="border border-gray-300 rounded-md px-3 py-2 w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Find your Steam ID at{' '}
                <a
                  href="https://steamid.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  steamid.io
                </a>
              </p>
            </div>
            <button
              onClick={handleConnectSteam}
              disabled={connecting === 'steam'}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {connecting === 'steam' ? 'Connecting...' : 'Connect Steam'}
            </button>
          </div>
        )}

        {getConnectedPlatform('steam')?.gamesData && Array.isArray(getConnectedPlatform('steam')?.gamesData) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-semibold mb-2">Your Games ({getConnectedPlatform('steam')?.gamesData.length})</h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {getConnectedPlatform('steam')?.gamesData.slice(0, 10).map((game: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                  <span className="font-medium">{game.name}</span>
                  <div className="text-gray-600">
                    {game.playtimeHours}h
                    {game.lastPlayed && (
                      <span className="ml-2 text-xs">
                        • Last played: {new Date(game.lastPlayed).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {getConnectedPlatform('steam')?.gamesData.length > 10 && (
                <p className="text-xs text-gray-500 text-center pt-2">
                  ... and {getConnectedPlatform('steam')!.gamesData.length - 10} more games
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Xbox Connection */}
      <div className="bg-white rounded-lg shadow-md p-6 border-2 border-green-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <img src={PLATFORM_INFO.xbox.icon} alt="Xbox logo" className="w-8 h-8 object-contain" />
            <div>
              <h3 className="text-xl font-semibold">Xbox</h3>
              {getConnectedPlatform('xbox') ? (
                <p className="text-sm text-gray-600">
                  Connected • Last synced: {formatDate(getConnectedPlatform('xbox')!.lastSyncedAt)}
                </p>
              ) : (
                <p className="text-sm text-gray-500">Not connected</p>
              )}
            </div>
          </div>
          {getConnectedPlatform('xbox') && (
            <div className="flex space-x-2">
              <button
                onClick={() => handleSyncGames('xbox')}
                disabled={syncStatus.xbox}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {syncStatus.xbox ? 'Syncing...' : 'Sync Games'}
              </button>
              <button
                onClick={() => handleDisconnect('xbox')}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {!getConnectedPlatform('xbox') && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Xbox User ID
              </label>
              <input
                type="text"
                value={xboxUserId}
                onChange={(e) => setXboxUserId(e.target.value)}
                placeholder="Enter your Xbox User ID"
                className="border border-gray-300 rounded-md px-3 py-2 w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Find your Xbox User ID in your Xbox profile settings
              </p>
            </div>
            <button
              onClick={handleConnectXbox}
              disabled={connecting === 'xbox'}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {connecting === 'xbox' ? 'Connecting...' : 'Connect Xbox'}
            </button>
          </div>
        )}

        {getConnectedPlatform('xbox')?.gamesData && Array.isArray(getConnectedPlatform('xbox')?.gamesData) && getConnectedPlatform('xbox')!.gamesData.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-semibold mb-2">Your Games ({getConnectedPlatform('xbox')?.gamesData.length})</h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {getConnectedPlatform('xbox')?.gamesData.slice(0, 10).map((game: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                  <span className="font-medium">{game.name}</span>
                  <div className="text-gray-600">
                    {game.playtimeHours}h
                    {game.lastPlayed && (
                      <span className="ml-2 text-xs">
                        • Last played: {new Date(game.lastPlayed).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {getConnectedPlatform('xbox')?.gamesData.length > 10 && (
                <p className="text-xs text-gray-500 text-center pt-2">
                  ... and {getConnectedPlatform('xbox')!.gamesData.length - 10} more games
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Other Platforms - Coming Soon */}
      {(['nintendo', 'playstation'] as const).map((platform) => {
        const connected = getConnectedPlatform(platform);
        const info = PLATFORM_INFO[platform];

        return (
          <div key={platform} className="bg-white rounded-lg shadow-md p-6 border-2 border-gray-200 opacity-60">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src={info.icon} alt={`${info.name} logo`} className="w-8 h-8 object-contain" />
                <div>
                  <h3 className="text-xl font-semibold">{info.name}</h3>
                  <p className="text-sm text-gray-500">{info.description}</p>
                </div>
              </div>
              {connected && (
                <button
                  onClick={() => handleDisconnect(platform)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                  Disconnect
                </button>
              )}
            </div>
            {!connected && (
              <p className="text-sm text-gray-600 mt-3">
                Account linking for {info.name} is coming soon. This will allow you to automatically sync your game library and playtime data.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

