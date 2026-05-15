import dbConnect from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";

// PATCH /api/user/update-document
// Links an uploaded document URL to the user record after OTP verification
export async function PATCH(req) {
  try {
    await dbConnect();
    const { email, documentUrl } = await req.json();

    if (!email || !documentUrl) {
      return NextResponse.json({ message: "email and documentUrl are required" }, { status: 400 });
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
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}
