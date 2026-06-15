import dbConnect from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// POST /api/admin/verify-user — (admin only)
// Body: { userId, action } where action = "approve" | "reject"
export async function POST(req) {
  try {
    // 🔒 Auth guard: only signed-in admins may call this route
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const { userId, action } = await req.json();

    if (!userId || !action) {
      return NextResponse.json({ message: "userId and action are required" }, { status: 400 });
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ message: "action must be 'approve' or 'reject'" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (action === "approve") {
      user.isAdminVerified = true;
    } else {
      // Reject: delete the user or mark as rejected
      await User.findByIdAndDelete(userId);
      return NextResponse.json({ message: "User rejected and removed." }, { status: 200 });
    }

    await user.save();

    return NextResponse.json(
      { message: `User ${action === "approve" ? "approved" : "rejected"} successfully.` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin verify-user error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
