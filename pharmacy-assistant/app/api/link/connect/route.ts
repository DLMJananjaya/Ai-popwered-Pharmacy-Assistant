import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import LinkSession from '@/models/LinkSession';

/**
 * POST /api/link/connect
 * Phone connects to an existing pairing session using the code.
 */
export async function POST(req: Request) {
  try {
    await dbConnect();

    const { code, userAgent } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Pairing code is required' }, { status: 400 });
    }

    const linkSession = await LinkSession.findOneAndUpdate(
      {
        pairingCode: code.toUpperCase().trim(),
        status: { $in: ['waiting', 'connected'] },
        expiresAt: { $gt: new Date() },
      },
      {
        $set: {
          status: 'connected',
          phoneUserAgent: userAgent || null,
        },
      },
      { new: true }
    );

    if (!linkSession) {
      return NextResponse.json(
        { error: 'Invalid or expired pairing code. Please generate a new one on the desktop.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sessionId: linkSession._id.toString(),
      status: 'connected',
    });
  } catch (error) {
    console.error('Link connect error:', error);
    return NextResponse.json({ error: 'Failed to connect' }, { status: 500 });
  }
}
