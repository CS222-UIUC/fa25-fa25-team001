# Favorites and Recent Games Implementation

## Overview
Successfully implemented the ability for users to add their 5 most favorite games, movies, and TV shows, plus display recently played games from connected platforms (Steam, Xbox, PlayStation) with posters from IGDB.

## Features Implemented

### 1. Database Schema Updates ✅
- Added three JSON fields to the `User` model in Prisma:
  - `favoriteGames` - Array of up to 5 favorite games
  - `favoriteMovies` - Array of up to 5 favorite movies
  - `favoriteTvShows` - Array of up to 5 favorite TV shows
- Schema migration applied successfully

### 2. Favorites Management ✅

#### Server Actions (`src/actions/favorites.ts`)
- `getFavorites()` - Fetch user's favorites
- `updateFavoriteGames(games)` - Update favorite games (max 5)
- `updateFavoriteMovies(movies)` - Update favorite movies (max 5)
- `updateFavoriteTvShows(tvShows)` - Update favorite TV shows (max 5)

#### FavoritesSection Component (`src/components/FavoritesSection.tsx`)
- Interactive UI for managing favorites
- Search functionality for games (via IGDB), movies, and TV shows (via OMDB)
- Add/remove favorites with poster images
- Visual grid display with poster artwork
- Enforces 5-item limit per category

### 3. Recent Games with Posters ✅

#### API Route (`src/app/api/games/posters/route.ts`)
- Fetches recently played games from connected platforms (Steam, Xbox, PlayStation)
- Retrieves game posters from IGDB using Twitch API
- Combines data from all connected platforms
- Returns up to 20 most recently played games with posters

#### RecentGamesSection Component (`src/components/RecentGamesSection.tsx`)
- Displays recently played games with poster artwork
- Shows platform badge, playtime, and last played date
- Handles games without posters gracefully
- Refresh button to reload game data

### 4. Search API ✅
- Created `/api/search` route for searching games, movies, and TV shows
- Supports searching via IGDB (games) and OMDB (movies/TV shows)
- Returns formatted results with poster URLs

### 5. Profile Page Integration ✅
- Updated `src/app/user/profile/page.tsx` to include:
  - FavoritesSection component
  - RecentGamesSection component
- Both sections appear below platform connections

### 6. Configuration Updates ✅
- Updated `next.config.ts` to allow external images from:
  - IGDB (images.igdb.com)
  - OMDB/IMDB (m.media-amazon.com, ia.media-imdb.com)

## API Integrations Used

### IGDB (via Twitch API)
- Used for searching games and fetching game posters
- Requires `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` environment variables
- Already configured in existing codebase

### OMDB API
- Used for searching movies and TV shows
- Requires `OMDB_API_KEY` environment variable
- Already configured in existing codebase

### Platform APIs
- **Steam**: Already integrated, fetches games from Steam API
- **Xbox**: Already integrated
- **PlayStation**: Already integrated via PSN API

## User Flow

1. **Adding Favorites:**
   - User navigates to profile page
   - Clicks "Add" button on a favorites section (Games/Movies/TV Shows)
   - Searches for a game/movie/TV show
   - Selects from search results
   - Item is added to favorites (up to 5 per category)

2. **Viewing Recent Games:**
   - User connects gaming platforms (Steam/Xbox/PlayStation) on profile page
   - Syncs games from platforms
   - Recent games section automatically displays recently played games
   - Posters are fetched from IGDB and displayed
   - Games are sorted by last played date

## Technical Details

### Data Structure

#### Favorite Game
```typescript
{
  id: string;
  title: string;
  posterUrl?: string;
  platform?: string;
  igdbId?: number;
}
```

#### Favorite Movie/TV Show
```typescript
{
  id: string;
  title: string;
  posterUrl?: string;
  year?: number;
  tmdbId?: string; // Actually IMDB ID from OMDB
}
```

### Rate Limiting
- IGDB API calls include 100ms delay between requests to avoid rate limiting
- Recent games are limited to 10 per platform, 20 total

### Error Handling
- Gracefully handles games/movies without posters
- Shows fallback UI when posters are unavailable
- Handles API failures without breaking the UI

## Environment Variables Required

Ensure these are set in your `.env` file:
- `TWITCH_CLIENT_ID` - For IGDB API access
- `TWITCH_CLIENT_SECRET` - For IGDB API access
- `OMDB_API_KEY` - For movie/TV show search
- `STEAM_API_KEY` - For Steam game data (already required)
- `PSN_NPSSO` - For PlayStation game data (already required)

## Future Enhancements

Potential improvements:
1. Caching game posters to reduce API calls
2. Batch fetching posters for better performance
3. Allowing reordering of favorites
4. Adding more metadata to favorites (ratings, genres, etc.)
5. Sharing favorites with friends
6. Public/private favorite lists

## Notes

- The `bio` field was removed from the User model during migration (it wasn't in the schema but existed in the database)
- All favorites are stored as JSON arrays in the database
- Poster images are stored as URLs, not uploaded files
- Recent games are dynamically fetched and not permanently stored (only cached in platform connections)
