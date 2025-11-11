# API Routes Reference

This document lists all API routes in the application for easy reference.

## Games Routes

### `/api/games/search`
- **File**: `src/app/api/games/search/route.ts`
- **Purpose**: Search for video games using IGDB API
- **Methods**: GET, POST
- **GET**: Search games by query (`q` parameter, optional `limit`)
- **POST**: Get detailed game information by IDs

### `/api/games/popular`
- **File**: `src/app/api/games/popular/route.ts`
- **Purpose**: Fetch popular/highly rated games from IGDB
- **Methods**: GET
- **Parameters**: Optional `limit` query parameter

## Movies Routes

### `/api/movies/search`
- **File**: `src/app/api/movies/search/route.ts`
- **Purpose**: Search for movies and TV shows using OMDB API
- **Methods**: GET
- **Parameters**: Required `q` (query), optional `page`

### `/api/movies/popular`
- **File**: `src/app/api/movies/popular/route.ts`
- **Purpose**: Fetch popular movies from OMDB
- **Methods**: GET
- **Parameters**: Optional `limit` query parameter

### `/api/movies/details`
- **File**: `src/app/api/movies/details/route.ts`
- **Purpose**: Get detailed movie information by IMDb ID
- **Methods**: GET
- **Parameters**: Required `id` (IMDb ID)

## Platform Routes

### Steam

#### `/api/platforms/steam/games`
- **File**: `src/app/api/platforms/steam/games/route.ts`
- **Purpose**: Fetch user's owned Steam games with playtime data
- **Methods**: GET
- **Auth**: Required

#### `/api/platforms/steam/connect`
- **File**: `src/app/api/platforms/steam/connect/route.ts`
- **Purpose**: Connect a Steam account by Steam ID/URL
- **Methods**: POST
- **Auth**: Required

#### `/api/platforms/steam/oauth`
- **File**: `src/app/api/platforms/steam/oauth/route.ts`
- **Purpose**: Initiate Steam OpenID authentication
- **Methods**: GET
- **Auth**: Required

#### `/api/platforms/steam/oauth/callback`
- **File**: `src/app/api/platforms/steam/oauth/callback/route.ts`
- **Purpose**: Handle Steam OpenID callback
- **Methods**: GET
- **Auth**: Required

### PlayStation Network (PSN)

#### `/api/platforms/psn/games`
- **File**: `src/app/api/platforms/psn/games/route.ts`
- **Purpose**: Fetch PlayStation games with playtime and trophy data
- **Methods**: GET
- **Auth**: Required

#### `/api/platforms/psn/connect`
- **File**: `src/app/api/platforms/psn/connect/route.ts`
- **Purpose**: Connect PlayStation account using NPSSO token
- **Methods**: POST
- **Auth**: Required

### Xbox

#### `/api/platforms/xbox/games`
- **File**: `src/app/api/platforms/xbox/games/route.ts`
- **Purpose**: Fetch Xbox games (placeholder - requires OAuth)
- **Methods**: GET
- **Auth**: Required

#### `/api/platforms/xbox/connect`
- **File**: `src/app/api/platforms/xbox/connect/route.ts`
- **Purpose**: Connect Xbox account
- **Methods**: POST
- **Auth**: Required

### Platform Management

#### `/api/platforms/disconnect`
- **File**: `src/app/api/platforms/disconnect/route.ts`
- **Purpose**: Disconnect a platform account
- **Methods**: DELETE
- **Auth**: Required
- **Parameters**: Required `platformType` query parameter

## Authentication Routes

### `/api/auth/[...nextauth]`
- **File**: `src/app/api/auth/[...nextauth]/route.ts`
- **Purpose**: NextAuth.js authentication handler
- **Methods**: GET, POST
- **Handles**: signin, signout, session, csrf, etc.

### `/api/auth/register`
- **File**: `src/app/api/auth/register/route.ts`
- **Purpose**: Register a new user account
- **Methods**: POST
- **Auth**: Not required (public)

## Notes

- All route files are named `route.ts` because Next.js App Router requires this naming convention
- Each route file contains a detailed header comment explaining its purpose
- Authentication requirements are noted in each file's header
- Platform routes that require OAuth tokens will have token refresh logic built-in

