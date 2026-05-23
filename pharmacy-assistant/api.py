"""
Medicine Identifier - Flask REST API
=====================================
Run: python api.py
Runs on: http://localhost:5000
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from medicine_identifier import MedicineIdentifier

app = Flask(__name__)
CORS(app)  # Allow Next.js (localhost:3000) to call this

# Load model once when server starts
print("🔄 Loading medicine identifier model...")
identifier = MedicineIdentifier("medicines_dataset.csv")
print("✅ Model ready!")


# ── Single medicine identify ──────────────────────────
@app.route("/api/identify", methods=["POST"])
def identify():
    data = request.get_json()

    if not data or "name" not in data:
        return jsonify({"error": "Missing 'name' field"}), 400

    name = data["name"].strip()
    if not name:
        return jsonify({"error": "Name cannot be empty"}), 400

    result = identifier.identify(name)

    return jsonify({
        "input": result["input"],
        "canonical": result["canonical"],
        "confidence": result["confidence"],
        "method": result["method"],
        "alternatives": result.get("alternatives", []),
        "found": result["canonical"] is not None
    })


# ── Batch identify ────────────────────────────────────
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
                "found": r["canonical"] is not None
            }
            for r in results
        ]
    })


# ── Health check ──────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "medicine-identifier"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
