import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import dbConnect from "@/lib/db";
import User from "@/models/User";

// POST /api/auth/upload-signup-doc
// Used during the signup flow (before the user is logged in).
// Validates that the email belongs to an OTP-verified but not-yet-admin-approved user,
// then saves the file and links the URL to their record.
export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("document");
    const email = formData.get("email");

    if (!email || typeof email !== "string") {
      return NextResponse.json({ message: "email is required" }, { status: 400 });
    }

    if (!file || typeof file === "string") {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }

    // 🔒 Gate: email must belong to a verified-but-not-yet-admin-approved user
    await dbConnect();
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.isVerified) {
      return NextResponse.json(
        { message: "Email must complete OTP verification before uploading a document." },
        { status: 403 }
      );
    }
    if (user.isAdminVerified) {
      return NextResponse.json(
        { message: "Account already approved. Please log in." },
        { status: 400 }
      );
    }

    // Validate file type (PDF, JPG, PNG only)
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "Invalid file type. Please upload a PDF, JPG, or PNG." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ message: "File too large. Max size is 5MB." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads", "documents");
    await mkdir(uploadDir, { recursive: true });

    // Create a unique filename
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${timestamp}_${safeName}`;
    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, buffer);

    // Link the document URL directly on the user record
    const publicUrl = `/uploads/documents/${filename}`;
    user.documentUrl = publicUrl;
    await user.save();

    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (error) {
    console.error("Signup doc upload error:", error);
    return NextResponse.json({ message: "Upload failed" }, { status: 500 });
  }
}
