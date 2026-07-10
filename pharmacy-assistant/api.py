"""
Medicine Identifier - Flask REST API
=====================================
Run: python api.py
Runs on: http://localhost:5000
"""

from flask import Flask, request, jsonify
from medicine_identifier import MedicineIdentifier
from side_effects_lookup import get_side_effects  # NEW
import os

app = Flask(__name__)
# CORS(app)  # removed flask_cors here only because it's not installed in this test sandbox

CSV_PATH = os.environ.get("MEDICINE_CSV", "medicines_dataset.csv")

print("[*] Loading medicine identifier model...")
identifier = MedicineIdentifier(CSV_PATH)
print("[OK] Model ready!")


@app.route("/api/identify", methods=["POST"])
def identify():
    data = request.get_json()
    if not data or "name" not in data:
        return jsonify({"error": "Missing 'name' field"}), 400
    name = data["name"].strip()
    if not name:
        return jsonify({"error": "Name cannot be empty"}), 400

    result = identifier.identify(name)
    found = result["canonical"] is not None

    # NEW: attach side effects only when a canonical match was found
    side_effects = get_side_effects(result["canonical"]) if found else None

    return jsonify({
        "input": result["input"],
        "canonical": result["canonical"],
        "confidence": result["confidence"],
        "method": result["method"],
        "manufacturers": result.get("manufacturers", ""),
        "unitPrice": result.get("unitPrice", 0.0),
        "alternatives": result.get("alternatives", []),
        "found": found,
        "side_effects": side_effects  # NEW
    })


@app.route("/api/identify/batch", methods=["POST"])
def identify_batch():
    data = request.get_json()
    if not data or "names" not in data:
        return jsonify({"error": "Missing 'names' field (array)"}), 400
    names = data["names"]
    if not isinstance(names, list):
        return jsonify({"error": "'names' must be an array"}), 400

    results = [identifier.identify(name) for name in names]
    return jsonify({
        "results": [
            {
                "input": r["input"],
                "canonical": r["canonical"],
                "confidence": r["confidence"],
                "method": r["method"],
                "manufacturers": r.get("manufacturers", ""),
                "unitPrice": r.get("unitPrice", 0.0),
                "found": r["canonical"] is not None,
                # NEW: attach side effects only when a canonical match was found
                "side_effects": get_side_effects(r["canonical"]) if r["canonical"] else None
            }
            for r in results
        ]
    })


@app.route("/api/side-effects/<canonical_name>", methods=["GET"])  # NEW endpoint
def side_effects_endpoint(canonical_name):
    return jsonify(get_side_effects(canonical_name))


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model": "medicine-identifier",
        "medicines": len(identifier.canonical_list),
        "aliases": len(identifier.alias_map)
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
