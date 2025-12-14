"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Gamepad2, RefreshCw, Unlink, ExternalLink, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface User {
  id: string;
  username: string;
  profilePicture: string;
}

interface ConnectionsTabProps {
  user: User;
}

interface Connection {
  id: string;
  provider: 'steam' | 'xbox' | 'playstation';
  providerAccountId: string;
  username?: string;
  connected: boolean;
  lastSync?: string;
  games?: any[];
}

type Provider = Connection['provider'];

export default function ConnectionsTab({ user }: ConnectionsTabProps) {
  const { data: session } = useSession();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [expandedProvider, setExpandedProvider] = useState<Connection['provider'] | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isOwnProfile = session?.user?.id === user?.id;

  useEffect(() => {
    if (user?.id) {
      loadConnections();
    }
  }, [user?.id]);

  const loadConnections = async () => {
    try {
      const response = await fetch(`/api/users/profile?username=${user.username}`, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        const platformConnections = data.user.platform_connections || [];
        
        const steamConnection = platformConnections.find((c: any) => c.platformType === 'steam');
        const xboxConnection = platformConnections.find((c: any) => c.platformType === 'xbox');
        const psnConnection = platformConnections.find((c: any) => c.platformType === 'playstation');

        const nextConnections: Connection[] = [
          {
            id: 'steam',
            provider: 'steam',
            providerAccountId: steamConnection?.platformUserId || '',
            username: steamConnection?.platformUserId ? 'Connected' : undefined,
            connected: !!steamConnection,
            lastSync: steamConnection?.lastSyncedAt,
            games: steamConnection?.gamesData || []
          },
          {
            id: 'xbox',
            provider: 'xbox',
            providerAccountId: xboxConnection?.platformUserId || '',
            username: xboxConnection?.platformUserId ? 'Connected' : undefined,
            connected: !!xboxConnection,
            lastSync: xboxConnection?.lastSyncedAt,
            games: xboxConnection?.gamesData || []
          },
          {
            id: 'playstation',
            provider: 'playstation',
            providerAccountId: psnConnection?.platformUserId || '',
            username: psnConnection?.platformUserId ? 'Connected' : undefined,
            connected: !!psnConnection,
            lastSync: psnConnection?.lastSyncedAt,
            games: psnConnection?.gamesData || []
          }
        ];

        setConnections(nextConnections);

        if (expandedProvider) {
          const stillConnected = nextConnections.some(
            (c) => c.provider === expandedProvider && c.connected
          );
          if (!stillConnected) {
            setExpandedProvider(null);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (provider: Provider) => {
    window.location.href = `/api/${provider}/auth`;
  };

  const handleDisconnect = async (provider: Provider) => {
    if (!confirm(`Are you sure you want to disconnect your ${provider} account?`)) {
      return;
    }

    try {
      setActionError(null);
      let response = await fetch(`/api/${provider}/disconnect`, { method: 'DELETE' });

      // Fallback: some deployments block DELETE
      if (response.status === 405) {
        response = await fetch(`/api/${provider}/disconnect`, { method: 'POST' });
      }

      if (response.ok) {
        setExpandedProvider((current) => (current === provider ? null : current));
        loadConnections();
      } else {
        const body = await response.json().catch(() => null);
        setActionError(body?.error || 'Failed to disconnect. Please try again.');
      }
    } catch (error) {
      console.error(`Failed to disconnect ${provider}:`, error);
      setActionError('Failed to disconnect. Please try again.');
    }
  };

  const handleSync = async (provider: Provider) => {
    setSyncing(provider);
    try {
      setActionError(null);
      const response = await fetch(`/api/${provider}/sync`, { method: 'POST' });
      if (response.ok) {
        setExpandedProvider(provider);
        loadConnections();
      } else {
        const body = await response.json().catch(() => null);
        setActionError(body?.error || 'Sync failed. Please try again later.');
      }
    } catch (error) {
      console.error(`Failed to sync ${provider}:`, error);
      setActionError('Sync failed. Please try again later.');
    } finally {
      setSyncing(null);
    }
  };

  const toggleExpand = (provider: Provider) => {
    setExpandedProvider(expandedProvider === provider ? null : provider);
  };

  const renderGamesList = (connection: Connection) => {
    if (!connection.games || connection.games.length === 0) {
      return <p className="text-sm text-muted-foreground p-4">No games synced yet.</p>;
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-secondary/20 rounded-b-xl border-t border-border">
        {connection.games.map((game: any, index: number) => (
          <div key={index} className="flex items-center gap-3 p-2 bg-background rounded-lg border border-border">
            {game.img_icon_url || game.image || game.cover ? (
              <img 
                src={game.img_icon_url || game.image || game.cover} 
                alt={game.name || game.title} 
                className="w-10 h-10 rounded object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-secondary rounded flex items-center justify-center">
                <Gamepad2 className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{game.name || game.title}</p>
              {game.playtime_forever !== undefined && (
                <p className="text-xs text-muted-foreground">
                  {Math.round(game.playtime_forever / 60)}h played
                </p>
              )}
              {game.progress !== undefined && (
                <div className="w-full bg-secondary h-1.5 rounded-full mt-1">
                  <div 
                    className="bg-primary h-1.5 rounded-full" 
                    style={{ width: `${game.progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Connected Accounts</h2>
      </div>

      {actionError && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm">
          {actionError}
        </div>
      )}

      <div className="grid gap-4">
        {/* Steam Connection */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#171a21] rounded-lg flex items-center justify-center flex-shrink-0">
                <Gamepad2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Steam</h3>
                <p className="text-sm text-muted-foreground">
                  Sync your Steam library and achievements.
                </p>
                {connections.find(c => c.provider === 'steam')?.connected && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-green-500">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Connected</span>
                    {connections.find(c => c.provider === 'steam')?.lastSync && (
                      <span className="text-muted-foreground text-xs ml-2">
                        Last synced: {new Date(connections.find(c => c.provider === 'steam')?.lastSync!).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {connections.find(c => c.provider === 'steam')?.connected ? (
                <>
                  <button
                    onClick={() => toggleExpand('steam')}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                  >
                    {expandedProvider === 'steam' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                  {isOwnProfile && (
                    <>
                      <button
                        onClick={() => handleSync('steam')}
                        disabled={syncing === 'steam'}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                        title="Sync Library"
                      >
                        <RefreshCw className={`h-5 w-5 ${syncing === 'steam' ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleDisconnect('steam')}
                        className="px-4 py-2 border border-destructive/50 text-destructive hover:bg-destructive/10 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <Unlink className="h-4 w-4" />
                        Disconnect
                      </button>
                    </>
                  )}
                </>
              ) : isOwnProfile && (
                <button
                  onClick={() => handleConnect('steam')}
                  className="px-4 py-2 bg-[#171a21] text-white hover:bg-[#171a21]/90 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Connect Steam
                </button>
              )}
            </div>
          </div>
          {expandedProvider === 'steam' && renderGamesList(connections.find(c => c.provider === 'steam')!)}
        </div>

        {/* Xbox Connection */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#107C10] rounded-lg flex items-center justify-center flex-shrink-0">
                <Gamepad2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Xbox Live</h3>
                <p className="text-sm text-muted-foreground">
                  Sync your Xbox game history.
                </p>
                {connections.find(c => c.provider === 'xbox')?.connected && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-green-500">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Connected</span>
                    {connections.find(c => c.provider === 'xbox')?.lastSync && (
                      <span className="text-muted-foreground text-xs ml-2">
                        Last synced: {new Date(connections.find(c => c.provider === 'xbox')?.lastSync!).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {connections.find(c => c.provider === 'xbox')?.connected ? (
                <>
                  <button
                    onClick={() => toggleExpand('xbox')}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                  >
                    {expandedProvider === 'xbox' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                  {isOwnProfile && (
                    <>
                      <button
                        onClick={() => handleSync('xbox')}
                        disabled={syncing === 'xbox'}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                        title="Sync Library"
                      >
                        <RefreshCw className={`h-5 w-5 ${syncing === 'xbox' ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleDisconnect('xbox')}
                        className="px-4 py-2 border border-destructive/50 text-destructive hover:bg-destructive/10 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <Unlink className="h-4 w-4" />
                        Disconnect
                      </button>
                    </>
                  )}
                </>
              ) : isOwnProfile && (
                <button
                  onClick={() => handleConnect('xbox')}
                  className="px-4 py-2 bg-[#107C10] text-white hover:bg-[#107C10]/90 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Connect Xbox
                </button>
              )}
            </div>
          </div>
          {expandedProvider === 'xbox' && renderGamesList(connections.find(c => c.provider === 'xbox')!)}
        </div>

        {/* PlayStation Connection */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#003791] rounded-lg flex items-center justify-center flex-shrink-0">
                <Gamepad2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">PlayStation Network</h3>
                <p className="text-sm text-muted-foreground">
                  Sync your PSN trophies and games.
                </p>
                {connections.find(c => c.provider === 'playstation')?.connected && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-green-500">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Connected</span>
                    {connections.find(c => c.provider === 'playstation')?.lastSync && (
                      <span className="text-muted-foreground text-xs ml-2">
                        Last synced: {new Date(connections.find(c => c.provider === 'playstation')?.lastSync!).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {connections.find(c => c.provider === 'playstation')?.connected ? (
                <>
                  <button
                    onClick={() => toggleExpand('playstation')}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                  >
                    {expandedProvider === 'playstation' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                  {isOwnProfile && (
                    <>
                      <button
                        onClick={() => handleSync('playstation')}
                        disabled={syncing === 'playstation'}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                        title="Sync Library"
                      >
                        <RefreshCw className={`h-5 w-5 ${syncing === 'playstation' ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleDisconnect('playstation')}
                        className="px-4 py-2 border border-destructive/50 text-destructive hover:bg-destructive/10 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <Unlink className="h-4 w-4" />
                        Disconnect
                      </button>
                    </>
                  )}
                </>
              ) : isOwnProfile && (
                <button
                  onClick={() => handleConnect('playstation')}
                  className="px-4 py-2 bg-[#003791] text-white hover:bg-[#003791]/90 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Connect PSN
                </button>
              )}
            </div>
          </div>
          {expandedProvider === 'playstation' && renderGamesList(connections.find(c => c.provider === 'playstation')!)}
        </div>
      </div>

      {!isOwnProfile && connections.every(c => !c.connected) && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No connected accounts</h3>
          <p className="text-muted-foreground">
            This user hasn't connected any external accounts yet.
          </p>
        </div>
      )}
    </div>
  );
}
