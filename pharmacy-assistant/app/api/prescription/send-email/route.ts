import { sendPrescriptionEmail } from "@/lib/mailer";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, patientName, medicines, pdfBase64 } = await req.json();

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "Missing 'email' field" },
        { status: 400 }
      );
    }

    if (!medicines && !pdfBase64) {
      return NextResponse.json(
        { error: "Missing 'medicines' or 'pdfBase64' field" },
        { status: 400 }
      );
    }

    const success = await sendPrescriptionEmail(email.trim(), patientName || null, medicines, pdfBase64);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error("Send prescription email error:", error);
    return NextResponse.json(
      { error: "Failed to send prescription email" },
      { status: 500 }
    );
  }
}