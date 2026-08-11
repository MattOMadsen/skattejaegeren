#!/usr/bin/env python3
"""Scrape CISU grant listing: OpEn (+ keyword) details with amounts.
Usage: python3 scripts/scrape-cisu-open.py
Writes: data/cisu-index.json, data/cisu-open-grants.json
"""
import re, json, time, urllib.request
from pathlib import Path
from html import unescape

ROOT = Path(__file__).resolve().parents[1]
UA = {"User-Agent": "Mozilla/5.0 (compatible; SkattejaegerenResearch/1.0)"}


def fetch(url, timeout=30):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", errors="replace")


def main():
    print("Fetching CISU index…")
    html = fetch("https://cisu.dk/cisu-i-verden/bevillingsoversigt/")
    pairs = re.findall(
        r"\[#### ([^\n]+)\n\n([^\]]+)\]\(/cisu-i-verden/bevillingsoversigt/bevilling/\?id=([a-f0-9-]{36})",
        html,
    )
    print("pairs", len(pairs))
    keywords = re.compile(
        r"Ghana Venskab|Crossing Borders|Female Freedom|Colombia Solidaritet|"
        r"100% for Børnene|Barnevogn|Kaffestop|BIO RAP|Orangutang|Sex & Samfund|"
        r"Gender|LGBT|Climate Justice|#FOLLOWME|podcast",
        re.I,
    )
    open_grants, all_meta = [], []
    for title, pool, gid in pairs:
        rec = {
            "id": gid,
            "title": unescape(title).strip(),
            "pool": unescape(pool).strip(),
            "url": f"https://cisu.dk/cisu-i-verden/bevillingsoversigt/bevilling/?id={gid}",
        }
        all_meta.append(rec)
        if rec["pool"].startswith("OpEn") or keywords.search(rec["title"]):
            open_grants.append(rec)

    (ROOT / "data/cisu-index.json").write_text(
        json.dumps(
            {
                "updated": time.strftime("%Y-%m-%d"),
                "count": len(all_meta),
                "openCount": sum(1 for g in all_meta if g["pool"].startswith("OpEn")),
                "grants": all_meta,
            },
            ensure_ascii=False,
        )
    )

    # dedupe
    by_id = {g["id"]: g for g in open_grants}
    ids = list(by_id.values())
    print("fetching details", len(ids))

    def parse(page, meta):
        plain = unescape(re.sub(r"<script[^>]*>.*?</script>", " ", page, flags=re.S | re.I))
        plain = re.sub(r"<style[^>]*>.*?</style>", " ", plain, flags=re.S | re.I)
        plain = re.sub(r"<[^>]+>", "\n", plain)
        amounts = re.findall(r"([0-9]{1,3}(?:\.[0-9]{3})+|[0-9]+),-\s*DKK", plain)
        to_int = lambda s: int(s.replace(".", ""))
        amount = to_int(amounts[0]) if amounts else None
        budget = to_int(amounts[1]) if len(amounts) > 1 else None
        org = None
        m = re.search(
            r"medlemsorganisationer-danmarkskort/member/\?id=[a-f0-9-]+[^>]*>([^<]+)", page
        )
        if m:
            org = unescape(m.group(1)).strip()
        m = re.search(r"Projektperiode\s*\n+\s*([0-9.\s\-–]+)", plain)
        period = m.group(1).strip() if m else None
        m = re.search(r"Resume\s*\n+(.+?)(?:\n\s*Klosterport|\n\s*Kontakt|$)", plain, re.S | re.I)
        resume = re.sub(r"\s+", " ", m.group(1)).strip()[:700] if m else None
        return {
            **meta,
            "amountDkk": amount,
            "budgetDkk": budget,
            "org": org,
            "period": period,
            "resume": resume,
            "amountKind": "official" if amount is not None else "unknown",
        }

    results, errors = [], []
    for i, meta in enumerate(ids):
        try:
            results.append(parse(fetch(meta["url"]), meta))
            if (i + 1) % 20 == 0:
                print(f"  {i+1}/{len(ids)}")
            time.sleep(0.12)
        except Exception as e:
            errors.append({"id": meta["id"], "error": str(e)})

    results_amt = sorted(
        [g for g in results if g.get("amountDkk") is not None], key=lambda x: -x["amountDkk"]
    )
    out = {
        "updated": time.strftime("%Y-%m-%d"),
        "source": "https://cisu.dk/cisu-i-verden/bevillingsoversigt/",
        "fetched": len(results),
        "errors": len(errors),
        "countWithAmount": len(results_amt),
        "sumAmountDkk": sum(g["amountDkk"] for g in results_amt),
        "grants": results_amt + [g for g in results if g.get("amountDkk") is None],
        "errorDetails": errors[:30],
    }
    (ROOT / "data/cisu-open-grants.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=2)
    )
    print("DONE", out["countWithAmount"], "sum", out["sumAmountDkk"])


if __name__ == "__main__":
    main()
