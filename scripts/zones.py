"""Build walk/bike zone polygons and list the neighborhoods (町丁目) inside them.

Writes site/data/zones.geojson. Neighborhood names come from OSM place nodes
(place=neighbourhood|quarter) via Overpass, cached in data/cache/places.json.
"""
import json
import sys
import time

import requests

import geo

OVERPASS = "https://overpass-api.de/api/interpreter"
UA = {"User-Agent": "tokyo-apartment-research/0.1 (personal, low volume)"}


def overpass(query, cache_name):
    cache = geo.DATA / "cache" / cache_name
    if cache.exists():
        return json.loads(cache.read_text(encoding="utf-8"))
    for attempt in range(3):
        r = requests.post(OVERPASS, data={"data": query}, headers=UA, timeout=180)
        if r.ok:
            cache.write_text(r.text, encoding="utf-8")
            return r.json()
        time.sleep(10 * (attempt + 1))
    r.raise_for_status()


def main():
    anchors = geo.load_anchors()
    a, b = anchors["office"], anchors["mosque"]
    features = []
    for name, radius in (("bike", geo.BIKE_RADIUS_M), ("walk", geo.WALK_RADIUS_M)):
        features.append({
            "type": "Feature",
            "properties": {"tier": name, "radius_m": round(radius), "max_min": geo.MAX_MIN},
            "geometry": {"type": "Polygon", "coordinates": [geo.lens_polygon(a, b, radius)]},
        })
    out = geo.SITE_DATA / "zones.geojson"
    out.write_text(json.dumps({"type": "FeatureCollection", "features": features}, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {out}")

    s, w, n, e = geo.bike_bbox(anchors)
    q = f'[out:json][timeout:120];node["place"~"^(neighbourhood|quarter|suburb)$"]({s},{w},{n},{e});out;'
    places = overpass(q, "places.json")
    rows = []
    for el in places["elements"]:
        t = geo.tier(el["lat"], el["lon"], anchors)
        if t != "outside":
            tags = el.get("tags", {})
            rows.append((t, tags.get("name", "?"), tags.get("name:en", ""), el["lat"], el["lon"]))
    rows.sort()
    for t, nm, en, lat, lng in rows:
        print(f"{t:5} {nm} ({en}) {lat:.5f},{lng:.5f}")
    print(f"{len(rows)} places inside zones", file=sys.stderr)


if __name__ == "__main__":
    main()
