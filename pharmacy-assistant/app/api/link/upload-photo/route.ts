import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import LinkSession from '@/models/LinkSession';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * POST /api/link/upload-photo
 * Phone sends a captured photo for AI processing.
 * The result is stored in the LinkSession for the desktop to pick up via SSE/polling.
 */
export async function POST(req: Request) {
  try {
    await dbConnect();

    const { sessionId, image, type, medicineName } = await req.json();

    if (!sessionId || !image) {
      return NextResponse.json({ error: 'sessionId and image are required' }, { status: 400 });
    }

    // Validate session
    const linkSession = await LinkSession.findOne({
      _id: sessionId,
      status: 'connected',
      expiresAt: { $gt: new Date() },
    });

    if (!linkSession) {
      return NextResponse.json(
        { error: 'Session expired or not connected. Please re-link your phone.' },
        { status: 403 }
      );
    }

    let result;

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: 'Invalid image format. Expected base64 data URL.' }, { status: 400 });
    }

    const mimeType = match[1];
    const base64Data = match[2];

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

    if (type === 'medicine') {
      // 1. Use Gemini to read the medicine name from the image
      const prompt = `Extract the exact medicine name and strength from this image of a medicine package or bottle. 
Return your response STRICTLY as a JSON object with this exact structure:
{
  "name": "The extracted medicine name",
  "strength": "The extracted strength (if any, e.g. '500mg')"
}`;
      
      const genResult = await model.generateContent([
        prompt,
        { inlineData: { mimeType, data: base64Data } },
      ]);
      
      const responseText = genResult.response.text();
      let extractedName = null;
      let extractedStrength = null;
      
      try {
        const cleaned = responseText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        const parsed = JSON.parse(cleaned);
        extractedName = parsed.name;
        extractedStrength = parsed.strength;
      } catch (e) {
        console.error("Gemini failed to parse medicine JSON:", e);
      }

      // 2. Query the Python medicine identifier
      const MEDICINE_API = process.env.MEDICINE_API_URL || 'http://localhost:5000';
      if (extractedName) {
        try {
          const res = await fetch(`${MEDICINE_API}/api/identify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: extractedName }),
          });
          const apiResult = await res.json();
          result = {
            medicines: [{
              name: apiResult.canonical || extractedName,
              strength: extractedStrength,
              notes: apiResult.found ? `Manufacturer: ${apiResult.manufacturers}` : 'Not found in local database'
            }]
          };
        } catch (e) {
          result = {
            medicines: [{ name: extractedName, strength: extractedStrength, notes: 'Failed to connect to medicine API' }]
          };
        }
      } else {
         result = { medicines: [], warnings: ['Could not read a medicine name from the image.'] };
      }
    } else {
      // Default: prescription reading via Gemini
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

      const genResult = await model.generateContent([
        prompt,
        { inlineData: { mimeType, data: base64Data } },
      ]);

      const responseText = genResult.response.text();

      try {
        const cleaned = responseText
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .trim();
        result = JSON.parse(cleaned);
      } catch {
        result = {
          medicines: [],
          rawText: responseText,
          usageInstructions: 'Could not parse structured data from AI response.',
          allergyWarnings: 'Please review the raw text below.',
          warnings: ['AI response was not in expected format. Raw text is shown below.'],
        };
      }
    }

    // Create a small thumbnail for preview (first 200 chars of base64)
    const imagePreview = image.substring(0, 200) + '...';

    // Store result in session
    linkSession.lastPhoto = {
      imagePreview,
      type: type || 'prescription',
      result,
      timestamp: new Date(),
    };
    await linkSession.save();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    return NextResponse.json({ error: 'Failed to process photo' }, { status: 500 });
  }
}
