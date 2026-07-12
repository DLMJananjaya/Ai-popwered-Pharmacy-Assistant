import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import InventoryItem from '@/models/InventoryItem';
import { verifyMobileToken } from '@/lib/verifyMobileToken';
import fs from 'fs';
import path from 'path';

/** Resolves userId from either a NextAuth session or a mobile Bearer token. */
async function resolveUserId(req: Request): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) return session.user.id as string;
  const payload = verifyMobileToken(req.headers.get('authorization'));
  return payload?.userId ?? null;
}

// ─── CSV alias map (cached in-memory) ────────────────────────────────────────
// Maps canonical name → Set of known aliases/brand names
let aliasCache: Map<string, Set<string>> | null = null;

function loadAliasMap(): Map<string, Set<string>> {
  if (aliasCache) return aliasCache;

  const csvPath = path.join(process.cwd(), 'medicines_dataset.csv');
  const raw = fs.readFileSync(csvPath, 'utf-8');
  const lines = raw.split('\n').filter(Boolean);

  const map = new Map<string, Set<string>>();

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    // Parse CSV line (handles quoted fields with commas)
    const match = lines[i].match(/^([^,]+),"([^"]*)",.*/);
    if (!match) continue;

    const canonical = match[1].trim().toLowerCase();
    const aliasesRaw = match[2];
    const aliases = aliasesRaw
      .split(',')
      .map((a) => a.trim().toLowerCase())
      .filter(Boolean);

    const set = new Set<string>();
    set.add(canonical);
    aliases.forEach((a) => set.add(a));
    map.set(canonical, set);
  }

  aliasCache = map;
  return map;
}

// ─── Matching utilities ──────────────────────────────────────────────────────

/** Normalize a string for comparison: lowercase, strip non-alphanumeric. */
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

/** Simple token-based similarity (Jaccard-like on word tokens). */
function tokenSimilarity(a: string, b: string): number {
  const tokA = new Set(norm(a).split(' '));
  const tokB = new Set(norm(b).split(' '));
  if (tokA.size === 0 || tokB.size === 0) return 0;
  let intersection = 0;
  tokA.forEach((t) => { if (tokB.has(t)) intersection++; });
  const union = new Set([...tokA, ...tokB]).size;
  return intersection / union;
}

/**
 * Levenshtein-based similarity (normalized 0–1).
 * Efficient for short strings like medicine names.
 */
