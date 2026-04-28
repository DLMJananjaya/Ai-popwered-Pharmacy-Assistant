import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';

export async function GET() {
  try {
    // This is the moment of truth!
    await dbConnect();

    return NextResponse.json({
      status: "Success",
      message: "Database connected! Your pharmacy app is ready to go."
    });
  } catch (error) {
    return NextResponse.json({
      status: "Error",
      message: "Connected to API, but failed to connect to MongoDB.",
      details: error.message
    }, { status: 500 });
  }
}