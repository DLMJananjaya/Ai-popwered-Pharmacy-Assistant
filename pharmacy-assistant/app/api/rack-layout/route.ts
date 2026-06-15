import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import RackLayout from '@/models/RackLayout';

// GET /api/rack-layout — load saved canvas for logged-in user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const layout = await RackLayout.findOne({ userId: session.user.id });
  // Return the elements array (empty array if no layout saved yet)
  return NextResponse.json(layout?.elements ?? []);
}

// POST /api/rack-layout — save (upsert) full canvas for logged-in user
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const { elements } = await req.json();

  const layout = await RackLayout.findOneAndUpdate(
    { userId: session.user.id },
    { $set: { elements } },
    { upsert: true, new: true, returnDocument: 'after' }
  );

  return NextResponse.json({ message: 'Layout saved', elementCount: layout.elements?.length ?? 0 });
}
