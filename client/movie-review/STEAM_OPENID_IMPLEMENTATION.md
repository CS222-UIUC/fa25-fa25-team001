# Steam OpenID Implementation Guide

## Overview

To provide a **username/password** experience (users click "Sign in with Steam"), you need to implement Steam OpenID authentication.

## Why This is Better

**Current**: Users must manually find and paste their Steam ID  
**With OpenID**: Users click "Sign in with Steam" → authenticate with Steam → automatic connection

## Implementation Steps

### 1. Install Required Package

```bash
npm install passport passport-steam
npm install --save-dev @types/passport @types/passport-steam
```

### 2. Set Up Steam OpenID

Steam OpenID doesn't require an API key - users authenticate directly with Steam.

### 3. Create Steam OpenID Route

Create `/api/platforms/steam/oauth/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const STEAM_OPENID_REALM = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const STEAM_OPENID_RETURN_URL = `${STEAM_OPENID_REALM}/api/platforms/steam/oauth/callback`;

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // Generate OpenID parameters
  const nonce = Math.random().toString(36).substring(2, 15);
  const state = Math.random().toString(36).substring(2, 15);

  // Store nonce and state in session/cookie for verification

  // Redirect to Steam OpenID
  const steamOpenIdUrl = new URL('https://steamcommunity.com/openid/login');
  steamOpenIdUrl.searchParams.set('openid.ns', 'http://specs.openid.net/auth/2.0');
  steamOpenIdUrl.searchParams.set('openid.mode', 'checkid_setup');
  steamOpenIdUrl.searchParams.set('openid.return_to', STEAM_OPENID_RETURN_URL);
  steamOpenIdUrl.searchParams.set('openid.realm', STEAM_OPENID_REALM);
  steamOpenIdUrl.searchParams.set('openid.claimed_id', 'http://specs.openid.net/auth/2.0/identifier_select');
  steamOpenIdUrl.searchParams.set('openid.identity', 'http://specs.openid.net/auth/2.0/identifier_select');
  steamOpenIdUrl.searchParams.set('openid.ns.sreg', 'http://openid.net/extensions/sreg/1.1');

  return NextResponse.redirect(steamOpenIdUrl.toString());
}
```

### 4. Create Callback Route

Create `/api/platforms/steam/oauth/callback/route.ts` to handle the Steam redirect and extract the Steam ID.

### 5. Update UI

Replace the Steam ID input with a "Sign in with Steam" button that redirects to the OpenID flow.

## Complexity

**Steam OpenID is moderately complex** because:
- Requires handling OpenID protocol (not OAuth 2.0)
- Need to verify the OpenID response
- Must extract Steam ID from the OpenID response

## Alternative: Keep Current + Better UX

**Current implementation is simpler and works** - you've now added:
- ✅ Steam ID validation (no more fake IDs)
- ✅ Support for profile URLs (users can paste URLs)
- ✅ Clear error messages
- ✅ Privacy setting guidance

**Users can now just paste their Steam profile URL**, which is much easier than finding the Steam ID.

## Recommendation

**Option 1**: Implement Steam OpenID (better UX, more work)
**Option 2**: Keep current implementation (simpler, already works well with URL support)

For **PlayStation**: There's no OAuth option, so NPSSO is the only way. The improved instructions make this manageable.

