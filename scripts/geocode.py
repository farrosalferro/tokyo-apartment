"""Geocode Japanese addresses with the GSI address search API, cached on disk.

GSI returns the best match it can: a full 番地 resolves to a block, a bare 丁目 to
the chome's reference point. Callers decide whether the result is approximate.
"""
import json
import re
import time
import unicodedata
import urllib.parse

import requests

import geo

URL = "https://msearch.gsi.go.jp/address-search/AddressSearch?q="
CACHE = geo.DATA / "cache" / "geocode.json"
_cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}

KANJI_NUM = {"一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9}


def normalize(addr):
    """NFKC, drop building/room parts, '2丁目3-4' style kept as is."""
    a = unicodedata.normalize("NFKC", addr or "").strip().replace(" ", "")
    a = re.sub(r"^(東京都)?", "東京都", a) if a else a
    return a


def _query(q):
    r = requests.get(URL + urllib.parse.quote(q), timeout=30,
                     headers={"User-Agent": "tokyo-apartment-research/0.1"})
    r.raise_for_status()
    time.sleep(0.5)
    return r.json()


def _chome_digits(text):
    m = re.search(r"([一二三四五六七八九]|\d)丁目", text)
    if not m:
        return None
    c = m.group(1)
    return KANJI_NUM.get(c) or int(c)


def geocode(addr):
    """Return {lat, lng, title} or None. Rejects matches whose 丁目 disagrees with the query."""
    q = normalize(addr)
    if not q:
        return None
    if q in _cache:
        return _cache[q]
    hit = None
    try:
        res = _query(q)
    except requests.RequestException:
        return None
    want = _chome_digits(q)
    for feat in res:
        title = feat["properties"]["title"]
        if want is not None and _chome_digits(title) not in (None, want):
            continue
        lng, lat = feat["geometry"]["coordinates"]
        hit = {"lat": lat, "lng": lng, "title": title}
        break
    _cache[q] = hit
    CACHE.write_text(json.dumps(_cache, ensure_ascii=False, indent=0), encoding="utf-8")
    return hit


if __name__ == "__main__":
    import sys
    for a in sys.argv[1:]:
        print(a, "->", geocode(a))
