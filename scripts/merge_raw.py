"""Concatenate collector CSVs (data/raw/*.csv) into the master data/listings.csv.

Rows are de-duplicated by (source_url, name), since one page can list several rooms; ids are prefixed with the raw file name so
they stay unique. Rows already in listings.csv that came from elsewhere (e.g.
added by hand, id starting with "manual-") are kept.
"""
import csv
import sys

import geo

HEADER = (geo.DATA / "listings_header.csv").read_text(encoding="utf-8").strip().split(",")


def read_rows(path):
    with open(path, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def main():
    master = geo.DATA / "listings.csv"
    kept = [r for r in read_rows(master) if r.get("id", "").startswith("manual-")] if master.exists() else []
    seen = {(r["source_url"], r["name"]) for r in kept}
    rows = list(kept)
    for path in sorted((geo.DATA / "raw").glob("*.csv")):
        n = 0
        for r in read_rows(path):
            url = (r.get("source_url") or "").strip()
            key = (url, (r.get("name") or "").strip())
            if not url or key in seen:
                continue
            seen.add(key)
            r = {k: (r.get(k) or "").strip() for k in HEADER}
            if not r["id"].startswith(path.stem):
                r["id"] = f"{path.stem}-{r['id']}"
            rows.append(r)
            n += 1
        print(f"{path.name}: {n} rows", file=sys.stderr)
    with open(master, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=HEADER)
        w.writeheader()
        w.writerows(rows)
    print(f"wrote {len(rows)} rows to {master}")


if __name__ == "__main__":
    main()
