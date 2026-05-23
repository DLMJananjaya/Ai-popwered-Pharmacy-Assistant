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


# ─────────────────────────────────────────────
# 1. DATA LOADER
# ─────────────────────────────────────────────

def load_dataset(csv_path: str) -> dict:
    """
    Loads the CSV and builds a flat lookup:
      alias (lowercase) -> canonical name
    """
    alias_map = {}   # alias -> canonical
    canonical_list = []

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            canonical = row["canonical_name"].strip().lower()
            canonical_list.append(canonical)
            # Add canonical itself
            alias_map[canonical] = canonical
            # Add all aliases
            for alias in row["aliases"].split(","):
                alias = alias.strip().lower()
                if alias:
                    alias_map[alias] = canonical

    print(f"✅ Loaded {len(canonical_list)} medicines, {len(alias_map)} total aliases")
    return alias_map, canonical_list


# ─────────────────────────────────────────────
# 2. TEXT NORMALIZER
# ─────────────────────────────────────────────

def normalize(text: str) -> str:
    """Clean and normalize input text."""
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s\-]", "", text)  # remove special chars
    text = re.sub(r"\s+", " ", text)             # collapse spaces
    return text


# ─────────────────────────────────────────────
# 3. EMBEDDING MODEL (Semantic Matching)
# ─────────────────────────────────────────────

class MedicineEmbeddingIndex:
    """
    Builds a semantic vector index from all known aliases.
    Used for fuzzy semantic search when exact/fuzzy match fails.
    """

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        print("🔄 Loading embedding model (first run downloads ~80MB)...")
        self.model = SentenceTransformer(model_name)
        self.alias_list = []
        self.alias_to_canonical = {}
        self.embeddings = None

    def build(self, alias_map: dict):
        """Build embeddings for all aliases."""
        self.alias_to_canonical = alias_map
        self.alias_list = list(alias_map.keys())
        print(f"🔄 Encoding {len(self.alias_list)} aliases...")
        self.embeddings = self.model.encode(
            self.alias_list,
            batch_size=64,
            show_progress_bar=True,
            normalize_embeddings=True
        )
        print("✅ Embedding index built!")

    def save(self, path: str = "medicine_index.pkl"):
        with open(path, "wb") as f:
            pickle.dump({
                "alias_list": self.alias_list,
                "alias_to_canonical": self.alias_to_canonical,
                "embeddings": self.embeddings
            }, f)
        print(f"💾 Index saved to {path}")

    def load(self, path: str = "medicine_index.pkl"):
        with open(path, "rb") as f:
            data = pickle.load(f)
        self.alias_list = data["alias_list"]
        self.alias_to_canonical = data["alias_to_canonical"]
        self.embeddings = data["embeddings"]
        print(f"✅ Index loaded from {path} ({len(self.alias_list)} aliases)")

    def search(self, query: str, top_k: int = 3) -> list:
        """Find top-k most similar aliases by semantic similarity."""
        query_embedding = self.model.encode(
            [query], normalize_embeddings=True
        )
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
    """
    Three-stage matching pipeline:
      Stage 1: Exact lookup (instant)
      Stage 2: Fuzzy string matching (fast)
      Stage 3: Semantic embedding search (accurate)
    """

    def __init__(self, csv_path: str, index_path: str = "medicine_index.pkl"):
        self.alias_map, self.canonical_list = load_dataset(csv_path)
        self.index = MedicineEmbeddingIndex()

        if os.path.exists(index_path):
            self.index.load(index_path)
        else:
            self.index.build(self.alias_map)
            self.index.save(index_path)

    def identify(self, input_name: str, verbose: bool = False) -> dict:
        """
        Identify the canonical medicine name from any input alias.

        Returns:
            {
              "input": original input,
              "canonical": identified canonical name,
              "confidence": 0.0 - 1.0,
              "method": how it was matched,
              "alternatives": other possible matches
            }
        """
        raw = input_name
        query = normalize(input_name)

        if not query:
            return {"input": raw, "canonical": None, "confidence": 0.0, "method": "empty"}

        # ── Stage 1: Exact match ──────────────────────────
        if query in self.alias_map:
            return {
                "input": raw,
                "canonical": self.alias_map[query],
                "confidence": 1.0,
                "method": "exact",
                "alternatives": []
            }

        # ── Stage 2: Fuzzy string match ───────────────────
        all_aliases = list(self.alias_map.keys())
        fuzzy_results = process.extract(
            query,
            all_aliases,
            scorer=fuzz.WRatio,
            limit=5
        )

        if fuzzy_results and fuzzy_results[0][1] >= 80:
            best_alias, score, _ = fuzzy_results[0]
            canonical = self.alias_map[best_alias]
            alternatives = [
                {"alias": a, "canonical": self.alias_map[a], "score": s / 100}
                for a, s, _ in fuzzy_results[1:]
                if self.alias_map[a] != canonical
            ]
            if verbose:
                print(f"  [fuzzy] '{query}' → '{best_alias}' → '{canonical}' (score: {score})")
            return {
                "input": raw,
                "canonical": canonical,
                "confidence": round(score / 100, 2),
                "method": "fuzzy",
                "alternatives": alternatives[:2]
            }

        # ── Stage 3: Semantic embedding search ───────────
        semantic_results = self.index.search(query, top_k=3)
        best = semantic_results[0]

        if best["score"] >= 0.60:
            if verbose:
                print(f"  [semantic] '{query}' → '{best['alias']}' → '{best['canonical']}' (score: {best['score']:.2f})")
            return {
                "input": raw,
                "canonical": best["canonical"],
                "confidence": round(best["score"], 2),
                "method": "semantic",
                "alternatives": semantic_results[1:]
            }

        # ── No confident match ────────────────────────────
        return {
            "input": raw,
            "canonical": None,
            "confidence": 0.0,
            "method": "no_match",
            "alternatives": semantic_results
        }

    def batch_identify(self, names: list) -> pd.DataFrame:
        """Identify a list of medicine names and return as DataFrame."""
        results = [self.identify(name) for name in names]
        return pd.DataFrame(results)


