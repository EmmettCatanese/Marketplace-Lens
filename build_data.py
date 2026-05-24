import json
from pathlib import Path

INPUT = Path("data.json")
OUTPUT = Path("Marketplace-Lens/data.js")

with open(INPUT) as f:
    data = json.load(f)

# Embed as a JS global. Compact JSON to keep the file size down.
js_content = (
    "// Auto-generated, do not edit by hand.\n"
    "window.DATA = "
    + json.dumps(data, separators=(",", ":"))
    + ";\n"
)

OUTPUT.parent.mkdir(exist_ok=True)
OUTPUT.write_text(js_content)

# Reporting
size_kb = OUTPUT.stat().st_size / 1024
total_trims = sum(
    len(trims) for mfrs in data.values() for yrs in mfrs.values() for trims in yrs.values()
)
print(f"Wrote {OUTPUT}")
print(f"  Size: {size_kb:.1f} KB")
print(f"  Manufacturers: {len(data)}")
print(f"  Trim entries:  {total_trims:,}")