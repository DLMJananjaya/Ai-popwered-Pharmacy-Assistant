import dbConnect from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// PATCH /api/user/update-document
// Links an uploaded document URL to the calling user's record after OTP verification.
// The user must be signed in and can only update their own document.
export async function PATCH(req) {
  try {
    // 🔒 Auth guard: user must be signed in
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { email, documentUrl } = await req.json();

    if (!email || !documentUrl) {
      return NextResponse.json({ message: "email and documentUrl are required" }, { status: 400 });
    }

    // 🔒 Users can only update their own document
    if (session.user.email !== email) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { documentUrl },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Document linked successfully" }, { status: 200 });
  } catch (error) {
    console.error("update-document error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
