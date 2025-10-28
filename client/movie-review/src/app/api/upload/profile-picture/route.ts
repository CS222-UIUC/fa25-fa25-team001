import { NextResponse } from 'next/server';

// Deprecated REST route: profile picture upload is now handled via server actions in `src/actions/upload.ts`.
const message = 'Deprecated: This REST endpoint has been removed. Use server actions instead.';

export function POST() {
  return NextResponse.json({ error: message }, { status: 410 });
}