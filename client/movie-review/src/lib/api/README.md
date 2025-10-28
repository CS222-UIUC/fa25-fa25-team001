# External API Integrations

This directory contains integrations for external APIs used in the application.

## RAWG.io API

The RAWG.io API provides video game data including:
- Game information (title, release date, ratings, platforms)
- Platform lists
- Game screenshots and metadata

### Setup

1. Get a free API key from [RAWG.io](https://rawg.io/apidocs)
2. Add it to your `.env` file:
   ```
   NEXT_PUBLIC_RAWG_API_KEY="your_api_key_here"
   ```

### API Routes

- `GET /api/rawg/platforms` - Get list of available platforms
- `GET /api/rawg/games?dates=YYYY-MM-DD,YYYY-MM-DD&platforms=1,18,7` - Get games by date and platform
- `GET /api/rawg/games/search?q=query` - Search for games

### Usage Example

```typescript
import { rawgApi } from '@/lib/api';

// Search for games
const games = await rawgApi.searchGames('The Witcher 3');

// Get platforms
const platforms = await rawgApi.getPlatforms();

// Get games by date and platform
const games = await rawgApi.getGames({
  dates: '2019-09-01,2019-09-30',
  platforms: '18,1,7',
  ordering: '-rating'
});
```

## HowLongToBeat API

The HowLongToBeat API provides game completion time estimates.

### Setup

No API key required! The `howlongtobeat` npm package is already installed.

### API Routes

- `GET /api/howlongtobeat/search?q=game_name` - Search for game completion times

### Usage Example

```typescript
import { howlongtobeatClient } from '@/lib/api';

// Search for game completion time
const results = await howlongtobeatClient.searchGame('The Witcher 3');

// Each result contains:
// - mainStory: hours for main story only
// - mainPlusExtra: hours for main story + extras
// - completionist: hours for 100% completion
```

## Environment Variables

Copy `.env.example` to `.env### and fill in your API keys:

```bash
cp .env.example .env
```

