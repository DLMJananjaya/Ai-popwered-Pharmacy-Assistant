

import pandas as pd
import os

# Load once at startup, same pattern as your existing medicines_dataset.csv load
_SIDE_EFFECTS_PATH = os.path.join(os.path.dirname(__file__), "side_effects.csv")
_side_effects_df = pd.read_csv(_SIDE_EFFECTS_PATH)
_side_effects_df["canonical_name"] = _side_effects_df["canonical_name"].str.lower().str.strip()
_side_effects_df = _side_effects_df.set_index("canonical_name")


def get_side_effects(canonical_name: str) -> dict:
    """
    Look up side effects for an already-matched canonical drug name.
    Only call this AFTER your existing matcher has resolved a Status="Found" match.
    Never call this on raw/unmatched OCR text.
    """
    if not canonical_name:
        return {"found": False, "common": None, "warnings": None, "source": None}

    key = canonical_name.lower().strip()

    if key in _side_effects_df.index:
        row = _side_effects_df.loc[key]
        return {
            "found": True,
            "common": row["common_side_effects"],
            "warnings": row["serious_warnings"],
            "source": row["source"],
        }

    # Not in our curated list yet - don't guess, say so explicitly
    return {
        "found": False,
        "common": None,
        "warnings": None,
        "source": None,
    }


# Quick manual test - run this file directly to sanity check it works
if __name__ == "__main__":
    test_names = ["Dexamethasone", "omeprazole", "Domperidone", "Unknown Drug XYZ"]
    for name in test_names:
        result = get_side_effects(name)
        print(f"{name}: {result}")
