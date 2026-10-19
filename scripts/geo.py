"""Shared geometry helpers: anchors, distances, commute tiers.

Commute times are estimates: straight-line distance x DETOUR to approximate
street routes, then the Japanese real-estate walking convention (80 m/min)
or a relaxed city bike pace (200 m/min = 12 km/h).
"""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE_DATA = ROOT / "site" / "data"
DATA = ROOT / "data"

DETOUR = 1.3
WALK_M_PER_MIN = 80
BIKE_M_PER_MIN = 200
MAX_MIN = 20

# Straight-line radius that corresponds to a 20-minute trip.
WALK_RADIUS_M = MAX_MIN * WALK_M_PER_MIN / DETOUR  # ~1231 m
BIKE_RADIUS_M = MAX_MIN * BIKE_M_PER_MIN / DETOUR  # ~3077 m


def load_anchors():
    with open(SITE_DATA / "anchors.json", encoding="utf-8") as f:
        return {a["id"]: a for a in json.load(f)}


def haversine_m(lat1, lng1, lat2, lng2):
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lng2 - lng1)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def walk_min(dist_m):
    return round(dist_m * DETOUR / WALK_M_PER_MIN)


def bike_min(dist_m):
    return max(1, round(dist_m * DETOUR / BIKE_M_PER_MIN))


def tier(lat, lng, anchors):
    """'walk' if both anchors are <=20 min on foot, 'bike' if <=20 min by bike, else 'outside'."""
    d = [haversine_m(lat, lng, a["lat"], a["lng"]) for a in anchors.values()]
    if max(d) <= WALK_RADIUS_M:
        return "walk"
    if max(d) <= BIKE_RADIUS_M:
        return "bike"
    return "outside"


def offset(lat, lng, dist_m, bearing_rad):
    """Point dist_m away from (lat, lng) along bearing (flat-earth approx, fine at this scale)."""
    dlat = dist_m * math.cos(bearing_rad) / 111320.0
    dlng = dist_m * math.sin(bearing_rad) / (111320.0 * math.cos(math.radians(lat)))
    return lat + dlat, lng + dlng


def lens_polygon(a, b, radius_m, steps=360):
    """Intersection of two equal circles as a [lng, lat] ring (convex, so angle-sort works)."""
    pts = []
    for c, other in ((a, b), (b, a)):
        for i in range(steps):
            lat, lng = offset(c["lat"], c["lng"], radius_m, 2 * math.pi * i / steps)
            if haversine_m(lat, lng, other["lat"], other["lng"]) <= radius_m:
                pts.append((lat, lng))
    clat = sum(p[0] for p in pts) / len(pts)
    clng = sum(p[1] for p in pts) / len(pts)
    pts.sort(key=lambda p: math.atan2(p[0] - clat, p[1] - clng))
    ring = [[round(p[1], 6), round(p[0], 6)] for p in pts]
    ring.append(ring[0])
    return ring


def bike_bbox(anchors, pad_m=200):
    """(south, west, north, east) box covering the bike-tier lens."""
    lats, lngs = [], []
    for a in anchors.values():
        for k in range(4):
            lat, lng = offset(a["lat"], a["lng"], BIKE_RADIUS_M + pad_m, k * math.pi / 2)
            lats.append(lat)
            lngs.append(lng)
    return min(lats), min(lngs), max(lats), max(lngs)
