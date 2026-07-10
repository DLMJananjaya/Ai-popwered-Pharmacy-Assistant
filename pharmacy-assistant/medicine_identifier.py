"""
Medicine Name Identifier
========================
Identifies canonical medicine names from aliases, brand names,
short names, and doctor slang using fuzzy + embedding matching.

Requirements:
    pip install pandas rapidfuzz sentence-transformers scikit-learn numpy
"""

import csv
import json
import pickle
import re
import os
import numpy as np
import pandas as pd
from rapidfuzz import fuzz, process
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from side_effects_lookup import get_side_effects


# ─────────────────────────────────────────────
# 1. DATA LOADER
# ─────────────────────────────────────────────

def load_dataset(csv_path: str):
    """
    Loads the CSV and builds:
      alias_map:        alias (lowercase) -> canonical name
      manufacturer_map: canonical name   -> manufacturer string
      price_map:        canonical name   -> unit price (LKR float)
      canonical_list:   list of all canonical names
    """
    alias_map = {}
    manufacturer_map = {}
    price_map = {}
    canonical_list = []

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            canonical = row["canonical_name"].strip().lower()
            if canonical in canonical_list:
                # merge aliases if duplicate canonical
                pass
            else:
                canonical_list.append(canonical)

            manufacturers = row.get("manufacturers", "").strip()
            manufacturer_map[canonical] = manufacturers

            # Parse unit price (LKR) if present
            try:
                price_map[canonical] = float(row.get("unitPrice", "0") or "0")
            except (ValueError, TypeError):
                price_map[canonical] = 0.0

            # Add canonical itself
            alias_map[canonical] = canonical

            # Add all aliases
            for alias in row["aliases"].split(","):
                alias = alias.strip().lower()
                if alias:
                    alias_map[alias] = canonical

    print(f"[OK] Loaded {len(canonical_list)} medicines, {len(alias_map)} total aliases")
    return alias_map, canonical_list, manufacturer_map, price_map


# ─────────────────────────────────────────────
# 2. TEXT NORMALIZER
# ─────────────────────────────────────────────

def normalize(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s\-]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text


# ─────────────────────────────────────────────
# 3. EMBEDDING MODEL
# ─────────────────────────────────────────────

class MedicineEmbeddingIndex:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        print("[*] Loading embedding model (first run downloads ~80MB)...")
        self.model = SentenceTransformer(model_name)
        self.alias_list = []
        self.alias_to_canonical = {}
        self.embeddings = None

    def build(self, alias_map: dict):
        self.alias_to_canonical = alias_map
        self.alias_list = list(alias_map.keys())
        print(f"[*] Encoding {len(self.alias_list)} aliases...")
        self.embeddings = self.model.encode(
            self.alias_list, batch_size=64,
            show_progress_bar=True, normalize_embeddings=True
        )
        print("[OK] Embedding index built!")

    def save(self, path: str = "medicine_index.pkl"):
        with open(path, "wb") as f:
            pickle.dump({
                "alias_list": self.alias_list,
                "alias_to_canonical": self.alias_to_canonical,
                "embeddings": self.embeddings
            }, f)
        print(f"[SAVE] Index saved to {path}")

    def load(self, path: str = "medicine_index.pkl"):
        with open(path, "rb") as f:
            data = pickle.load(f)
        self.alias_list = data["alias_list"]
        self.alias_to_canonical = data["alias_to_canonical"]
        self.embeddings = data["embeddings"]
        print(f"[OK] Index loaded from {path} ({len(self.alias_list)} aliases)")

    def search(self, query: str, top_k: int = 3) -> list:
        query_embedding = self.model.encode([query], normalize_embeddings=True)
        scores = cosine_similarity(query_embedding, self.embeddings)[0]
        top_indices = np.argsort(scores)[::-1][:top_k]
        results = []
        for idx in top_indices:
            alias = self.alias_list[idx]
            canonical = self.alias_to_canonical[alias]
            results.append({
                "alias": alias,
                "canonical": canonical,
                "score": float(scores[idx])
            })
        return results


# ─────────────────────────────────────────────
# 4. MAIN IDENTIFIER CLASS
# ─────────────────────────────────────────────

