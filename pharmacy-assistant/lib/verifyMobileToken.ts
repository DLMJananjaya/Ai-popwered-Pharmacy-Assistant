import jwt from 'jsonwebtoken';

const MOBILE_JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret';

export interface MobileTokenPayload {
  userId: string;
  email: string;
  role: string;
  pharmacyName?: string;
  name: string;
}

/**
 * Verifies an Authorization: Bearer <token> header value.
 * Returns the decoded payload or null if invalid / missing.
 */
export function verifyMobileToken(authHeader: string | null): MobileTokenPayload | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, MOBILE_JWT_SECRET) as MobileTokenPayload;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Signs and returns a mobile JWT for the given user.
 * Expires in 30 days.
 */
export function signMobileToken(payload: MobileTokenPayload): string {
  return jwt.sign(payload, MOBILE_JWT_SECRET, { expiresIn: '30d' });
}
