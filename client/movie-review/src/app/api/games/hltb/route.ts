/**
 * HowLongToBeat API Route
 * GET /api/games/hltb?gameName=GameName
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGameTime } from '@/lib/api/howlongtobeat';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gameName = searchParams.get('gameName');

    if (!gameName) {
      return NextResponse.json(
        { error: 'Game name is required' },
        { status: 400 }
      );
    }

    const hltbData = await getGameTime(gameName);

    if (!hltbData) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No HowLongToBeat data found for this game. This may be due to rate limiting or the game not being in the database.',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        name: hltbData.name,
        imageUrl: hltbData.imageUrl,
        gameplayMain: hltbData.gameplayMain,
        gameplayMainExtra: hltbData.gameplayMainExtra,
        gameplayCompletionist: hltbData.gameplayCompletionist,
        similarity: hltbData.similarity,
        searchTerm: hltbData.searchTerm,
        playableOn: hltbData.playableOn,
        timeLabels: hltbData.timeLabels,
      },
    });
  } catch (error) {
    // Silently handle errors - return success with null data instead of error
    // This prevents the API from returning 500 errors when HowLongToBeat is rate-limited
    console.warn('HowLongToBeat API Error (likely rate limiting):', error);
    return NextResponse.json({
      success: true,
      data: null,
      message: 'Unable to fetch HowLongToBeat data. This may be due to rate limiting.',
    });
  }
}

