import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import BillingRecord from '@/models/BillingRecord';

// GET /api/billing — return recent billing records for logged-in user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const records = await BillingRecord.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return NextResponse.json(
    records.map((r: any) => ({
      id: r._id.toString(),
      items: r.items,
      total: r.total,
      discount: r.discount,
      amountPayable: r.amountPayable,
      paymentMethod: r.paymentMethod,
      createdAt: r.createdAt,
    }))
  );
}

// POST /api/billing — save a completed billing record
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const { items, total, discount, amountPayable, paymentMethod } = await req.json();

  const record = await BillingRecord.create({
    userId: session.user.id,
    items,
    total,
    discount,
    amountPayable,
    paymentMethod,
  });

  return NextResponse.json({ id: record._id.toString() }, { status: 201 });
}
