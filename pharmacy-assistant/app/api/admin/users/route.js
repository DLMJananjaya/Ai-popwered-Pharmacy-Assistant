import dbConnect from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/admin/users — List all users (admin only)
export async function GET(req) {
  try {
    // 🔒 Auth guard: only signed-in admins may access this route
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "pending"; // pending | all | verified

    let query = {};
    if (filter === "pending") {
      query = { isVerified: true, isAdminVerified: false };
    } else if (filter === "verified") {
      query = { isAdminVerified: true };
    }
    // filter === "all" returns everything

    const users = await User.find(query)
      .select("name email pharmacyName documentUrl isAdminVerified isVerified createdAt role")
      .sort({ createdAt: -1 });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error("Admin users list error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
