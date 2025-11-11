import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Delete the Steam connection
    await prisma.platform_connections.deleteMany({
      where: {
        userId: session.user.id,
        platformType: 'steam'
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Steam disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Steam account' },
      { status: 500 }
    );
  }
}