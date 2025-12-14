# ⚠️ IMPORTANT: Route Files Renamed

## Current Status
The API route files have been renamed from `route.ts` to descriptive names for better navigation.

## ⚠️ BREAKING CHANGE
**Next.js App Router requires API route files to be named `route.ts` (or `route.js`).**

Renaming these files will **break all API endpoints**. The routes will not work until the files are renamed back to `route.ts`.

## File Mapping

| Old Name | New Name | Endpoint |
|----------|----------|----------|
| `route.ts` | `searchGames.ts` | `/api/games/search` |
| `route.ts` | `popularGames.ts` | `/api/games/popular` |
| `route.ts` | `searchMovies.ts` | `/api/movies/search` |
| `route.ts` | `popularMovies.ts` | `/api/movies/popular` |
| `route.ts` | `movieDetails.ts` | `/api/movies/details` |
| `route.ts` | `steamGames.ts` | `/api/platforms/steam/games` |
| `route.ts` | `steamConnect.ts` | `/api/platforms/steam/connect` |
| `route.ts` | `steamOAuth.ts` | `/api/platforms/steam/oauth` |
| `route.ts` | `steamOAuthCallback.ts` | `/api/platforms/steam/oauth/callback` |
| `route.ts` | `psnGames.ts` | `/api/platforms/psn/games` |
| `route.ts` | `psnConnect.ts` | `/api/platforms/psn/connect` |
| `route.ts` | `xboxGames.ts` | `/api/platforms/xbox/games` |
| `route.ts` | `xboxConnect.ts` | `/api/platforms/xbox/connect` |
| `route.ts` | `disconnectPlatform.ts` | `/api/platforms/disconnect` |
| `route.ts` | `registerUser.ts` | `/api/auth/register` |

## To Restore Functionality

If you want the routes to work again, rename all files back to `route.ts`:

```bash
# Example (PowerShell)
Rename-Item src/app/api/games/search/searchGames.ts route.ts
Rename-Item src/app/api/games/popular/popularGames.ts route.ts
# ... etc for all files
```

## Alternative Solutions

If you want descriptive names but working routes:

1. **Keep descriptive headers** - The comprehensive headers in each file already make it clear what each route does
2. **Use better folder structure** - The folder path already describes the route (e.g., `/api/games/search/`)
3. **Create a route index document** - Reference the `API_ROUTES_REFERENCE.md` file

## Next.js Requirement

Next.js App Router uses file-based routing with these conventions:
- API routes must be in `app/api/` directory
- Route files must be named `route.ts` or `route.js`
- The folder structure determines the URL path
- There is no configuration option to change this requirement

