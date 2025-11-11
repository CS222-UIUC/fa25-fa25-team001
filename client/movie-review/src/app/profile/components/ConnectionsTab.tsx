"use client";

import { useState, useEffect } from 'react';
import { getSteamConnection, getXboxConnection } from '../server-actions';

export default function ConnectionsTab() {
  const [steamConnection, setSteamConnection] = useState<any>(null);
  const [steamGames, setSteamGames] = useState<any[]>([]);
  const [xboxConnection, setXboxConnection] = useState<any>(null);
  const [xboxGames, setXboxGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [xboxDisconnecting, setXboxDisconnecting] = useState(false);
  const [xboxSyncing, setXboxSyncing] = useState(false);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const [steamResult, xboxResult] = await Promise.all([
        getSteamConnection(),
        getXboxConnection()
      ]);
      
      if ('success' in steamResult && steamResult.connection) {
        setSteamConnection(steamResult.connection);
        setSteamGames(Array.isArray(steamResult.connection.gamesData) ? steamResult.connection.gamesData : []);
      }
      
      if ('success' in xboxResult && xboxResult.connection) {
        setXboxConnection(xboxResult.connection);
        // Filter out metadata fields from games list
        const gamesData = xboxResult.connection.gamesData;
        if (Array.isArray(gamesData)) {
          // Filter out metadata object (has _metadata flag)
          setXboxGames(gamesData.filter((game: any) => game && game.titleId && !game._metadata));
        } else {
          setXboxGames([]);
        }
      }
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSteamLogin = () => {
    window.location.href = '/api/steam/auth';
  };

  const handleSteamDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Steam account? This will remove all synced game data.')) {
      return;
    }

    setDisconnecting(true);
    try {
      const response = await fetch('/api/steam/disconnect', {
        method: 'DELETE',
      });

      if (response.ok) {
        setSteamConnection(null);
        setSteamGames([]);
        alert('Steam account disconnected successfully!');
      } else {
        const result = await response.json();
        alert(result.error || 'Failed to disconnect Steam account');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      alert('Failed to disconnect Steam account');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleXboxLogin = () => {
    window.location.href = '/api/xbox/auth';
  };

  const handleXboxRefresh = async () => {
    // Just reload the connection data from database
    await loadConnections();
  };

  const handleXboxSync = async () => {
    if (!xboxConnection) return;

    setXboxSyncing(true);
    try {
      const response = await fetch('/api/xbox/sync', {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        await loadConnections(); // Reload to show updated data
        alert(`Games synced successfully! Found ${result.gamesCount || 0} games.`);
      } else {
        const result = await response.json();
        alert(result.error || 'Failed to sync games');
      }
    } catch (error) {
      console.error('Xbox sync error:', error);
      alert('Failed to sync games');
    } finally {
      setXboxSyncing(false);
    }
  };

  const handleXboxDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Xbox account? This will remove all synced game data.')) {
      return;
    }

    setXboxDisconnecting(true);
    try {
      const response = await fetch('/api/xbox/disconnect', {
        method: 'DELETE',
      });

      if (response.ok) {
        setXboxConnection(null);
        setXboxGames([]);
        alert('Xbox account disconnected successfully!');
      } else {
        const result = await response.json();
        alert(result.error || 'Failed to disconnect Xbox account');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      alert('Failed to disconnect Xbox account');
    } finally {
      setXboxDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Connections</h2>
      
      {/* Steam Connection */}
      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Steam</h3>
              <p className="text-sm text-gray-500">
                {steamConnection 
                  ? `Connected - ${steamGames.length} games found` 
                  : 'Connect your Steam account to sync games'
                }
              </p>
            </div>
          </div>
          
          {!steamConnection ? (
            <button
              onClick={handleSteamLogin}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Connect via Steam
            </button>
          ) : (
            <button
              onClick={handleSteamDisconnect}
              disabled={disconnecting}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {disconnecting ? 'Disconnecting...' : 'Disconnect'}
            </button>
          )}
        </div>
        
        {steamConnection && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Steam ID: {steamConnection.platformUserId}
              </span>
              <span className="text-sm text-gray-500">
                Last synced: {new Date(steamConnection.lastSyncedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Steam Games List */}
      {steamGames.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-between">
            <span>Your Steam Games ({steamGames.length})</span>
            <div className="flex gap-2">
              <button
                onClick={handleSteamLogin}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Refresh
              </button>
              <button
                onClick={handleSteamDisconnect}
                disabled={disconnecting}
                className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
          </h3>
          
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {steamGames.slice(0, 20).map((game: any) => (
                <div key={game.appid} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {game.img_icon_url ? (
                      <img src={game.img_icon_url} alt={game.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">🎮</span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{game.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span className="font-medium">{game.hours_total}h played</span>
                      {game.hours_recent > 0 && (
                        <span className="text-green-600">{game.hours_recent}h recent</span>
                      )}
                    </div>
                    {game.last_played_timestamp && (
                      <div className="text-xs text-gray-400 mt-1">
                        Last played: {new Date(game.last_played_timestamp * 1000).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0">
                    {game.has_community_visible_stats && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Stats
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {steamGames.length > 20 && (
                <div className="text-center text-gray-500 text-sm py-3 border-t">
                  ...and {steamGames.length - 20} more games
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Xbox Connection */}
      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">X</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Xbox</h3>
              <p className="text-sm text-gray-500">
                {xboxConnection 
                  ? `Connected - ${xboxGames.length} games found` 
                  : 'Connect your Xbox account to sync games'
                }
              </p>
            </div>
          </div>
          
          {!xboxConnection ? (
            <button
              onClick={handleXboxLogin}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Connect via Xbox
            </button>
          ) : (
            <button
              onClick={handleXboxDisconnect}
              disabled={xboxDisconnecting}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {xboxDisconnecting ? 'Disconnecting...' : 'Disconnect'}
            </button>
          )}
        </div>

        
        {xboxConnection && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Gamertag: {xboxConnection.platformUserId}
              </span>
              <span className="text-sm text-gray-500">
                Last synced: {xboxConnection.lastSyncedAt 
                  ? new Date(xboxConnection.lastSyncedAt).toLocaleDateString() 
                  : 'Never'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Xbox Games List */}
      {xboxGames.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-between">
            <span>Your Xbox Games ({xboxGames.length})</span>
            <div className="flex gap-2">
              <button
                onClick={handleXboxLogin}
                className="text-sm text-green-600 hover:text-green-700"
              >
                Refresh
              </button>
              <button
                onClick={handleXboxDisconnect}
                disabled={xboxDisconnecting}
                className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                {xboxDisconnecting ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
          </h3>
          
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {xboxGames.slice(0, 20).map((game: any) => (
                <div key={game.titleId} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {game.boxArtUrl || game.imageUrl ? (
                      <img 
                        src={game.boxArtUrl || game.imageUrl} 
                        alt={game.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="text-2xl">🎮</span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{game.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      {game.hoursTotal > 0 && (
                        <span className="font-medium">{game.hoursTotal}h played</span>
                      )}
                      {game.achievements && game.achievements.total > 0 && (
                        <span className="text-green-600">
                          {game.achievements.unlocked}/{game.achievements.total} achievements ({game.achievements.percentage}%)
                        </span>
                      )}
                      {game.gamerscore > 0 && (
                        <span className="text-blue-600">{game.gamerscore} GS</span>
                      )}
                    </div>
                    {game.lastPlayed && (
                      <div className="text-xs text-gray-400 mt-1">
                        Last played: {new Date(game.lastPlayed).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0">
                    {game.platform && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {game.platform}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {xboxGames.length > 20 && (
                <div className="text-center text-gray-500 text-sm py-3 border-t">
                  ...and {xboxGames.length - 20} more games
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="text-center text-gray-500">
        <p>More platforms coming soon...</p>
      </div>
    </div>
  );
}