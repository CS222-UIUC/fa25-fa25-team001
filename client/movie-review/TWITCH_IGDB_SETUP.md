# Twitch OAuth Setup for IGDB API

This guide will help you set up Twitch OAuth to access the IGDB (Internet Game Database) API through NextAuth.

## Why Twitch?

Twitch owns IGDB, the largest video game database. To use IGDB's API, you need to authenticate through Twitch OAuth.

## Step 1: Create a Twitch Developer Application

1. Go to [Twitch Developers Console](https://dev.twitch.tv/console)
2. Sign in with your Twitch account
3. Click **"Register Your Application"** or **"Applications"** → **"Register"**
4. Fill in the application details:
   - **Name**: Your app name (e.g., "Media Review App")
   - **OAuth Redirect URLs**: `http://localhost:3000` (required, but not used for IGDB)
   - **Category**: Choose "Website Integration" or "Other"
5. Click **"Create"**

**Note**: The OAuth redirect URL is required by Twitch but not used in this setup. We use the Client ID and Secret directly with IGDB API.

## Step 2: Get Your Client ID and Secret

After creating the application:

1. You'll see your **Client ID** immediately
2. Click **"Manage"** or **"New Secret"** to generate a **Client Secret**
3. **Important**: Copy and save the Client Secret immediately - it won't be shown again!

## Step 3: Configure Environment Variables

Update your `.env` file with your Twitch credentials:

```env
TWITCH_CLIENT_ID=your_actual_client_id_here
TWITCH_CLIENT_SECRET=your_actual_client_secret_here
```

## Step 4: Restart Your Dev Server

```bash
npm run dev
```

## Step 5: Test Twitch OAuth

1. Navigate to `http://localhost:3000`
2. Attempt to sign in (the Twitch provider should now be available in NextAuth)
3. You should be redirected to Twitch's OAuth consent screen
4. After authorizing, you'll be redirected back to your app

## Using IGDB API

Once configured, you can use the IGDB API helper functions:

```typescript
import { searchGames, getGame, getPopularGames } from '@/lib/api/igdb';

// Search for games
const games = await searchGames('The Witcher 3', 20);

// Get specific game
const game = await getGame(1942);

// Get popular games
const popular = await getPopularGames(10);
```

Or use the API route:

```bash
# Search games
GET /api/igdb/search?q=The%20Witcher&limit=20
```

## Important URLs

- **Twitch Developer Console**: https://dev.twitch.tv/console
- **IGDB API Documentation**: https://api-docs.igdb.com/

## Troubleshooting

### "Invalid redirect URI"
- Ensure the exact URL in your Twitch app settings matches: `http://localhost:3000/api/auth/callback/twitch` (including http, no trailing slash)

### "Client credentials required"
- Make sure `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` are set in your `.env` file
- Restart your dev server after adding environment variables

### "Redirect URI mismatch"
- Check that you're using the correct base URL (localhost for dev, your domain for production)
- The redirect URI in Twitch console must match exactly with your `NEXTAUTH_URL`

## Next Steps

After successful OAuth setup, you can:
1. Store Twitch access tokens in your database for API access
2. Use IGDB API to fetch comprehensive game data
3. Enhance your video game search and information features

## Resources

- [NextAuth Twitch Provider Docs](https://next-auth.js.org/providers/twitch)
- [Twitch API Documentation](https://dev.twitch.tv/docs/)
- [IGDB API Documentation](https://api-docs.igdb.com/)

