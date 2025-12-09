/**
 * ============================================================================
 * ROUTE: User Registration API
 * ============================================================================
 * 
 * Endpoint: POST /api/auth/register
 * Purpose: Register a new user account
 * 
 * Authentication: Not required (public endpoint)
 * 
 * Request Body: { email: string, username: string, password: string }
 * 
 * Returns: { message: string, user: {...} }
 * 
 * Validation:
 * - Email, username, and password are required
 * - Password must be at least 6 characters
 * 
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { register_user } from '../[...nextauth]/server_actions';

export async function POST(request: NextRequest) {
  try {
    const { email, username, password } = await request.json();

    // Basic validation
    if (!email || !username || !password) {
      return NextResponse.json(
        { error: 'Email, username, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Register user
    const result = await register_user(email, username, password);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Account created successfully', user: result.user },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}