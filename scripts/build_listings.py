"""data/listings.csv -> site/data/listings.json, with geocoding and computed fields.

Computed per listing: commute minutes to both anchors, tier, ward, area, total
monthly cost, an itemised upfront-cost estimate, and the nearest supermarket,
konbini and halal place. Listings outside the bike tier are dropped (reported).
"""
import csv
import json
import re
import sys
import unicodedata

import geo
import geocode

# Typical Tokyo move-in extras when a listing doesn't state them (JPY).
FIRE_INSURANCE = 20000
LOCK_CHANGE = 20000
GUARANTOR_RATE = 0.5      # guarantor company first-year fee, share of monthly total
CONSUMPTION_TAX = 1.1


def num(v):
    v = unicodedata.normalize("NFKC", (v or "")).replace(",", "").replace("円", "").strip()
    try:
        return float(v)
    except ValueError:
        return None


def yes(v):
    v = (v or "").strip().lower()
    return True if v in ("yes", "y", "true", "1") else False if v in ("no", "n", "false", "0") else None


def ward_of(addr):
    m = re.search(r"(目黒区|品川区|港区|渋谷区|世田谷区|大田区)", addr or "")
    return m.group(1) if m else ""


def town_of(addr):
    """'東京都品川区西五反田3丁目6-3' -> '西五反田' (town name without chome/block numbers)."""
    a = unicodedata.normalize("NFKC", addr or "")
    a = re.sub(r"^.*?区", "", a)
    m = re.match(r"(.+?)(?:[一二三四五六七八九十\d]+丁目|\d|$)", a)
    return m.group(1) if m else ""


def area_of(addr, areas):
    a = unicodedata.normalize("NFKC", addr or "")
    best = ("", 0)
    for area in areas:
        for ch in area.get("chome", []):
            ch = unicodedata.normalize("NFKC", ch)
            base = re.sub(r"[一二三四五六七八九\d〜~・、]+丁目.*$", "", ch)
            for cand in (ch, base):
                if cand and cand in a and len(cand) > best[1]:
                    best = (area["id"], len(cand))
    return best[0]


def upfront(r, rent, monthly):
    """Itemised estimate of the cash needed to sign. Returns (total, items, assumed)."""
    items, assumed = [], []

    def months_or_yen(mkey, ykey):
        m, y = num(r.get(mkey)), num(r.get(ykey))
        if y is not None:
            return y
        if m is not None:
            return m * rent
        return None

    dep = months_or_yen("deposit_months", "deposit_yen")
    key = months_or_yen("key_money_months", "key_money_yen")
    group = r["type_group"]
    std = group in ("standard", "foreigner")
    if dep is None:
        dep = rent if std else 0
        assumed.append("deposit")
    if key is None:
        key = rent if group == "standard" else 0
        assumed.append("key_money")
    fee_m = num(r.get("agency_fee_months"))
    if fee_m is None:
        fee_m = 1 if std else 0
        assumed.append("agency_fee")
    g = (r.get("guarantor_required") or "").strip().lower()
    guar = monthly * GUARANTOR_RATE if (g in ("yes", "company") or (g == "" and std)) else 0
    if g == "" and std:
        assumed.append("guarantor")
    items = [
        ("deposit", dep), ("key_money", key),
        ("agency_fee", round(fee_m * rent * CONSUMPTION_TAX)),
        ("guarantor", round(guar)),
        ("first_month", monthly),
    ]
    if std:
        items += [("fire_insurance", FIRE_INSURANCE), ("lock_change", LOCK_CHANGE)]
        assumed += ["fire_insurance", "lock_change"]
    total = round(sum(v for _, v in items))
    return total, [{"k": k, "v": round(v)} for k, v in items], assumed


def nearest(lat, lng, pois, cats):
    best = None
    for p in pois:
        if p["cat"] in cats and not p.get("far"):
            d = geo.haversine_m(lat, lng, p["lat"], p["lng"])
            if best is None or d < best[0]:
                best = (d, p)
    if not best:
        return None
    d, p = best
    return {"id": p["id"], "name": p["name"], "m": round(d * geo.DETOUR), "walk": geo.walk_min(d)}


