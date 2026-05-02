import dbConnect from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await dbConnect();
    const { email, otp } = await req.json();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ message: "User is already verified." }, { status: 400 });
    }

    if (user.otp !== otp.trim()) {
      return NextResponse.json({ message: "Invalid OTP." }, { status: 400 });
    }

    if (new Date() > new Date(user.otpExpiry)) {
      return NextResponse.json({ message: "OTP has expired. Please sign up again." }, { status: 400 });
    }

    // Mark as verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.lastLoginAt = new Date(); // Start the 1-hour grace period now
    await user.save();

    return NextResponse.json({ message: "Account verified successfully." }, { status: 200 });
  } catch (error) {
    console.error("Verify signup error:", error);
    return NextResponse.json({ message: "Error occurred", error: error.message }, { status: 500 });
  }
}
