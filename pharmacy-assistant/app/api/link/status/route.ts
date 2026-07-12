import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import LinkSession from '@/models/LinkSession';

/**
 * GET /api/link/status?sessionId=...
 * Polling fallback for checking session status and latest results.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    await dbConnect();

    const linkSession = await LinkSession.findOne({
      _id: sessionId,
      userId: session.user.id,
    }).lean();

    if (!linkSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      sessionId: linkSession._id.toString(),
      status: linkSession.status,
      pairingCode: linkSession.pairingCode,
      phoneUserAgent: linkSession.phoneUserAgent,
      lastPhoto: linkSession.lastPhoto || null,
      expiresAt: linkSession.expiresAt,
    });
  } catch (error) {
    console.error('Link status error:', error);
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}