def main():
    anchors = geo.load_anchors()
    pois = json.loads((geo.SITE_DATA / "pois.json").read_text(encoding="utf-8"))
    areas_path = geo.SITE_DATA / "areas.json"
    areas = json.loads(areas_path.read_text(encoding="utf-8")) if areas_path.exists() else []
    sources = {}
    with open(geo.DATA / "sources.csv", encoding="utf-8") as f:
        for s in csv.DictReader(f):
            sources[s["source"]] = s

    out, dropped, failed = [], [], []
    with open(geo.DATA / "listings.csv", encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f))
    for r in rows:
        rent = num(r["rent"])
        if not rent:
            failed.append((r["id"], "no rent"))
            continue
        lat, lng = num(r["lat"]), num(r["lng"])
        approx = yes(r["approx_location"])
        geo_title = ""
        if lat is None or lng is None:
            hit = geocode.geocode(r["address_ja"]) or geocode.geocode(re.sub(r"\d+(-\d+)*$", "", r["address_ja"]))
            if not hit:
                failed.append((r["id"], f"geocode failed: {r['address_ja']}"))
                continue
            lat, lng, geo_title = hit["lat"], hit["lng"], hit["title"]
            # GSI titles end in 番/号 only when it matched a block; otherwise it's a chome reference point.
            if not re.search(r"[番号]$", geo_title):
                approx = True
        d_off = geo.haversine_m(lat, lng, anchors["office"]["lat"], anchors["office"]["lng"])
        d_mos = geo.haversine_m(lat, lng, anchors["mosque"]["lat"], anchors["mosque"]["lng"])
        t = geo.tier(lat, lng, anchors)
        if t == "outside":
            dropped.append((r["id"], r["address_ja"], round(max(d_off, d_mos))))
            continue
        mgmt = num(r["mgmt_fee"]) or 0
        monthly = rent + mgmt
        total, items, assumed = upfront(r, rent, monthly)
        src = sources.get(r["source"], {})
        ff = src.get("foreigner_friendly", "")
        foreigner_ok = yes(r["foreigner_ok"])
        out.append({
            "id": r["id"], "source": r["source"], "url": r["source_url"], "agency": r["agency"],
            "fetched_at": r["fetched_at"], "group": r["type_group"],
            "name": r["name"], "address": r["address_text"], "address_ja": r["address_ja"],
            "lat": round(lat, 6), "lng": round(lng, 6), "approx": bool(approx),
            "ward": ward_of(r["address_ja"]), "town": town_of(r["address_ja"]),
            "area": area_of(r["address_ja"], areas),
            "layout": r["layout"].upper().replace("STUDIO", "1R"), "size": num(r["size_m2"]),
            "rent": round(rent), "mgmt": round(mgmt), "monthly": round(monthly),
            "upfront": total, "upfront_items": items, "upfront_assumed": assumed,
            "built": int(num(r["built_year"])) if num(r["built_year"]) else None,
            "floor": int(num(r["floor"])) if num(r["floor"]) else None,
            "floors": int(num(r["floors_total"])) if num(r["floors_total"]) else None,
            "bath_sep": yes(r["bath_toilet_separate"]), "autolock": yes(r["auto_lock"]),
            "furnished": yes(r["furnished"]),
            "foreigner": "agency" if ff.startswith("high") else ("yes" if foreigner_ok else ("no" if foreigner_ok is False else "")),
            "no_guarantor": ff == "high_no_guarantor" or (r.get("guarantor_required") or "").strip().lower() == "no",
            "station": r["nearest_station"],
            "notes_en": r["notes_en"], "notes_id": r["notes_id"],
            "tier": t,
            "walk_office": geo.walk_min(d_off), "walk_mosque": geo.walk_min(d_mos),
            "bike_office": geo.bike_min(d_off), "bike_mosque": geo.bike_min(d_mos),
            "near_super": nearest(lat, lng, pois, {"supermarket"}),
            "near_konbini": nearest(lat, lng, pois, {"convenience"}),
            "near_halal": nearest(lat, lng, pois, {"halal_food", "halal_grocery"}),
        })
    # Ward-only addresses: borrow the area of the nearest located listing within 600 m.
    for x in out:
        if not x["area"]:
            near = [(geo.haversine_m(x["lat"], x["lng"], y["lat"], y["lng"]), y["area"]) for y in out if y["area"]]
            d, a = min(near, default=(None, ""))
            if d is not None and d < 600:
                x["area"] = a
    out.sort(key=lambda x: (max(x["walk_office"], x["walk_mosque"]), x["monthly"]))
    (geo.SITE_DATA / "listings.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(out)} listings written ({sum(1 for x in out if x['tier'] == 'walk')} walk tier)")
    for i, a, d in dropped:
        print(f"  dropped (outside zone, {d} m): {i} {a}", file=sys.stderr)
    for i, why in failed:
        print(f"  skipped: {i}: {why}", file=sys.stderr)


if __name__ == "__main__":
    main()
