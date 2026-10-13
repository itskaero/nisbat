#!/usr/bin/env python3
"""
Build openly licensed product photos for the Saman grocery catalog.

Images come from Openverse (https://openverse.org), which indexes Creative
Commons and public-domain images with licence and attribution metadata. Only
licences that allow commercial use *and* modification are requested, because we
crop and resize the photos.

Every image is reviewed by a person before it ships — a search result is not
always a faithful picture of the product. The workflow is:

  1. python3 -I scripts/fetch-grocery-images.py candidates <workdir>
       Downloads up to 3 candidates per product into <workdir> and writes
       <workdir>/candidates.json plus contact sheets for review.
  2. Review the contact sheets and write <workdir>/choices.json mapping
       product id -> candidate index (0-2). Leave a product out to use its
       category illustration instead.
  3. python3 -I scripts/fetch-grocery-images.py apply <workdir>
       Writes public/groceries/<id>.webp and src/data/grocery-images.json.
"""
import io
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public/groceries"
OUT_JSON = ROOT / "src/data/grocery-images.json"
UA = "NisbatHome/0.1 (grocery catalog image attribution script)"
API = "https://api.openverse.org/v1/images/"

# Product id -> search query. Packaged/branded goods (soap, detergent, etc.)
# deliberately have no query: a generic illustration is more honest than a
# random brand's packaging.
QUERIES = {
    "atta": "whole wheat flour", "maida": "white flour bowl", "suji": "semolina", "basmati": "basmati rice",
    "sela-rice": "parboiled rice grains", "broken-rice": "broken rice grains", "besan": "gram flour besan", "daliya": "bulgur wheat",
    "masoor": "red lentils", "moong": "mung beans", "mash": "urad dal", "chana-daal": "chana dal",
    "kabuli-chana": "chickpeas", "kala-chana": "black chickpeas", "lobia": "red kidney beans",
    "cooking-oil": "cooking oil bottle", "ghee": "ghee", "salt": "salt crystals", "sugar": "white sugar",
    "gur": "jaggery", "red-chilli": "red chili powder", "haldi": "turmeric powder", "dhania-powder": "coriander seeds",
    "zeera": "cumin seeds", "garam-masala": "garam masala spices", "black-pepper": "black peppercorns", "elaichi": "green cardamom",
    "onion": "red onions", "tomato": "tomatoes", "potato": "potatoes", "garlic": "garlic bulbs", "ginger": "ginger root",
    "green-chilli": "green chillies", "coriander": "fresh coriander leaves", "mint": "fresh mint leaves", "spinach": "spinach leaves",
    "okra": "okra", "aubergine": "eggplant", "cauliflower": "cauliflower", "cabbage": "cabbage", "carrot": "carrots",
    "peas": "green peas pods", "lemon": "limes", "bottle-gourd": "bottle gourd", "bitter-gourd": "bitter gourd karela",
    "turnip": "turnips", "cucumber": "cucumbers", "capsicum": "green bell pepper",
    "banana": "bananas", "apple": "red apples", "kinnow": "kinnow mandarin", "mango": "mangoes", "guava": "guava fruit",
    "pomegranate": "pomegranate", "grapes": "green grapes", "dates": "dates fruit", "melon": "cantaloupe melon",
    "watermelon": "watermelon", "papaya": "papaya fruit",
    "milk": "glass of milk", "yogurt": "yogurt bowl", "butter": "butter block", "cheese": "cheese", "lassi": "lassi",
    "chicken": "raw chicken meat", "beef": "raw beef", "mutton": "raw mutton meat", "fish": "fresh fish market", "eggs": "brown eggs",
    "qeema": "minced meat", "roti": "chapati", "naan": "naan bread", "bread": "sliced white bread", "rusk": "rusk biscuits",
    "paratha": "paratha", "tea": "black tea leaves", "green-tea": "green tea cup", "coffee": "instant coffee",
    "dry-fruit": "almonds walnuts", "honey": "honey jar", "pickle": "indian pickle achar", "vermicelli": "vermicelli seviyan",
    "samosa": "samosa", "kabab": "shami kebab", "nimko": "bombay mix", "ice-cream": "ice cream scoops",
}


