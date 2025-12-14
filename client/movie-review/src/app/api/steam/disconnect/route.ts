import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

async function disconnectSteam() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Delete the Steam connection
    const result = await prisma.platform_connections.deleteMany({
      where: {
        userId: session.user.id,
        platformType: 'steam'
      }
    });

    return NextResponse.json({ success: true, deletedCount: result.count });
  } catch (error) {
    console.error('Steam disconnect error:', error);

    const details = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to disconnect Steam account',
        details,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  return disconnectSteam();
}

// Some environments/proxies block DELETE from browsers; allow POST as a fallback.
export async function POST(request: NextRequest) {
  return disconnectSteam();
}