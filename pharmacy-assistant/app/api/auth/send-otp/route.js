import dbConnect from "@/lib/db";
import User from "@/models/User";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await dbConnect();
    const { email } = await req.json();

    // 1. Generate OTP and 10-minute Expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60000);

    // 2. Save to User Record
    const user = await User.findOneAndUpdate(
      { email },
      { otp, otpExpiry },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // 3. Setup Nodemailer Transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Your 16-char App Password
      },
    });

    // 4. Send the Email
    await transporter.sendMail({
      from: '"Vaidya Assistant" <no-reply@vaidya.com>',
      to: email,
      subject: "Your Login Security Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #00A99D; text-align: center;">Vaidya Login OTP</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>You are attempting to log in. Please use the following code to verify your identity:</p>
          <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 30px; font-weight: bold; letter-spacing: 10px; border-radius: 5px; color: #333;">
            ${otp}
          </div>
          <p style="color: #ef4444; font-size: 13px;">This code will expire in 10 minutes.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 11px; color: #999;">If you did not request this code, please secure your account immediately.</p>
        </div>
      `,
    });

    return NextResponse.json({ message: "OTP Sent" });
  } catch (error) {
    console.error("Nodemailer Error:", error);
    return NextResponse.json({ message: "Failed to send OTP" }, { status: 500 });
  }
}