def get(url, timeout=40):
    for attempt in range(4):
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or attempt == 3:
                raise
            time.sleep(10 * 2**attempt)


def square(img, size=360):
    img = img.convert("RGB")
    w, h = img.size
    side = min(w, h)
    img = img.crop(((w - side) // 2, (h - side) // 2, (w + side) // 2, (h + side) // 2))
    return img.resize((size, size), Image.LANCZOS)


def candidates(workdir: Path):
    workdir.mkdir(parents=True, exist_ok=True)
    out = {}
    for pid, q in QUERIES.items():
        params = urllib.parse.urlencode({"q": q, "license_type": "commercial,modification", "page_size": 6, "mature": "false"})
        try:
            data = json.loads(get(f"{API}?{params}"))
        except Exception as e:  # noqa: BLE001
            print(f"search error {pid}: {e}", flush=True)
            continue
        picks = []
        for r in data.get("results", []):
            if len(picks) == 3:
                break
            if not r.get("width") or min(r["width"], r["height"]) < 300:
                continue
            try:
                img = Image.open(io.BytesIO(get(r["thumbnail"])))
            except Exception:  # noqa: BLE001
                continue
            square(img, 240).save(workdir / f"{pid}-{len(picks)}.jpg", "JPEG", quality=82)
            picks.append({k: r.get(k) for k in ("id", "title", "creator", "license", "license_version", "license_url", "foreign_landing_url", "thumbnail", "source")})
        out[pid] = picks
        print(f"{pid}: {len(picks)} candidates", flush=True)
        (workdir / "candidates.json").write_text(json.dumps(out, indent=1, ensure_ascii=False))
        time.sleep(1)
    sheets(workdir, out)


def sheets(workdir: Path, data: dict, per_sheet=12):
    ids = list(data)
    for s in range(0, len(ids), per_sheet):
        batch = ids[s : s + per_sheet]
        sheet = Image.new("RGB", (3 * 240 + 200, len(batch) * 250), "white")
        d = ImageDraw.Draw(sheet)
        for row, pid in enumerate(batch):
            d.text((8, row * 250 + 110), pid, fill="black")
            for i in range(len(data[pid])):
                p = workdir / f"{pid}-{i}.jpg"
                if p.exists():
                    sheet.paste(Image.open(p), (200 + i * 240, row * 250))
                    d.text((204 + i * 240, row * 250 + 4), str(i), fill="red")
        sheet.save(workdir / f"sheet-{s // per_sheet:02d}.jpg", "JPEG", quality=70)


def apply(workdir: Path):
    data = json.loads((workdir / "candidates.json").read_text())
    choices = json.loads((workdir / "choices.json").read_text())
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for f in OUT_DIR.glob("*.webp"):
        f.unlink()
    result = {}
    for pid, idx in choices.items():
        c = data[pid][idx]
        img = Image.open(io.BytesIO(get(c["thumbnail"])))
        square(img).save(OUT_DIR / f"{pid}.webp", "WEBP", quality=78)
        lic = c["license"].upper()
        lic = "CC0 1.0" if lic == "CC0" else "Public Domain Mark" if lic == "PDM" else f"CC {lic} {c['license_version']}"
        result[pid] = {
            "src": f"/groceries/{pid}.webp",
            "title": c["title"] or "Untitled",
            "author": c["creator"] or "Unknown",
            "license": lic,
            "licenseUrl": c["license_url"],
            "sourceUrl": c["foreign_landing_url"],
        }
        print(f"applied {pid}", flush=True)
        time.sleep(0.5)
    OUT_JSON.write_text(json.dumps(dict(sorted(result.items())), indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {len(result)} images")


if __name__ == "__main__":
    mode, workdir = sys.argv[1], Path(sys.argv[2])
    {"candidates": candidates, "apply": apply}[mode](workdir)
