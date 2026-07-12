import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import LinkSession from '@/models/LinkSession';

/**
 * POST /api/link/create-session
 * Desktop creates a new pairing session. Returns a pairingCode for QR display.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Expire any previous waiting/connected sessions for this user
    await LinkSession.updateMany(
      { userId: session.user.id, status: { $in: ['waiting', 'connected'] } },
      { $set: { status: 'expired' } }
    );

    // Generate a random 6-char alphanumeric pairing code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 to avoid confusion
    let pairingCode = '';
    for (let i = 0; i < 6; i++) {
      pairingCode += chars[Math.floor(Math.random() * chars.length)];
    }

    // Create the session (expires in 8 hours)
    const linkSession = await LinkSession.create({
      userId: session.user.id,
      pairingCode,
      status: 'waiting',
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
    });

    return NextResponse.json({
      sessionId: linkSession._id.toString(),
      pairingCode,
    });
  } catch (error) {
    console.error('Create link session error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
