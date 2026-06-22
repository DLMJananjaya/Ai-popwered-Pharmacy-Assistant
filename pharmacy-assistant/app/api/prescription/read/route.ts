import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: Request) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const { image } = await req.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Missing 'image' field (base64 data URL)" },
        { status: 400 }
      );
    }

    // Extract base64 data and mime type from data URL
    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json(
        { error: "Invalid image format. Expected base64 data URL." },
        { status: 400 }
      );
    }

    const mimeType = match[1];
    const base64Data = match[2];

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

    const prompt = `You are a pharmacy assistant AI. Analyze this prescription image and extract all information.

Return your response STRICTLY as a JSON object with this exact structure (no markdown, no code fences, just pure JSON):

{
  "medicines": [
    {
      "name": "Medicine name",
      "strength": "Dosage strength (e.g., 500mg) or null",
      "frequency": "How often to take (e.g., twice daily, BD) or null",
      "timing": "When to take (e.g., after meals, before bed) or null",
      "notes": "Any additional notes or null"
    }
  ],
  "patientName": "Patient name if visible, or null",
  "doctorName": "Doctor name if visible, or null",
  "date": "Prescription date if visible, or null",
  "diagnosis": "Diagnosis if mentioned, or null",
  "usageInstructions": "General usage instructions from the prescription",
  "allergyWarnings": "Any allergy warnings mentioned, or general allergy advice for the medicines",
  "warnings": ["Array of important warnings or precautions"],
  "rawText": "The complete text as read from the prescription"
}

Be thorough — extract every medicine mentioned. If handwriting is unclear, make your best interpretation and note uncertainty. For each medicine, try to identify the generic name and strength.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      },
    ]);

    const responseText = result.response.text();

    // Try to parse as JSON — Gemini might wrap it in markdown code fences
    let parsed;
    try {
      const cleaned = responseText
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        medicines: [],
        rawText: responseText,
        usageInstructions: "Could not parse structured data from AI response.",
        allergyWarnings: "Please review the raw text below.",
        warnings: [
          "AI response was not in expected format. Raw text is shown below.",
        ],
      };
    }

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (error: unknown) {
    console.error("Gemini prescription read error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to read prescription";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