function levenshteinSimilarity(a: string, b: string): number {
  const s = norm(a);
  const t = norm(b);
  if (s === t) return 1;
  const m = s.length;
  const n = t.length;
  if (m === 0 || n === 0) return 0;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = s[i - 1] === t[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return 1 - dp[m][n] / Math.max(m, n);
}

/** Check if one string contains the other (after normalization). */
function containsMatch(a: string, b: string): boolean {
  const na = norm(a);
  const nb = norm(b);
  return na.includes(nb) || nb.includes(na);
}

// ─── Types ───────────────────────────────────────────────────────────────────

type MatchedInventoryItem = {
  inventoryId: string;
  name: string;
  strength: string;
  qty: number;
  unitPrice: number;
  matchConfidence: number;
  matchMethod: 'alias' | 'fuzzy' | 'containment';
};

type MedicineInput = {
  canonical: string | null;
  input: string;
  alternatives?: Array<{ canonical: string; score: number }>;
};

// ─── POST /api/inventory/match ───────────────────────────────────────────────

export async function POST(req: Request) {
  const userId = await resolveUserId(req);
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { medicines } = await req.json() as { medicines: MedicineInput[] };
  if (!medicines || !Array.isArray(medicines)) {
    return NextResponse.json({ error: "Missing 'medicines' array" }, { status: 400 });
  }

  await dbConnect();

  // Fetch user's inventory
  const inventoryDocs = await InventoryItem.find({ userId });
  const inventory = inventoryDocs.map((doc: any) => {
    const obj = doc.toObject ? doc.toObject() : doc;
    return {
      id: obj._id.toString(),
      name: obj.name as string,
      strength: (obj.strength || '') as string,
      qty: obj.qty as number,
      unitPrice: obj.unitPrice as number,
    };
  });

  // Load alias map from CSV
  const aliasMap = loadAliasMap();

  // For each medicine, find best inventory match
  const results: (MatchedInventoryItem | null)[] = medicines.map((med) => {
    if (!med.canonical && !med.input) return null;

    let bestMatch: MatchedInventoryItem | null = null;
    let bestScore = 0;

    for (const inv of inventory) {
      if (inv.qty <= 0) continue; // skip out-of-stock

      const invNorm = norm(inv.name);

      // ── Strategy 1: Alias-based match ──────────────────────────────────
      // Check if the inventory item name matches any known alias for the canonical medicine
      if (med.canonical) {
        const canonicalKey = med.canonical.toLowerCase().trim();
        const aliases = aliasMap.get(canonicalKey);

        if (aliases) {
          // Check if inventory name (or its base) is one of the aliases
          for (const alias of aliases) {
            if (invNorm === alias || invNorm.startsWith(alias + ' ') || invNorm.includes(alias)) {
              const score = invNorm === alias ? 0.98 : 0.90;
              if (score > bestScore) {
                bestScore = score;
                bestMatch = {
                  inventoryId: inv.id,
                  name: inv.name,
                  strength: inv.strength,
                  qty: inv.qty,
                  unitPrice: inv.unitPrice,
                  matchConfidence: score,
                  matchMethod: 'alias',
                };
              }
            }
          }
        }

        // Also check the reverse: if the canonical name itself appears in the inventory name
        if (containsMatch(inv.name, med.canonical) && bestScore < 0.85) {
          bestScore = 0.85;
          bestMatch = {
            inventoryId: inv.id,
            name: inv.name,
            strength: inv.strength,
            qty: inv.qty,
            unitPrice: inv.unitPrice,
            matchConfidence: 0.85,
            matchMethod: 'containment',
          };
        }
      }

      // ── Strategy 2: Input-based containment match ──────────────────────
      if (med.input && containsMatch(inv.name, med.input) && bestScore < 0.80) {
        bestScore = 0.80;
        bestMatch = {
          inventoryId: inv.id,
          name: inv.name,
          strength: inv.strength,
          qty: inv.qty,
          unitPrice: inv.unitPrice,
          matchConfidence: 0.80,
          matchMethod: 'containment',
        };
      }

      // ── Strategy 3: Fuzzy string matching ──────────────────────────────
      // Compare both canonical and input against inventory name
      const candidates = [med.canonical, med.input].filter(Boolean) as string[];
      for (const candidate of candidates) {
        const levScore = levenshteinSimilarity(candidate, inv.name);
        const tokScore = tokenSimilarity(candidate, inv.name);
        const combinedScore = Math.max(levScore, tokScore);

        if (combinedScore > 0.65 && combinedScore > bestScore) {
          bestScore = combinedScore;
          bestMatch = {
            inventoryId: inv.id,
            name: inv.name,
            strength: inv.strength,
            qty: inv.qty,
            unitPrice: inv.unitPrice,
            matchConfidence: Math.round(combinedScore * 100) / 100,
            matchMethod: 'fuzzy',
          };
        }
      }

      // ── Strategy 4: Check against alternatives ─────────────────────────
      if (med.alternatives && med.alternatives.length > 0) {
        for (const alt of med.alternatives) {
          const altCanonical = alt.canonical?.toLowerCase().trim();
          if (!altCanonical) continue;

          const altAliases = aliasMap.get(altCanonical);
          if (altAliases) {
            for (const alias of altAliases) {
              if (invNorm === alias || invNorm.includes(alias)) {
                const score = (invNorm === alias ? 0.85 : 0.75) * (alt.score || 0.7);
                if (score > bestScore) {
                  bestScore = score;
                  bestMatch = {
                    inventoryId: inv.id,
                    name: inv.name,
                    strength: inv.strength,
                    qty: inv.qty,
                    unitPrice: inv.unitPrice,
                    matchConfidence: Math.round(score * 100) / 100,
                    matchMethod: 'alias',
                  };
                }
              }
            }
          }
        }
      }
    }

    return bestMatch;
  });

  return NextResponse.json({ matches: results });
}
