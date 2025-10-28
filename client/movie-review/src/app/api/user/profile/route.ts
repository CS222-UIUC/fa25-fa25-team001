import { NextResponse } from 'next/server';

// Deprecated REST route: profile operations are now handled via server actions in `src/actions/user.ts`.
const message = 'Deprecated: This REST endpoint has been removed. Use server actions instead.';

export function GET() {
  return NextResponse.json({ error: message }, { status: 410 });
}

export function PUT() {
  return NextResponse.json({ error: message }, { status: 410 });
}