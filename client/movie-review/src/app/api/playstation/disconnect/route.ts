import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await prisma.platform_connections.deleteMany({
      where: {
        userId: session.user.id,
        platformType: 'playstation'
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PlayStation disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect PlayStation account' },
      { status: 500 }
    );
  }
}
