"""Sanity checks on site/data/*.json. Exit code 1 on errors (warnings don't fail)."""
import json
import sys

import geo

REQUIRED = ["id", "source", "url", "group", "layout", "rent", "lat", "lng", "tier"]
GROUPS = {"standard", "foreigner", "furnished", "serviced"}
LAYOUTS = {"1R", "1K", "1DK", "1LDK"}


def main():
    anchors = geo.load_anchors()
    listings = json.loads((geo.SITE_DATA / "listings.json").read_text(encoding="utf-8"))
    pois = json.loads((geo.SITE_DATA / "pois.json").read_text(encoding="utf-8"))
    errors, warnings = [], []
    ids, urls = set(), set()
    for x in listings:
        tag = x.get("id", "?")
        for k in REQUIRED:
            if x.get(k) in (None, ""):
                errors.append(f"{tag}: missing {k}")
        if x["id"] in ids:
            errors.append(f"{tag}: duplicate id")
        if (x["url"], x["name"]) in urls:
            errors.append(f"{tag}: duplicate url+name")
        ids.add(x["id"])
        urls.add((x["url"], x["name"]))
        if x["group"] not in GROUPS:
            errors.append(f"{tag}: bad group {x['group']}")
        if x["layout"] not in LAYOUTS:
            warnings.append(f"{tag}: unusual layout {x['layout']}")
        if not 15000 <= x["rent"] <= 1500000:
            warnings.append(f"{tag}: rent {x['rent']} looks off")
        if x.get("size") is not None and not 8 <= x["size"] <= 80:
            warnings.append(f"{tag}: size {x['size']} m2 looks off")
        if geo.tier(x["lat"], x["lng"], anchors) == "outside":
            errors.append(f"{tag}: outside zone")
        if not x["url"].startswith("http"):
            errors.append(f"{tag}: url not http")
    for p in pois:
        if not (35.5 < p["lat"] < 35.8 and 139.6 < p["lng"] < 139.9):
            errors.append(f"poi {p['id']}: coords outside Tokyo")
    for w in warnings:
        print("WARN ", w)
    for e in errors:
        print("ERROR", e)
    by_group = {}
    for x in listings:
        by_group[x["group"]] = by_group.get(x["group"], 0) + 1
    print(f"{len(listings)} listings {by_group}, {len(pois)} POIs, {len(errors)} errors, {len(warnings)} warnings")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
