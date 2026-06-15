import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import InventoryItem from '@/models/InventoryItem';

// Helper: serialize Mongoose doc to plain object with id instead of _id
function serialize(doc: any) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id.toString(),
    name: obj.name,
    strength: obj.strength,
    qty: obj.qty,
    expireDate: obj.expireDate instanceof Date
      ? obj.expireDate.toISOString().split('T')[0]
      : obj.expireDate,
    unitPrice: obj.unitPrice,
  };
}

// GET /api/inventory — return all items for logged-in user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const items = await InventoryItem.find({ userId: session.user.id }).sort({ createdAt: -1 });
  return NextResponse.json(items.map(serialize));
}

// POST /api/inventory — add a new item
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const { name, strength, qty, expireDate, unitPrice } = await req.json();
  const item = await InventoryItem.create({
    userId: session.user.id,
    name, strength, qty, expireDate, unitPrice,
  });
  return NextResponse.json(serialize(item), { status: 201 });
}

// DELETE /api/inventory — remove an item by id
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const { id } = await req.json();
  await InventoryItem.findOneAndDelete({ _id: id, userId: session.user.id });
  return NextResponse.json({ message: 'Deleted' });
}

// PATCH /api/inventory — update qty for an item (used by billing on pay)
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const { id, qty } = await req.json();
  const item = await InventoryItem.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    { qty },
    { new: true }
  );
  if (!item) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  return NextResponse.json(serialize(item));
}
