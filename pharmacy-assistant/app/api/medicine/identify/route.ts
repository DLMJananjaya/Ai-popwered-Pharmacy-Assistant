import { identifyMedicine } from "@/lib/medicineIdentifier";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name } = await req.json();

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Missing 'name' field" },
        { status: 400 }
      );
    }

    const result = await identifyMedicine(name.trim());
    return NextResponse.json(result);
  } catch (error) {
    console.error("Medicine identify error:", error);
    return NextResponse.json(
      { error: "Failed to identify medicine" },
      { status: 500 }
    );
  }
}
