import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import User from "@/models/User";

// GET /api/user/avatar — returns the current user's avatar URL
export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(session.user.id).select("image");
    if (!user) {
        return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ image: user.image });
}

// PATCH /api/user/avatar — updates the current user's avatar URL
export async function PATCH(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { image } = await request.json();
    if (!image || typeof image !== "string") {
        return Response.json({ error: "Invalid image URL" }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findByIdAndUpdate(
        session.user.id,
        { image },
        { new: true, select: "image" }
    );

    if (!user) {
        return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ image: user.image });
}
