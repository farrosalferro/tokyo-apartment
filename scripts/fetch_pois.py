"""Fetch everyday places from OpenStreetMap (Overpass) inside the bike-tier zone,
merge with hand-researched places in data/pois_manual.csv, write site/data/pois.json.

Rerun with --refresh to ignore the Overpass cache.
"""
import csv
import json
import re
import sys

import geo
import geocode
from zones import overpass

# category -> Overpass selectors (nodes, ways and relations; `out center` gives a point)
QUERIES = {
    "supermarket": ['["shop"="supermarket"]'],
    "convenience": ['["shop"="convenience"]'],
    "halal_food": ['["diet:halal"~"^(yes|only)$"]', '["cuisine"~"halal|indonesian|malaysian|turkish|pakistani|bangladeshi"]'],
    "mosque": ['["amenity"="place_of_worship"]["religion"="muslim"]'],
    "post": ['["amenity"="post_office"]'],
    "bank": ['["amenity"="bank"]'],
    "clinic": ['["amenity"~"^(clinic|hospital|doctors)$"]'],
    "gym": ['["leisure"="fitness_centre"]'],
    "laundry": ['["shop"~"^(laundry|dry_cleaning)$"]["self_service"="yes"]', '["shop"="laundry"]'],
    "government": ['["amenity"="townhall"]'],
    "park": ['["leisure"="park"]["name"]'],
    "drugstore": ['["shop"="chemist"]', '["amenity"="pharmacy"]'],
    "hardware": ['["shop"~"^(doityourself|hardware|houseware|variety_store)$"]'],
}

# Categories shown in the site's layer menu; drugstore/hardware fold into "daily".
SITE_CAT = {
    "supermarket": "supermarket", "convenience": "convenience",
    "halal_food": "halal_food", "halal_grocery": "halal_grocery", "mosque": "mosque",
    "community": "community", "service": "service", "government": "service",
    "post": "daily", "bank": "daily", "clinic": "clinic", "gym": "daily", "laundry": "daily",
    "drugstore": "daily", "hardware": "daily", "park": "park",
}

def build_query(bbox):
    s, w, n, e = bbox
    parts = []
    for sels in QUERIES.values():
        for sel in sels:
            parts.append(f"nwr{sel}({s},{w},{n},{e});")
    return "[out:json][timeout:180];(" + "".join(parts) + ");out center tags;"


HALAL_CUISINE = re.compile(r"halal|indonesian|malaysian|turkish|pakistani|bangladeshi")

# Checked in order; first match wins (halal before generic shops).
CLASSIFIERS = [
    ("halal_food", lambda t: t.get("diet:halal") in ("yes", "only") or bool(HALAL_CUISINE.search(t.get("cuisine", "")))),
    ("mosque", lambda t: t.get("amenity") == "place_of_worship" and t.get("religion") == "muslim"),
    ("supermarket", lambda t: t.get("shop") == "supermarket"),
    ("convenience", lambda t: t.get("shop") == "convenience"),
    ("post", lambda t: t.get("amenity") == "post_office"),
    ("bank", lambda t: t.get("amenity") == "bank"),
    ("clinic", lambda t: t.get("amenity") in ("clinic", "hospital", "doctors")),
    ("gym", lambda t: t.get("leisure") == "fitness_centre"),
    ("laundry", lambda t: t.get("shop") in ("laundry", "dry_cleaning")),
    ("government", lambda t: t.get("amenity") == "townhall"),
    ("park", lambda t: t.get("leisure") == "park" and "name" in t),
    ("drugstore", lambda t: t.get("shop") == "chemist" or t.get("amenity") == "pharmacy"),
    ("hardware", lambda t: t.get("shop") in ("doityourself", "hardware", "houseware", "variety_store")),
]


def classify(tags):
    for cat, pred in CLASSIFIERS:
        if pred(tags):
            return cat
    return None


def main():
    anchors = geo.load_anchors()
    if "--refresh" in sys.argv:
        (geo.DATA / "cache" / "pois_osm.json").unlink(missing_ok=True)
    data = overpass(build_query(geo.bike_bbox(anchors)), "pois_osm.json")
    out, seen = [], set()
    for el in data["elements"]:
        lat = el.get("lat") or el.get("center", {}).get("lat")
        lng = el.get("lon") or el.get("center", {}).get("lon")
        tags = el.get("tags", {})
        if lat is None or geo.tier(lat, lng, anchors) == "outside":
            continue
        cat = classify(tags)
        if not cat:
            continue
        name = tags.get("name") or tags.get("brand") or ""
        if not name and cat in ("park", "halal_food", "government"):
            continue
        key = (cat, name, round(lat, 4), round(lng, 4))
        if key in seen:
            continue
        seen.add(key)
        out.append({
            "id": f"osm-{el['type'][0]}{el['id']}",
            "cat": SITE_CAT[cat],
            "kind": cat,
            "name": tags.get("name:en") or name,
            "name_ja": tags.get("name:ja") or name,
            "lat": round(lat, 6), "lng": round(lng, 6),
            "src": "OpenStreetMap",
            "url": f"https://www.openstreetmap.org/{el['type']}/{el['id']}",
            "hours": tags.get("opening_hours", ""),
            "note_en": "", "note_id": "",
        })
    n_osm = len(out)

    manual = geo.DATA / "pois_manual.csv"
    n_manual = 0
    if manual.exists():
        with open(manual, encoding="utf-8") as f:
            for row in csv.DictReader(f):
                lat, lng = row.get("lat"), row.get("lng")
                if not lat or not lng:
                    hit = geocode.geocode(row.get("address_ja", ""))
                    if not hit:
                        print(f"  ! could not geocode {row['id']} {row.get('address_ja')}", file=sys.stderr)
                        continue
                    lat, lng = hit["lat"], hit["lng"]
                lat, lng = float(lat), float(lng)
                out.append({
                    "id": row["id"], "cat": SITE_CAT.get(row["cat"], row["cat"]), "kind": row["cat"],
                    "name": row["name"], "name_ja": row.get("name_ja", ""),
                    "lat": round(lat, 6), "lng": round(lng, 6),
                    "src": row.get("src", ""), "url": row.get("url", ""), "hours": "",
                    "note_en": row.get("note_en", ""), "note_id": row.get("note_id", ""),
                    "address_ja": row.get("address_ja", ""),
                    "far": geo.tier(lat, lng, anchors) == "outside",
                })
                n_manual += 1

    (geo.SITE_DATA / "pois.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    counts = {}
    for p in out:
        counts[p["cat"]] = counts.get(p["cat"], 0) + 1
    print(f"{n_osm} OSM + {n_manual} manual POIs: {counts}")


if __name__ == "__main__":
    main()
