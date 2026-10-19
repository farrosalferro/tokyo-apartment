# Meguro Apartment Map

A static map site for choosing a 1R/1K/1DK within a 20-minute walk or bike ride of both
**Meguro Central Square** (品川区上大崎3-1-1) and **Masjid Indonesia Tokyo** (目黒区目黒4-6-6).
It has English and Bahasa Indonesia, and is served from `site/` by GitHub Pages.

## Layout

| Path | What |
|---|---|
| `site/` | The website (no build step). `index.html`, `app.js`, `styles.css`, `i18n.js`, vendored Leaflet in `vendor/` |
| `site/data/` | Generated data the site loads: `anchors.json`, `zones.geojson`, `pois.json`, `listings.json`, `areas.json`, `meta.json` |
| `data/listings.csv` | Master list of rooms, one row per listing (columns in `data/listings_header.csv`) |
| `data/raw/*.csv` | Per-source CSVs from the collectors; `merge_raw.py` merges them into `listings.csv` |
| `data/pois_manual.csv` | Hand-checked halal places, community and ward offices (OSM halal tagging is sparse) |
| `data/sources.csv` | Each listing source: housing type and how foreigner-friendly it is |
| `data/AGENT_BRIEF.md` | Instructions used to collect listings (zone, fields, rules) |
| `scripts/` | Python 3 pipeline (needs `requests`) |

## Commute estimates

Straight-line distance × 1.3 for street detours, at 80 m/min walking (the Japanese
real-estate convention) and 200 m/min cycling. The **walk tier** means both anchors are ≤ 20 min on
foot (≈1.23 km straight line). The **bike tier** means both are ≤ 20 min by bike (≈3.08 km). Each card
links to the real Google Maps walking route.

## Refresh the listings (Feb–Mar 2027)

Tokyo rentals are listed 1–2 months before move-in, so collect fresh rooms in Feb–Mar 2027:

1. Replace `data/raw/*.csv` with new collector output, following `data/AGENT_BRIEF.md`.
   You can also add rows by hand to `data/listings.csv` with an id starting `manual-`, which keeps them through merges.
2. Update `snapshot_date` (and the exchange rate if you like) in `site/data/meta.json`.
3. Rebuild and check:
   ```sh
   cd scripts
   python3 merge_raw.py        # raw/*.csv -> data/listings.csv
   python3 build_listings.py   # geocode + commute + costs -> site/data/listings.json
   python3 validate.py         # must print 0 errors
   ```
4. Commit and push. The GitHub Action republishes the site.

POIs and zones rarely change. To refresh them, run `python3 fetch_pois.py --refresh` (or `zones.py`)
and then `build_listings.py`, which uses POIs for the "nearest supermarket/halal" fields.

## Preview locally

```sh
cd site && python3 -m http.server 8765   # open http://127.0.0.1:8765
```

## Data sources and credits

Listings come from the public sites named on each card. Places come from © OpenStreetMap contributors
(ODbL) via Overpass, plus the manual list. The base maps are 国土地理院 (GSI) 淡色地図 and OpenStreetMap
tiles. Geocoding uses the GSI address search API.