class MedicineIdentifier:
    def __init__(self, csv_path: str, index_path: str = "medicine_index.pkl"):
        self.alias_map, self.canonical_list, self.manufacturer_map, self.price_map = load_dataset(csv_path)
        self.index = MedicineEmbeddingIndex()

        # Always rebuild index if CSV is newer than pkl
        rebuild = True
        if os.path.exists(index_path):
            if os.path.getmtime(csv_path) <= os.path.getmtime(index_path):
                rebuild = False

        if rebuild:
            print("[*] Rebuilding index (dataset updated)...")
            self.index.build(self.alias_map)
            self.index.save(index_path)
        else:
            self.index.load(index_path)

    def identify(self, input_name: str, verbose: bool = False) -> dict:
        raw = input_name
        query = normalize(input_name)

        if not query:
            return {"input": raw, "canonical": None, "confidence": 0.0,
                    "method": "empty", "manufacturers": None, "alternatives": []}

        # ── Stage 1: Exact match ──────────────────────────
        if query in self.alias_map:
            canonical = self.alias_map[query]
            return {
                "input": raw,
                "canonical": canonical,
                "confidence": 1.0,
                "method": "exact",
                "manufacturers": self.manufacturer_map.get(canonical, ""),
                "unitPrice": self.price_map.get(canonical, 0.0),
                "alternatives": []
            }

        # ── Stage 2: Fuzzy string match ───────────────────
        all_aliases = list(self.alias_map.keys())
        fuzzy_results = process.extract(query, all_aliases, scorer=fuzz.WRatio, limit=5)

        if fuzzy_results and fuzzy_results[0][1] >= 80:
            best_alias, score, _ = fuzzy_results[0]
            canonical = self.alias_map[best_alias]
            alternatives = [
                {"alias": a, "canonical": self.alias_map[a], "score": s / 100}
                for a, s, _ in fuzzy_results[1:]
                if self.alias_map[a] != canonical
            ]
            if verbose:
                print(f"  [fuzzy] '{query}' → '{best_alias}' → '{canonical}' ({score})")
            return {
                "input": raw,
                "canonical": canonical,
                "confidence": round(score / 100, 2),
                "method": "fuzzy",
                "manufacturers": self.manufacturer_map.get(canonical, ""),
                "unitPrice": self.price_map.get(canonical, 0.0),
                "alternatives": alternatives[:2]
            }

        # ── Stage 3: Semantic embedding search ───────────
        semantic_results = self.index.search(query, top_k=3)
        best = semantic_results[0]

        if best["score"] >= 0.60:
            canonical = best["canonical"]
            if verbose:
                print(f"  [semantic] '{query}' → '{canonical}' ({best['score']:.2f})")
            return {
                "input": raw,
                "canonical": canonical,
                "confidence": round(best["score"], 2),
                "method": "semantic",
                "manufacturers": self.manufacturer_map.get(canonical, ""),
                "unitPrice": self.price_map.get(canonical, 0.0),
                "alternatives": semantic_results[1:]
            }

        return {
            "input": raw,
            "canonical": None,
            "confidence": 0.0,
            "method": "no_match",
            "manufacturers": None,
            "unitPrice": 0.0,
            "alternatives": semantic_results
        }

    def batch_identify(self, names: list) -> pd.DataFrame:
        results = [self.identify(name) for name in names]
        return pd.DataFrame(results)


# ─────────────────────────────────────────────
# 5. EVALUATION
# ─────────────────────────────────────────────

def evaluate(identifier, test_cases: list) -> None:
    correct = 0
    total = len(test_cases)
    print("\n" + "="*70)
    print(f"{'INPUT':<20} {'EXPECTED':<25} {'GOT':<25} {'OK?'}")
    print("="*70)
    for input_name, expected in test_cases:
        result = identifier.identify(input_name)
        got = result["canonical"]
        ok = "[OK]" if got == expected else "❌"
        if got == expected:
            correct += 1
        print(f"{input_name:<20} {expected:<25} {str(got):<25} {ok}")
    print("="*70)
    print(f"Accuracy: {correct}/{total} = {correct/total*100:.1f}%\n")


# ─────────────────────────────────────────────
# 6. MAIN
# ─────────────────────────────────────────────

if __name__ == "__main__":
    CSV_PATH = "medicines_dataset.csv"

    print("\n[PHARMACY] Medicine Identifier - Training & Testing")
    print("=" * 50)

    identifier = MedicineIdentifier(CSV_PATH)

    print("\n📋 Demo Queries (with manufacturers):")
    demo_queries = [
        "PCM", "panadol", "paracitamol",
        "brufen", "Zithromax", "glucophage",
        "flagyl", "ventolin", "ORS",
        "norvasc", "lipitor", "augmentin",
        "zofran", "januvia", "xarelto",
        "prozac", "zoloft", "zyprexa",
        "unknowndrugxyz",
    ]

    for q in demo_queries:
        r = identifier.identify(q)
        status = f"→ {r['canonical']}" if r['canonical'] else "→ NOT FOUND"
        mfr = f"  [{r['manufacturers'][:50]}]" if r['manufacturers'] else ""
        print(f"  {q:<25} {status}  [{r['method']}, {r['confidence']}]{mfr}")

    test_cases = [
        ("PCM",          "paracetamol"),
        ("panadol",      "paracetamol"),
        ("paracitamol",  "paracetamol"),
        ("brufen",       "ibuprofen"),
        ("advil",        "ibuprofen"),
        ("augmentin",    "amoxicillin clavulanate"),
        ("zithromax",    "azithromycin"),
        ("glucophage",   "metformin"),
        ("flagyl",       "metronidazole"),
        ("ventolin",     "salbutamol"),
        ("lasix",        "furosemide"),
        ("lipitor",      "atorvastatin"),
        ("ORS",          "oral rehydration salts"),
        ("plavix",       "clopidogrel"),
        ("lantus",       "insulin glargine"),
        ("norvasc",      "amlodipine"),
        ("zofran",       "ondansetron"),
        ("prozac",       "fluoxetine"),
        ("xarelto",      "rivaroxaban"),
        ("januvia",      "sitagliptin"),
    ]

    evaluate(identifier, test_cases)