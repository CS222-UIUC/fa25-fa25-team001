/**
 * HowLongToBeat API Client for fetching game completion time data
 */

import { HowLongToBeatService, HowLongToBeatEntry } from 'howlongtobeat';

let hltbService = new HowLongToBeatService();

/**
 * Search for a game on HowLongToBeat
 */
export async function searchGame(gameTitle: string): Promise<HowLongToBeatEntry[]> {
  try {
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const results = await hltbService.search(gameTitle);
    return results;
  } catch (error) {
    // Log the error but don't throw - return empty array instead
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check if it's a 403 or rate limit error
    if (errorMessage.includes('403') || errorMessage.includes('Forbidden') || errorMessage.includes('rate limit')) {
      console.warn(`HowLongToBeat rate limited or blocked for "${gameTitle}". This is normal - the service may have rate limits.`);
    } else {
      console.error('HowLongToBeat search error:', errorMessage);
    }
    
    // Return empty array instead of throwing
    return [];
  }
}

/**
 * Get the best match for a game title
 */
export async function getGameTime(gameTitle: string): Promise<HowLongToBeatEntry | null> {
  try {
    const results = await searchGame(gameTitle);
    if (results.length > 0) {
      // Sort by similarity (highest first) to get the best match
      // The first result is usually the best, but let's make sure
      const sortedResults = [...results].sort((a, b) => {
        const similarityA = a.similarity || 0;
        const similarityB = b.similarity || 0;
        return similarityB - similarityA;
      });
      
      const bestMatch = sortedResults[0];
      
      // Log for debugging
      console.log('HowLongToBeat search results:', {
        query: gameTitle,
        resultsCount: results.length,
        bestMatch: {
          name: bestMatch.name,
          similarity: bestMatch.similarity,
          gameplayMain: bestMatch.gameplayMain,
          gameplayMainExtra: bestMatch.gameplayMainExtra,
          gameplayCompletionist: bestMatch.gameplayCompletionist,
        },
      });
      
      return bestMatch;
    }
    return null;
  } catch (error) {
    // This should rarely happen now since searchGame doesn't throw
    console.error('HowLongToBeat getGameTime error:', error);
    return null;
  }
}

