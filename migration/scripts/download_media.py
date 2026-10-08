#!/usr/bin/env python3
"""Download the original Wix Media Manager images listed in a manifest CSV.

usage: download_media.py <manifest.csv> <dest dir>

Images are public at https://static.wixstatic.com/media/<file id> (byte-identical to the upload).
Videos and documents are not on that host; they are fetched separately through the Wix API.
Resumable: files already present with the manifest's byte size are skipped.
"""
import csv, pathlib, sys, time, urllib.request

manifest, dest_root = sys.argv[1], pathlib.Path(sys.argv[2]).expanduser()
rows = [r for r in csv.DictReader(open(manifest, encoding="utf-8")) if r["type"] == "IMAGE"]
done = skipped = 0
failed = []
differs = []
differs_file = dest_root / "size-differs.csv"
known_differs = {l.split(",")[0] for l in differs_file.read_text().splitlines()} if differs_file.exists() else set()
for r in rows:
    folder = dest_root / r["folder"].replace("(root)", "root")
    folder.mkdir(parents=True, exist_ok=True)
    dest = folder / f'{r["id"].split("~")[0]}__{r["name"].replace("/", "_")}'
    if dest.exists() and (dest.stat().st_size == int(r["bytes"]) or r["id"] in known_differs):
        skipped += 1
        continue
    url = "https://static.wixstatic.com/media/" + r["id"]
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=120) as resp:
                data = resp.read()
            if len(data) != int(r["bytes"]) and attempt < 1:
                raise ValueError("size mismatch, retrying once")
            dest.write_bytes(data)
            done += 1
            if len(data) != int(r["bytes"]):
                # HEIC uploads: the manifest holds the HEIC size, Wix only serves its PNG conversion.
                differs.append((r["id"], r["name"], r["bytes"], len(data)))
            break
        except Exception as e:
            if attempt == 2:
                failed.append((r["id"], str(e)))
            time.sleep(2 * (attempt + 1))
    time.sleep(0.2)
    if (done + skipped) % 50 == 0:
        print(f"{done + skipped}/{len(rows)}", flush=True)

print(f"downloaded {done}, already present {skipped}, failed {len(failed)} of {len(rows)}")
if differs:
    with open(differs_file, "a") as o:
        for d in differs:
            o.write(",".join(map(str, d)) + "\n")
    print(f"{len(differs)} saved with a size different from the manifest (see size-differs.csv)")
for f in failed:
    print("FAILED", *f)
