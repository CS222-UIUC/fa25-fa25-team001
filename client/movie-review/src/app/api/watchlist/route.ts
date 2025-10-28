import { NextResponse } from 'next/server';

// Deprecated REST route: watchlist is now handled via server actions in `src/actions/media.ts`.
const message = 'Deprecated: This REST endpoint has been removed. Use server actions instead.';

export function GET() {
  return NextResponse.json({ error: message }, { status: 410 });
}

export function POST() {
  return NextResponse.json({ error: message }, { status: 410 });
}

export function DELETE() {
  return NextResponse.json({ error: message }, { status: 410 });
}