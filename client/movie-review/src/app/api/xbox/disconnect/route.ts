import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.error('Xbox disconnect: Not authenticated');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('Xbox disconnect: Attempting to delete connection for user:', session.user.id);

    const result = await prisma.platform_connections.deleteMany({
      where: {
        userId: session.user.id,
        platformType: 'xbox'
      }
    });

    console.log('Xbox disconnect: Deleted', result.count, 'connection(s)');

    if (result.count === 0) {
      console.warn('Xbox disconnect: No connection found to delete');
      // Still return success since the goal (no connection) is achieved
    }

    return NextResponse.json({ 
      success: true,
      deletedCount: result.count 
    });
  } catch (error: any) {
    console.error('Xbox disconnect error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to disconnect Xbox account',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

