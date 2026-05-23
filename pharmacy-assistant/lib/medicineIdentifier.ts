// lib/medicineIdentifier.ts
// Calls the local Flask medicine identifier API

const MEDICINE_API = process.env.MEDICINE_API_URL || "http://localhost:5000";

export interface MedicineResult {
  input: string;
  canonical: string | null;
  confidence: number;
  method: string;
  found: boolean;
  alternatives?: Array<{ canonical: string; score: number }>;
}

/**
 * Identify a single medicine name
 * Usage: const result = await identifyMedicine("PCM")
 */
export async function identifyMedicine(name: string): Promise<MedicineResult> {
  const res = await fetch(`${MEDICINE_API}/api/identify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    throw new Error(`Medicine API error: ${res.status}`);
  }

  return res.json();
}

/**
 * Identify multiple medicine names at once
 * Usage: const results = await identifyMedicines(["PCM", "brufen", "flagyl"])
 */
export async function identifyMedicines(
  names: string[]
): Promise<MedicineResult[]> {
  const res = await fetch(`${MEDICINE_API}/api/identify/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ names }),
  });

  if (!res.ok) {
    throw new Error(`Medicine API error: ${res.status}`);
  }

  const data = await res.json();
  return data.results;
}
