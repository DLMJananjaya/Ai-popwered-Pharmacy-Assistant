// lib/medicineIdentifier.ts
// Calls the local Flask medicine identifier API

const MEDICINE_API = process.env.MEDICINE_API_URL || "http://localhost:5000";

export interface MedicineResult {
  input: string;
  canonical: string | null;
  confidence: number;
  method: "exact" | "fuzzy" | "semantic" | "no_match" | "empty";
  found: boolean;
  manufacturers: string;
  unitPrice?: number;
  alternatives?: Array<{ canonical: string; score: number }>;
}

/**
 * Identify a single medicine name
 * Returns canonical name + manufacturer info
 */
export async function identifyMedicine(name: string): Promise<MedicineResult> {
  const res = await fetch(`${MEDICINE_API}/api/identify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(`Medicine API error: ${res.status}`);
  return res.json();
}

/**
 * Identify multiple medicine names at once
 */
export async function identifyMedicines(names: string[]): Promise<MedicineResult[]> {
  const res = await fetch(`${MEDICINE_API}/api/identify/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ names }),
  });
  if (!res.ok) throw new Error(`Medicine API error: ${res.status}`);
  const data = await res.json();
  return data.results;
}
