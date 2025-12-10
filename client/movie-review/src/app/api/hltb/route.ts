/**
 * ============================================================================
 * API ROUTE: HowLongToBeat Search
 * ============================================================================
 * Route: GET /api/hltb?q=gameName
 * Purpose: Search for games on HowLongToBeat and return completion time data
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { HowLongToBeatService } from 'howlongtobeat';

const hltb = new HowLongToBeatService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter "q"' },
        { status: 400 }
      );
    }

    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));

    const results = await hltb.search(query);

    if (!results || results.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No HowLongToBeat data found for this game',
      });
    }

    // Return the best match (first result, usually highest similarity)
    const bestMatch = results[0];

    return NextResponse.json({
      success: true,
      data: {
        id: bestMatch.id,
        name: bestMatch.name,
        imageUrl: bestMatch.imageUrl,
        gameplayMain: bestMatch.gameplayMain,
        gameplayMainExtra: bestMatch.gameplayMainExtra,
        gameplayCompletionist: bestMatch.gameplayCompletionist,
        similarity: bestMatch.similarity,
        searchTerm: bestMatch.searchTerm,
        playableOn: bestMatch.playableOn,
        timeLabels: bestMatch.timeLabels,
      },
      allResults: results.map(r => ({
        id: r.id,
        name: r.name,
        similarity: r.similarity,
      })),
    });
  } catch (error) {
    // Handle errors gracefully - HowLongToBeat may have rate limits
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
      console.warn('HowLongToBeat rate limited or blocked');
      return NextResponse.json({
        success: false,
        error: 'HowLongToBeat service is currently unavailable (rate limited)',
        data: null,
      }, { status: 503 });
    }

    console.error('HowLongToBeat API Error:', errorMessage);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch HowLongToBeat data',
      data: null,
    }, { status: 500 });
  }
}