# ─────────────────────────────────────────────
# 5. TRAINING / EVALUATION
# ─────────────────────────────────────────────

def evaluate(identifier: MedicineIdentifier, test_cases: list) -> None:
    """
    Test the model against known correct answers.
    test_cases: list of (input, expected_canonical)
    """
    correct = 0
    total = len(test_cases)

    print("\n" + "="*60)
    print(f"{'INPUT':<20} {'EXPECTED':<20} {'GOT':<20} {'OK?'}")
    print("="*60)

    for input_name, expected in test_cases:
        result = identifier.identify(input_name)
        got = result["canonical"]
        ok = "✅" if got == expected else "❌"
        if got == expected:
            correct += 1
        print(f"{input_name:<20} {expected:<20} {str(got):<20} {ok}")

    print("="*60)
    print(f"Accuracy: {correct}/{total} = {correct/total*100:.1f}%\n")


# ─────────────────────────────────────────────
# 6. MAIN - Run this to train and test
# ─────────────────────────────────────────────

if __name__ == "__main__":

    CSV_PATH = "medicines_dataset.csv"

    print("\n🏥 Medicine Identifier - Training & Testing")
    print("=" * 50)

    # Build the model
    identifier = MedicineIdentifier(CSV_PATH)

    # ── Quick demo ────────────────────────────────────
    print("\n📋 Demo Queries:")
    demo_queries = [
        "PCM", "panadol", "paracitamol",  # paracetamol variants
        "brufen", "BRUFEN",               # ibuprofen
        "Zithromax", "z pack",            # azithromycin
        "glucophage", "metfor",           # metformin
        "flagyl",                         # metronidazole
        "ventolin inhaler",               # salbutamol
        "ORS",                            # oral rehydration
        "enalaprilat",                    # enalapril
        "vitamin d3",                     # vitamin d
        "unknowndrugxyz",                 # should fail
    ]

    for q in demo_queries:
        r = identifier.identify(q, verbose=True)
        status = f"→ {r['canonical']}" if r['canonical'] else "→ NOT FOUND"
        print(f"  {q:<25} {status}  [{r['method']}, {r['confidence']}]")

    # ── Evaluation ────────────────────────────────────
    test_cases = [
        ("PCM",          "paracetamol"),
        ("panadol",      "paracetamol"),
        ("paracitamol",  "paracetamol"),
        ("brufen",       "ibuprofen"),
        ("advil",        "ibuprofen"),
        ("zithromax",    "azithromycin"),
        ("glucophage",   "metformin"),
        ("flagyl",       "metronidazole"),
        ("ventolin",     "salbutamol"),
        ("lasix",        "furosemide"),
        ("lipitor",      "atorvastatin"),
        ("ORS",          "oral rehydration salts"),
        ("plavix",       "clopidogrel"),
        ("lantus",       "insulin"),
    ]

    evaluate(identifier, test_cases)

    # ── Batch example ─────────────────────────────────
    print("📊 Batch Processing Example:")
    batch = ["pcm", "brufen", "flagyl", "zithromax", "unknownxyz"]
    df = identifier.batch_identify(batch)
    print(df[["input", "canonical", "confidence", "method"]].to_string(index=False))
