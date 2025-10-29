/**
 * HowLongToBeat API Integration
 * Uses the howlongtobeat npm package
 */

import { HowLongToBeatService, HowLongToBeatEntry } from 'howlongtobeat';

export interface GameCompletionTime {
  name: string;
  mainStory: number | null; // in hours
  mainPlusExtra: number | null;
  completionist: number | null;
  allStyles: number | null;
  gameplayMain: number | null;
  gameplayMainExtra: number | null;
  gameplayComplete: number | null;
}

export class HowLongToBeatClient {
  private service: HowLongToBeatService;

  constructor() {
    this.service = new HowLongToBeatService();
  }

  /**
   * Search for a game and get completion times
   */
  async searchGame(gameName: string): Promise<GameCompletionTime[]> {
    try {
      const results = await this.service.search(gameName);
      return this.mapResults(results);
    } catch (error) {
      console.error('HowLongToBeat API error:', error);
      throw new Error(`Failed to search game: ${gameName}`);
    }
  }

  /**
   * Get detailed completion data by game ID
   */
  async getGameDetails(gameId: string): Promise<GameCompletionTime | null> {
    try {
      const result = await this.service.detail(gameId);
      return this.mapSingleResult(result);
    } catch (error) {
      console.error('HowLongToBeat API error:', error);
      return null;
    }
  }

  private mapResults(entries: HowLongToBeatEntry[]): GameCompletionTime[] {
    return entries.map(entry => ({
      name: entry.name,
      mainStory: entry.gameplayMain || null,
      mainPlusExtra: entry.gameplayMainExtra || null,
      completionist: entry.gameplayComplete || null,
      allStyles: entry.gameplayCompletionist || null,
      gameplayMain: entry.gameplayMain || null,
      gameplayMainExtra: entry.gameplayMainExtra || null,
      gameplayComplete: entry.gameplayComplete || null,
    }));
  }

  private mapSingleResult(entry: HowLongToBeatEntry | null): GameCompletionTime | null {
    if (!entry) return null;

    return {
      name: entry.name,
      mainStory: entry.gameplayMain || null,
      mainPlusExtra: entry.gameplayMainExtra || null,
      completionist: entry.gameplayComplete || null,
      allStyles: entry.gameplayCompletionist || null,
      gameplayMain: entry.gameplayMain || null,
      gameplayMainExtra: entry.gameplayMainExtra || null,
      gameplayComplete: entry.gameplayComplete || null,
    };
  }

  /**
   * Get estimated completion time for a game
   * Returns the average of available completion times
   */
  static getAverageCompletionTime(gameData: GameCompletionTime): number | null {
    const times = [
      gameData.mainStory,
      gameData.mainPlusExtra,
      gameData.completionist,
      gameData.allStyles,
    ].filter((t): t is number => t !== null);

    if (times.length === 0) return null;

    return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  }
}

export const howlongtobeatClient = new HowLongToBeatClient();

