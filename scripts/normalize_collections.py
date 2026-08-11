"""
Step 2: Normalize all collection JSON files to the canonical CollectionEntry schema.

Rules:
- category (string)     → categories (array)
- sourceCategory        → removed
- rock                  → pop
- nursery               → folk
- artist field          → kept if present, omitted if absent
- categories            → always present as an array (empty if unknown)
"""

import json
import os

PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "collections")

CATEGORY_REMAP = {
    "rock": "pop",
    "nursery": "folk",
}

VALID_CATEGORIES = {"pop", "classical", "movie-tv", "game", "holiday", "folk", "alert", "original"}


def remap_category(cat: str) -> str:
    return CATEGORY_REMAP.get(cat, cat)


def normalize_entry(entry: dict) -> dict:
    result: dict = {}

    result["name"] = entry["name"]

    if "artist" in entry and entry["artist"]:
        result["artist"] = entry["artist"]

    # Resolve categories
    cats: list[str] = []

    if "categories" in entry and isinstance(entry["categories"], list):
        cats = [remap_category(c) for c in entry["categories"]]
    elif "category" in entry and isinstance(entry["category"], str):
        cats = [remap_category(entry["category"])]
    # sourceCategory is discarded (e.g. "Mixed 1" from picaxe)

    # Keep only known valid categories
    result["categories"] = [c for c in cats if c in VALID_CATEGORIES]

    result["tracks"] = entry["tracks"]

    return result


def normalize_file(filename: str):
    path = os.path.join(PUBLIC_DIR, filename)
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    normalized = [normalize_entry(e) for e in data]

    with open(path, "w", encoding="utf-8") as f:
        json.dump(normalized, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"✓ {filename}: {len(normalized)} entries normalized")


FILES = [
    "community.json",
    "esc-configurator.json",
    "esphome.json",
    "picaxe.json",
    "skully-rtttl.json",
]

for file in FILES:
    normalize_file(file)

print("\nDone.")
