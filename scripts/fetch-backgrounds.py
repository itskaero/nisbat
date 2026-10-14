#!/usr/bin/env python3
"""
Time-of-day background photos for Nisbat Home (dawn, day, dusk, night).

Same review workflow as the grocery images: Openverse (CC BY / BY-SA / CC0 /
PDM, commercial use + modification allowed) → candidates + contact sheet →
a person picks → apply writes WebP variants and credits.

  python3 -I scripts/fetch-backgrounds.py candidates <workdir>
  # write <workdir>/choices.json  {"dusk": "<openverse id>", ...}
  python3 -I scripts/fetch-backgrounds.py apply <workdir>

Outputs public/backgrounds/<slot>.webp (1920w), <slot>-sm.webp (960w),
<slot>-blur.webp (pre-blurred, used in TV mode where live blur is too costly)
and src/data/background-credits.json.
"""
import io
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public/backgrounds"
CREDITS = ROOT / "src/data/background-credits.json"
UA = "NisbatHome/0.1 (background image attribution script)"
API = "https://api.openverse.org/v1/images/"

SLOTS = {
    "dawn": ["mosque sunrise", "sunrise clouds mountains", "fog morning valley"],
    "day": ["faisal mosque", "badshahi mosque", "hunza valley"],
    "dusk": ["badshahi mosque sunset", "mosque sunset", "sunset clouds"],
    "night": ["badshahi mosque night", "mosque night lights", "night sky stars mountains"],
}


def get(url, timeout=60):
    for attempt in range(4):
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code not in (429, 503) or attempt == 3:
                raise
            time.sleep(15 * 2**attempt)


def cover(img: Image.Image, w: int, h: int) -> Image.Image:
    img = img.convert("RGB")
    scale = max(w / img.width, h / img.height)
    img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    left, top = (img.width - w) // 2, (img.height - h) // 2
    return img.crop((left, top, left + w, top + h))


def candidates(work: Path):
    work.mkdir(parents=True, exist_ok=True)
    found = {}
    for slot, queries in SLOTS.items():
        picks = []
        for q in queries:
            params = urllib.parse.urlencode({"q": q, "license_type": "commercial,modification", "source": "flickr", "page_size": 20, "mature": "false"})
            data = json.loads(get(f"{API}?{params}"))
            for r in data.get("results", []):
                if len(picks) >= 9:
                    break
                w, h = r.get("width") or 0, r.get("height") or 0
                if w < 1000 or w < h * 1.3:
                    continue
                try:
                    img = Image.open(io.BytesIO(get(r["url"])))
                except Exception:  # noqa: BLE001
                    continue
                cover(img, 480, 270).save(work / f"{r['id']}.jpg", quality=80)
                picks.append({k: r.get(k) for k in ("id", "title", "creator", "license", "license_version", "license_url", "foreign_landing_url", "url")})
                time.sleep(0.5)
            time.sleep(3)
        found[slot] = picks
        print(slot, len(picks), flush=True)
        (work / "candidates.json").write_text(json.dumps(found, indent=1, ensure_ascii=False))
        sheet = Image.new("RGB", (3 * 480, 3 * 290), "white")
        d = ImageDraw.Draw(sheet)
        for i, p in enumerate(picks):
            x, y = (i % 3) * 480, (i // 3) * 290
            sheet.paste(Image.open(work / f"{p['id']}.jpg"), (x, y))
            d.text((x + 6, y + 272), f"{i}: {p['title'][:60]}", fill="black")
        sheet.save(work / f"sheet-{slot}.jpg", quality=75)


def apply(work: Path):
    data = json.loads((work / "candidates.json").read_text())
    choices = json.loads((work / "choices.json").read_text())
    OUT.mkdir(parents=True, exist_ok=True)
    credits = {}
    for slot, idx in choices.items():
        c = data[slot][idx]
        img = Image.open(io.BytesIO(get(c["url"])))
        big = cover(img, 1920, 1080)
        big.save(OUT / f"{slot}.webp", "WEBP", quality=74)
        cover(img, 960, 540).save(OUT / f"{slot}-sm.webp", "WEBP", quality=72)
        cover(img, 960, 540).filter(ImageFilter.GaussianBlur(18)).save(OUT / f"{slot}-blur.webp", "WEBP", quality=70)
        lic = c["license"].upper()
        lic = "CC0 1.0" if lic == "CC0" else "Public Domain Mark" if lic == "PDM" else f"CC {lic} {c['license_version']}"
        credits[slot] = {"title": c["title"], "author": c["creator"] or "Unknown", "license": lic, "licenseUrl": c["license_url"], "sourceUrl": c["foreign_landing_url"]}
        print("applied", slot, flush=True)
    CREDITS.write_text(json.dumps(credits, indent=2, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    {"candidates": candidates, "apply": apply}[sys.argv[1]](Path(sys.argv[2]))
