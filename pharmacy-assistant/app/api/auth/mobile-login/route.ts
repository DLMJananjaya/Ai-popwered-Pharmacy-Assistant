import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { signMobileToken } from '@/lib/verifyMobileToken';

/**
 * POST /api/auth/mobile-login
 * Body: { email: string, password: string }
 *
 * Returns a long-lived JWT for the Android companion app.
 * The OTP grace-period is skipped for mobile clients — the 30-day token
 * expiry acts as the re-authentication mechanism.
 */
export async function POST(req: Request) {
  try {
    await dbConnect();

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // 1. Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    // 2. Check password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    // 3. Must be admin-approved
    if (!user.isAdminVerified) {
      return NextResponse.json(
        { error: 'Account pending admin approval. Please wait for verification.' },
        { status: 403 }
      );
    }

    // 4. Sign mobile JWT (30 days)
    const token = signMobileToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      pharmacyName: user.pharmacyName,
    });

    // 5. Update last login
    user.lastLoginAt = new Date();
    await user.save();

    return NextResponse.json({
      token,
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      pharmacyName: user.pharmacyName ?? null,
      role: user.role,
    });
  } catch (err: any) {
    console.error('mobile-login error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
