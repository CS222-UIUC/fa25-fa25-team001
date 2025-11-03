'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
    instructions: 'Enter your PSN NPSSO token',
    description: 'Link your PlayStation account to track playtime and trophies',
  },
};

export default function PlatformConnections() {
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [steamId, setSteamId] = useState('');
  const [xboxUserId, setXboxUserId] = useState('');
  const [psnNpso, setPsnNpso] = useState('');
  const [syncStatus, setSyncStatus] = useState<Record<string, boolean>>({});
  const [showManualSteamInput, setShowManualSteamInput] = useState(false);
  const [showManualPSNInput, setShowManualPSNInput] = useState(false);
  const [showManualXboxInput, setShowManualXboxInput] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    loadConnections();
    
    // Check for Steam OpenID callback messages
    const steamConnected = searchParams.get('steam_connected');
    const error = searchParams.get('error');
    
    if (steamConnected === 'true') {
      loadConnections();
      alert('Steam account connected successfully!');
      // Clean up URL
      router.replace('/user/profile', { scroll: false });
    } else if (error) {
      const errorMessages: Record<string, string> = {
        'steam_auth_failed': 'Steam authentication failed. Please try again.',
        'steam_auth_expired': 'Steam authentication expired. Please try again.',
        'steam_auth_cancelled': 'Steam authentication was cancelled.',
        'steam_id_invalid': 'Invalid Steam ID received. Please try again.',
        'steam_auth_error': 'An error occurred during Steam authentication.',
        'connection_failed': 'Failed to connect Steam account.',
      };
      alert(errorMessages[error] || `Error: ${error}`);
      router.replace('/user/profile', { scroll: false });
    }
  }, [searchParams, router]);

  const loadConnections = async () => {
    setLoading(true);
    const result = await getUserPlatformConnections();
    if (result.success && result.connections) {
      setConnections(result.connections);
    }
    setLoading(false);
  };

  const handleConnectSteamOpenID = () => {
    // Redirect to Steam OpenID flow
    window.location.href = '/api/platforms/steam/oauth';
  };

  const handleConnectSteam = async () => {
    if (!steamId) {
      alert('Please enter your Steam ID or profile URL');
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
        const profileName = data.profileName ? ` (${data.profileName})` : '';
        alert(`Steam account connected successfully${profileName}!`);
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

  const handleConnectPSN = async () => {
    if (!psnNpso) {
      alert('Please enter your PSN NPSSO token');
      return;
    }

    setConnecting('playstation');
    try {
      const response = await fetch('/api/platforms/psn/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ npsso: psnNpso }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        alert(`Failed to connect PlayStation account: Server returned non-JSON response`);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setPsnNpso('');
        loadConnections();
        alert('PlayStation account connected successfully!');
      } else {
        alert(data.error || 'Failed to connect PlayStation account');
      }
    } catch (error) {
      console.error('Error connecting PlayStation:', error);
      alert('Failed to connect PlayStation account');
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
      // Map platform types to API endpoints
      const platformApiMap: Record<string, string> = {
        'playstation': 'psn',
        'steam': 'steam',
        'xbox': 'xbox',
      };
      
      const apiEndpoint = platformApiMap[platformType] || platformType;
      const response = await fetch(`/api/platforms/${apiEndpoint}/games`);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        alert(`Failed to sync games: Server returned non-JSON response`);
        return;
      }

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
            {/* Primary: Sign in with Steam button */}
            <div className="space-y-3">
              <button
                onClick={handleConnectSteamOpenID}
                disabled={connecting === 'steam'}
                className="w-full bg-[#1b2838] hover:bg-[#2a475e] text-white font-bold py-3 px-4 rounded flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16c-.169 0-.315.06-.459.144l-3.433 2.49-2.785-2.055a1.368 1.368 0 0 0-1.573 0l-5.785 4.276c-.459.315-.459.861 0 1.176l5.785 4.276c.315.228.744.228 1.057 0l5.785-4.276c.459-.315.459-.861 0-1.176l-2.785-2.055 3.433-2.49c.144-.084.288-.144.459-.144.744 0 1.347.603 1.347 1.347s-.603 1.347-1.347 1.347z"/>
                </svg>
                {connecting === 'steam' ? 'Connecting...' : 'Sign in with Steam'}
              </button>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowManualSteamInput(!showManualSteamInput)}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  {showManualSteamInput ? 'Hide' : 'Or connect manually with Steam ID'}
                </button>
              </div>
            </div>

            {/* Manual input (collapsible) */}
            {showManualSteamInput && (
              <div className="space-y-3 pt-3 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Steam Profile URL or Steam ID
                  </label>
                  <input
                    type="text"
                    value={steamId}
                    onChange={(e) => setSteamId(e.target.value)}
                    placeholder="Paste your Steam profile URL (steamcommunity.com/profiles/...) or Steam ID"
                    className="border border-gray-300 rounded-md px-3 py-2 w-full"
                  />
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-2">
                    <p className="text-xs text-blue-900 font-medium mb-2">How to connect manually:</p>
                    <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Open your <a href="https://steamcommunity.com/my/profile" target="_blank" rel="noopener noreferrer" className="underline font-medium">Steam profile page</a></li>
                      <li>Copy the entire URL from your browser</li>
                      <li>Paste it above (we'll automatically extract your Steam ID)</li>
                    </ol>
                    <div className="mt-2 pt-2 border-t border-blue-300">
                      <p className="text-xs text-blue-900 font-medium mb-1">⚠️ Important Privacy Settings:</p>
                      <p className="text-xs text-blue-800">
                        Your Steam profile must be set to <strong>public</strong>. Go to Steam → Settings → Privacy → Profile Status: <strong>Public</strong>. Also ensure "Game details" are visible.
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleConnectSteam}
                  disabled={connecting === 'steam' || !steamId}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 w-full"
                >
                  {connecting === 'steam' ? 'Connecting...' : 'Connect with Steam ID'}
                </button>
              </div>
            )}
          </div>
        )}

        {getConnectedPlatform('steam')?.gamesData && Array.isArray(getConnectedPlatform('steam')?.gamesData) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-semibold mb-2">Your Games ({getConnectedPlatform('steam')?.gamesData.length})</h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {getConnectedPlatform('steam')?.gamesData.slice(0, 10).map((game: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                  <span className="font-medium">{game.name}</span>
                  <div className="text-gray-600 text-xs">
                    {game.playtimeHours}h
                    {game.lastPlayed && (
                      <span className="ml-2">
                        • Last played: {new Date(game.lastPlayed).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
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
            {/* Primary: Sign in with Xbox button */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  // Provide instructions for finding Xbox User ID
                  const instructions = `To connect your Xbox account:\n\n1. Visit https://account.xbox.com/Profile\n2. Sign in with your Microsoft account\n3. Your Xbox User ID (Gamertag) will be visible in your profile\n4. Copy your Gamertag\n5. Return here and click "Or connect manually" to paste it`;
                  alert(instructions);
                  window.open('https://account.xbox.com/Profile', '_blank');
                }}
                disabled={connecting === 'xbox'}
                className="w-full bg-[#107c10] hover:bg-[#0e6b0e] text-white font-bold py-3 px-4 rounded flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-13h2v6h-2V7zm0 8h2v2h-2v-2z"/>
                </svg>
                {connecting === 'xbox' ? 'Connecting...' : 'Sign in with Xbox'}
              </button>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowManualXboxInput(!showManualXboxInput)}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  {showManualXboxInput ? 'Hide' : 'Or connect manually with Xbox User ID'}
                </button>
              </div>
            </div>

            {/* Manual input (collapsible) */}
            {showManualXboxInput && (
              <div className="space-y-3 pt-3 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Xbox User ID (Gamertag)
                  </label>
                  <input
                    type="text"
                    value={xboxUserId}
                    onChange={(e) => setXboxUserId(e.target.value)}
                    placeholder="Enter your Xbox Gamertag or User ID"
                    className="border border-gray-300 rounded-md px-3 py-2 w-full"
                  />
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-2">
                    <p className="text-xs text-green-900 font-medium mb-2">How to find your Xbox User ID:</p>
                    <ol className="text-xs text-green-800 space-y-1 list-decimal list-inside">
                      <li>Visit <a href="https://account.xbox.com/Profile" target="_blank" rel="noopener noreferrer" className="underline font-medium">Xbox Profile</a></li>
                      <li>Sign in with your Microsoft account</li>
                      <li>Your <strong>Gamertag</strong> is displayed at the top of your profile</li>
                      <li>Copy it and paste above</li>
                    </ol>
                    <div className="mt-2 pt-2 border-t border-green-300">
                      <p className="text-xs text-green-900 font-medium mb-1">⚠️ Note:</p>
                      <p className="text-xs text-green-800">
                        Full game syncing requires additional Microsoft OAuth setup. Basic connection is available now!
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleConnectXbox}
                  disabled={connecting === 'xbox' || !xboxUserId}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 w-full"
                >
                  {connecting === 'xbox' ? 'Connecting...' : 'Connect with Xbox User ID'}
                </button>
              </div>
            )}
          </div>
        )}

        {getConnectedPlatform('xbox')?.gamesData && Array.isArray(getConnectedPlatform('xbox')?.gamesData) && getConnectedPlatform('xbox')!.gamesData.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-semibold mb-2">Your Games ({getConnectedPlatform('xbox')?.gamesData.length})</h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {getConnectedPlatform('xbox')?.gamesData.slice(0, 10).map((game: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                  <span className="font-medium">{game.name}</span>
                  <div className="text-gray-600 text-xs">
                    {game.playtimeHours}h
                    {game.lastPlayed && (
                      <span className="ml-2">
                        • Last played: {new Date(game.lastPlayed).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
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

      {/* PlayStation Connection */}
      <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <img src={PLATFORM_INFO.playstation.icon} alt="PlayStation logo" className="w-8 h-8 object-contain" />
            <div>
              <h3 className="text-xl font-semibold">PlayStation</h3>
              {getConnectedPlatform('playstation') ? (
                <p className="text-sm text-gray-600">
                  Connected • Last synced: {formatDate(getConnectedPlatform('playstation')!.lastSyncedAt)}
                </p>
              ) : (
                <p className="text-sm text-gray-500">Not connected</p>
              )}
            </div>
          </div>
          {getConnectedPlatform('playstation') && (
            <div className="flex space-x-2">
              <button
                onClick={() => handleSyncGames('playstation')}
                disabled={syncStatus.playstation}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {syncStatus.playstation ? 'Syncing...' : 'Sync Games'}
              </button>
              <button
                onClick={() => handleDisconnect('playstation')}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {!getConnectedPlatform('playstation') && (
          <div className="mt-4 space-y-3">
            {/* Primary: Sign in with PlayStation button */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  // Guide users to sign in first, then get NPSSO token
                  const instructions = `To connect your PlayStation account:\n\n1. Click OK to open playstation.com\n2. Sign in to your PSN account\n3. After signing in, visit: https://ca.account.sony.com/api/v1/ssocookie\n4. Copy the "npsso" value from the JSON response\n5. Return here and click "Or connect manually" to paste it`;
                  if (confirm(instructions + '\n\nClick OK to open playstation.com sign-in page.')) {
                    window.open('https://www.playstation.com/en-us/playstation-network/', '_blank');
                  }
                }}
                disabled={connecting === 'playstation'}
                className="w-full bg-[#003087] hover:bg-[#0045a0] text-white font-bold py-3 px-4 rounded flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.986 2.508c-.808 0-1.582.209-2.26.563a5.203 5.203 0 0 0-2.168 2.168 5.227 5.227 0 0 0-.563 2.26c0 .808.209 1.582.563 2.26a5.203 5.203 0 0 0 2.168 2.168 5.227 5.227 0 0 0 2.26.563h6.028c.808 0 1.582-.209 2.26-.563a5.203 5.203 0 0 0 2.168-2.168 5.227 5.227 0 0 0 .563-2.26 5.227 5.227 0 0 0-.563-2.26 5.203 5.203 0 0 0-2.168-2.168 5.227 5.227 0 0 0-2.26-.563H8.986zm0 2.02h6.028c.485 0 .95.126 1.356.35a3.123 3.123 0 0 1 1.301 1.301c.224.406.35.871.35 1.356s-.126.95-.35 1.356a3.123 3.123 0 0 1-1.301 1.301c-.406.224-.871.35-1.356.35H8.986c-.485 0-.95-.126-1.356-.35a3.123 3.123 0 0 1-1.301-1.301 3.137 3.137 0 0 1-.35-1.356c0-.485.126-.95.35-1.356a3.123 3.123 0 0 1 1.301-1.301c.406-.224.871-.35 1.356-.35zM12 9.504c-1.381 0-2.5 1.119-2.5 2.5s1.119 2.5 2.5 2.5 2.5-1.119 2.5-2.5-1.119-2.5-2.5-2.5zm0 2.02c.276 0 .5.224.5.5s-.224.5-.5.5-.5-.224-.5-.5.224-.5.5-.5zm0-7.536c-1.381 0-2.5 1.119-2.5 2.5s1.119 2.5 2.5 2.5 2.5-1.119 2.5-2.5-1.119-2.5-2.5-2.5zm0 2.02c.276 0 .5.224.5.5s-.224.5-.5.5-.5-.224-.5-.5.224-.5.5-.5z"/>
                </svg>
                {connecting === 'playstation' ? 'Connecting...' : 'Sign in with PlayStation'}
              </button>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowManualPSNInput(!showManualPSNInput)}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  {showManualPSNInput ? 'Hide' : 'Or connect manually with NPSSO token'}
                </button>
              </div>
            </div>

            {/* Manual input (collapsible) */}
            {showManualPSNInput && (
              <div className="space-y-3 pt-3 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PSN NPSSO Token
                  </label>
                  <input
                    type="text"
                    value={psnNpso}
                    onChange={(e) => setPsnNpso(e.target.value)}
                    placeholder="Enter your PSN NPSSO token"
                    className="border border-gray-300 rounded-md px-3 py-2 w-full"
                  />
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-2">
                    <p className="text-xs text-blue-900 font-medium mb-2">How to get your NPSSO token:</p>
                    <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Sign in to <a href="https://www.playstation.com/en-us/playstation-network/" target="_blank" rel="noopener noreferrer" className="underline font-medium">playstation.com</a></li>
                      <li>In the <strong>same browser</strong> (while still signed in), visit: <a href="https://ca.account.sony.com/api/v1/ssocookie" target="_blank" rel="noopener noreferrer" className="underline font-medium">Get NPSSO Token</a></li>
                      <li>Copy the <code className="bg-blue-100 px-1 rounded">npsso</code> value from the JSON response</li>
                      <li>Paste it above</li>
                    </ol>
                    <p className="text-xs text-blue-700 mt-2">💡 <strong>Tip:</strong> Keep this token secure! It's like your password.</p>
                  </div>
                </div>
                <button
                  onClick={handleConnectPSN}
                  disabled={connecting === 'playstation' || !psnNpso}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 w-full"
                >
                  {connecting === 'playstation' ? 'Connecting...' : 'Connect with NPSSO Token'}
                </button>
              </div>
            )}
          </div>
        )}

        {getConnectedPlatform('playstation')?.gamesData && Array.isArray(getConnectedPlatform('playstation')?.gamesData) && getConnectedPlatform('playstation')!.gamesData.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-semibold mb-2">Your Games ({getConnectedPlatform('playstation')?.gamesData.length})</h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {getConnectedPlatform('playstation')?.gamesData.slice(0, 10).map((game: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                  <span className="font-medium">{game.name}</span>
                  <div className="text-gray-600 text-xs">
                    {game.playtimeHours}h
                    {game.lastPlayed && (
                      <span className="ml-2">
                        • Last played: {new Date(game.lastPlayed).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {getConnectedPlatform('playstation')?.gamesData.length > 10 && (
                <p className="text-xs text-gray-500 text-center pt-2">
                  ... and {getConnectedPlatform('playstation')!.gamesData.length - 10} more games
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

