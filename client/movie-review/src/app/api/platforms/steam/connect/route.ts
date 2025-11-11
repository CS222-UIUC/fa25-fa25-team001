/**
 * ============================================================================
 * ROUTE: Steam Platform Connection API
 * ============================================================================
 * 
 * Endpoint: POST /api/platforms/steam/connect
 * Purpose: Connect a user's Steam account to their profile
 * 
 * Authentication: Required (session-based)
 * 
 * Request Body: { steamId: string }
 *   - steamId can be: 17-digit Steam ID, Steam profile URL, or vanity URL
 * 
 * Returns: { success: true, profileName: string }
 * 
 * Features:
 * - Validates Steam ID format and existence
 * - Resolves vanity URLs to Steam IDs
 * - Checks profile privacy settings
 * - Stores connection in database
 * 
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectPlatform } from '@/actions/platform';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const STEAM_API_KEY = process.env.STEAM_API_KEY || '';

interface SteamPlayerSummary {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  personastate: number;
  communityvisibilitystate: number; // 1 = private, 3 = public
}

interface SteamPlayerSummaryResponse {
  response: {
    players: SteamPlayerSummary[];
  };
}

/**
 * Extract Steam ID from various input formats (profile URL, Steam ID, etc.)
 */
function extractSteamId(input: string): string | null {
  // Remove whitespace
  input = input.trim();

  // If it's already a 17-digit Steam ID
  if (/^\d{17}$/.test(input)) {
    return input;
  }

  // Extract from Steam profile URL (e.g., https://steamcommunity.com/profiles/76561198000000000)
  const profileUrlMatch = input.match(/steamcommunity\.com\/profiles\/(\d{17})/);
  if (profileUrlMatch) {
    return profileUrlMatch[1];
  }

  // Extract from Steam profile URL with vanity URL (e.g., https://steamcommunity.com/id/username)
  // Note: We can't resolve vanity URLs without an API call, so return null to try lookup
  const vanityUrlMatch = input.match(/steamcommunity\.com\/id\/([^\/]+)/);
  if (vanityUrlMatch) {
    return null; // Will need to resolve via API
  }

  // Try to extract any 17-digit number from the string
  const digitMatch = input.match(/\b(\d{17})\b/);
  if (digitMatch) {
    return digitMatch[1];
  }

  return null;
}

/**
 * Resolve Steam vanity URL to Steam ID
 */
async function resolveVanityUrl(vanityName: string): Promise<string | null> {
  try {
    const url = `http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${STEAM_API_KEY}&vanityurl=${encodeURIComponent(vanityName)}&url_type=1`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.response && data.response.success === 1 && data.response.steamid) {
      return data.response.steamid;
    }
    return null;
  } catch (error) {
    console.error('Error resolving vanity URL:', error);
    return null;
  }
}

/**
 * Validate Steam ID by checking if it exists and is accessible
 */
async function validateSteamId(input: string): Promise<{ valid: boolean; error?: string; profile?: SteamPlayerSummary; steamId?: string }> {
  if (!STEAM_API_KEY) {
    return { valid: false, error: 'Steam API key not configured' };
  }

  // First, try to extract Steam ID from various formats
  let steamId = extractSteamId(input);

  // If we have a vanity URL, try to resolve it
  if (!steamId) {
    const vanityMatch = input.match(/steamcommunity\.com\/id\/([^\/]+)/);
    if (vanityMatch) {
      steamId = await resolveVanityUrl(vanityMatch[1]);
      if (!steamId) {
        return { valid: false, error: 'Could not find Steam account with that profile URL. Please use your 17-digit Steam ID or a valid Steam profile URL.' };
      }
    } else {
      // Try treating the input as a vanity name directly
      steamId = await resolveVanityUrl(input);
      if (!steamId) {
        return { valid: false, error: 'Invalid Steam ID format. Please provide:\n- A 17-digit Steam ID (e.g., 76561198000000000)\n- Your Steam profile URL (e.g., https://steamcommunity.com/profiles/76561198000000000)\n- Or your Steam custom URL (e.g., https://steamcommunity.com/id/yourname)' };
      }
    }
  }

  // Now validate the Steam ID

  try {
    // Use GetPlayerSummaries to verify the Steam ID exists and get profile info
    const url = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId}`;
    const response = await fetch(url);
    const data: SteamPlayerSummaryResponse = await response.json();

    if (!data.response || !data.response.players || data.response.players.length === 0) {
      return { valid: false, error: 'Steam ID not found. Please check the Steam ID and try again.' };
    }

    const player = data.response.players[0];

    // Check if profile is public (communityvisibilitystate: 3 = public, 1 = private)
    if (player.communityvisibilitystate === 1) {
      return { 
        valid: false, 
        error: 'Steam profile is set to private. Please set your Steam profile to public to view your games.' 
      };
    }

    return { valid: true, profile: player, steamId };
  } catch (error) {
    console.error('Error validating Steam ID:', error);
    return { valid: false, error: 'Failed to validate Steam ID. Please try again.' };
  }
}

/**
 * Connect a Steam account by Steam ID
 * POST /api/platforms/steam/connect
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { steamId } = await request.json();

    if (!steamId) {
      return NextResponse.json({ error: 'Steam ID required' }, { status: 400 });
    }

    // Validate Steam ID before saving (handles URLs, vanity names, etc.)
    const validation = await validateSteamId(steamId);
    if (!validation.valid || !validation.steamId) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Use the validated Steam ID (may differ from input if vanity URL was provided)
    const validatedSteamId = validation.steamId;

    // Store the connection
    const result = await connectPlatform({
      platformType: 'steam',
      platformUserId: validatedSteamId,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      profileName: validation.profile?.personaname 
    });
  } catch (error) {
    console.error('Error connecting Steam account:', error);
    return NextResponse.json(
      { error: 'Failed to connect Steam account' },
      { status: 500 }
    );
  }
}

