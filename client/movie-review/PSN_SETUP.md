# PlayStation Network (PSN) Setup Guide

This guide will help you set up PlayStation Network integration for your movie-review application.

## Overview

The `psn-api` package has been installed and is ready to use. This integration will allow users to link their PSN accounts and view their gaming data.

## Obtaining Your NPSSO Token

To authenticate with the PlayStation Network API, you need to obtain an NPSSO (NPSSO) token:

1. **Sign in to PlayStation**: Visit [https://www.playstation.com/](https://www.playstation.com/) and sign in with your PSN account
   
2. **Get your NPSSO**: In the same browser (this is important - you must use the same browser due to cookies), visit:
   ```
   https://ca.account.sony.com/api/v1/ssocookie
   ```

3. **Copy your token**: You'll see a JSON response like:
   ```json
   { "npsso": "aKuSwqqMOOeZBFkTQ9GWtKJgqZgVErYFx2pgTTIJCoTH9PC8FmUjcI0UKjnXDGH4" }
   ```
   
   **⚠️ IMPORTANT**: Copy your NPSSO token. This is equivalent to your password - keep it secure!

4. **Add to environment variables**: Create or update your `.env.local` file:
   ```env
   PSN_NPSSO=your_npsso_token_here
   ```

   **Note**: If you see an error when visiting the ssocookie URL, try using a different browser or clearing your cookies.

## Environment Variables

Create a `.env.local` file in the root of your project (if it doesn't exist) and add:

```env
# Database
DATABASE_URL=your_database_url

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here

# Steam API
STEAM_API_KEY=your_steam_api_key

# PSN API
PSN_NPSSO=your_npsso_token_here
```

**Note**: The `.env.local` file should already be in your `.gitignore` and should not be committed to version control.

## Using psn-api

The library is now available in your project. Here's a basic example of how to use it:

```typescript
import {
  exchangeNpssoForAccessCode,
  exchangeAccessCodeForAuthTokens,
  getUserTitles,
  getUserPlayedGames
} from 'psn-api';

// First, exchange your NPSSO for an access code
const myNpsso = process.env.PSN_NPSSO!;
const accessCode = await exchangeNpssoForAccessCode(myNpsso);

// Then exchange the access code for access and refresh tokens
const authorization = await exchangeAccessCodeForAuthTokens(accessCode);

// Now you can use any endpoint with your access token
const userTitles = await getUserTitles(
  { accessToken: authorization.accessToken },
  "me"
);

// Get recently played games
const playedGames = await getUserPlayedGames(
  { accessToken: authorization.accessToken },
  "me"
);
```

## Available PSN API Endpoints

### Authentication
- `exchangeNpssoForAccessCode(npsso)` - Exchange NPSSO for access code
- `exchangeAccessCodeForAuthTokens(accessCode)` - Get access and refresh tokens
- `exchangeRefreshTokenForAuthTokens(refreshToken)` - Refresh access token

### User Data
- `getProfileFromUserName()` - Get user profile from username
- `getProfileFromAccountId()` - Get user profile from account ID
- `getUserFriendsAccountIds()` - Get user's friends list
- `getBasicPresence()` - Get user's online status
- `getUserRegion()` - Get user's region info
- `getAccountDevices()` - Get devices (PS5, PS4, etc.)

### Games & Trophies
- `getUserTitles()` - Get all games with trophies
- `getUserPlayedGames()` - Get played games with playtime
- `getRecentlyPlayedGames()` - Get recently played games
- `getTitleTrophies()` - Get all trophies for a game
- `getTitleTrophyGroups()` - Get trophy groups (base game + DLC)
- `getUserTrophiesEarnedForTitle()` - Get earned trophies for a game
- `getUserTrophyProfileSummary()` - Get overall trophy summary

### Search
- `makeUniversalSearch()` - Search PSN (useful for finding accountIds from usernames)

## Next Steps

To integrate PSN into your platform connections:

1. Create PSN API routes similar to your Steam routes:
   - `src/app/api/platforms/psn/connect/route.ts`
   - `src/app/api/platforms/psn/games/route.ts`

2. Update the `PlatformConnections` component to include PSN
3. Store PSN tokens in the `PlatformConnection` model
4. Implement token refresh logic using refresh tokens

## Documentation

- Official psn-api documentation: https://psn-api.achievements.app
- Get started guide: https://psn-api.achievements.app/get-started
- Authentication guide: https://psn-api.achievements.app/authentication/authenticating-manually

## Security Notes

⚠️ **Important**: In production, you should:
- Encrypt NPSSO tokens before storing in database
- Use environment variables for all API keys
- Implement proper token refresh logic
- Never expose NPSSO tokens in client-side code or logs
- Consider rate limiting your PSN API calls

## Troubleshooting

**Error when visiting ssocookie URL**: Try a different browser or clear cookies

**Token expiration**: PSN tokens expire. Use the `exchangeRefreshTokenForAuthTokens()` function with your stored refresh token

**"Invalid NPSSO" error**: Make sure you copied the full token and that you're using the correct URL format

**Need to find a user**: Use `makeUniversalSearch()` to search for users by username and get their `accountId`

## References

- psn-api GitHub: https://github.com/achievements-app/psn-api
- PlayStation API Community Docs: https://andshrew.github.io/PlayStation-Trophies/

