#!/usr/bin/env python3
"""
ingest_post.py — post Higgsfield asset links + metadata to the library helper.

WHERE THIS RUNS: on Alex's machine, from the repo root — NOT inside a Cowork
session. Cowork sandboxes can't reach the dev server (localhost) or the public
internet, so the Cowork worker only *prepares* assets.json; this script does the
actual posting from a place that can reach the endpoint.

It reads LIBRARY_INGEST_URL and COWORK_INGEST_TOKEN from the environment, and if
they aren't set it auto-loads them from .env.local / .env next to this script.
If no URL is configured it defaults to the local dev server.

Matches Project-Docs/Cowork-Instructions.md and app/api/library/ingest/route.ts.
The endpoint downloads the file, uploads to the `library` bucket, builds the
filename + auto-increments the index, and inserts a row with approved=false.

Usage (run from the repo root):
  python ingest_post.py --selftest             # reachability + auth check, no insert
  python ingest_post.py --batch assets.json    # post every asset in the file

assets.json is a JSON array; each object needs:
  niche, kind, scene, sourceUrl, prompt, generator, width, height,
  durationMs (video only). width/height are REQUIRED by the endpoint.
"""
import argparse, json, os, sys, urllib.request, urllib.error
from pathlib import Path

DEFAULT_URL = "http://localhost:3000/api/library/ingest"
VALID_KINDS = {"hero_image", "product_image", "portrait_image", "hero_video"}


def load_env_files():
    """Populate os.environ from .env.local then .env (without overriding real env)."""
    here = Path(__file__).resolve().parent
    for name in (".env.local", ".env"):
        f = here / name
        if not f.exists():
            continue
        for line in f.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            k, v = k.strip(), v.strip().strip('"').strip("'")
            os.environ.setdefault(k, v)


load_env_files()
URL = (os.environ.get("LIBRARY_INGEST_URL") or DEFAULT_URL).rstrip("/")
TOKEN = os.environ.get("COWORK_INGEST_TOKEN", "")


def _post(payload: dict):
    if not TOKEN:
        sys.exit("COWORK_INGEST_TOKEN is not set (checked env, .env.local, .env)")
    req = urllib.request.Request(
        URL,
        data=json.dumps(payload).encode(),
        method="POST",
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {TOKEN}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()
    except urllib.error.URLError as e:
        sys.exit(f"NETWORK ERROR reaching {URL} -> {e}. "
                 "Is the dev server running, and are you on the machine that hosts it?")


def build_payload(a: dict) -> dict:
    if a.get("kind") not in VALID_KINDS:
        sys.exit(f"invalid kind {a.get('kind')!r}; must be one of {sorted(VALID_KINDS)}")
    for req_field in ("niche", "scene", "sourceUrl", "prompt", "generator", "width", "height"):
        if a.get(req_field) in (None, ""):
            sys.exit(f"asset {a.get('scene')!r}: missing required field {req_field!r} "
                     "(the endpoint rejects assets without width/height)")
    p = {
        "nicheSlug": a["niche"],
        "kind": a["kind"],
        "scene": a["scene"],
        "sourceUrl": a["sourceUrl"],
        "prompt": a["prompt"],
        "generator": a["generator"],
        "width": int(a["width"]),
        "height": int(a["height"]),
    }
    if a.get("durationMs"):
        p["durationMs"] = int(a["durationMs"])
    return p


def explain(code: int) -> str:
    return {200: "OK", 201: "created",
            400: "malformed payload",
            401: "bad bearer token (client/server COWORK_INGEST_TOKEN mismatch)",
            502: "endpoint could not fetch sourceUrl — retry with a fresh generation",
            503: "server has no COWORK_INGEST_TOKEN set — configure the dev server"
            }.get(code, "unexpected status")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--selftest", action="store_true")
    p.add_argument("--batch")
    args = p.parse_args()

    print(f"endpoint: {URL}")

    if args.selftest:
        # Empty body after auth: 400 => reachable AND authed (good); 401 => token mismatch;
        # 503 => server token unset; network error => can't reach the server from here.
        code, body = _post({})
        verdict = {400: "reachable + authed", 401: "token mismatch",
                   503: "server token not set"}.get(code, "check response")
        print(f"selftest -> HTTP {code} ({explain(code)}) :: {verdict}\n{body[:300]}")
        sys.exit(0 if code == 400 else 1)

    if args.batch:
        items = json.load(open(args.batch))
        ok = 0
        results = []
        for a in items:
            code, body = _post(build_payload(a))
            tag = f"{a.get('niche')}/{a.get('kind')}/{a.get('scene')}"
            print(f"{tag}: HTTP {code} ({explain(code)})")
            results.append({"asset": tag, "http": code, "resp": body[:300]})
            if code < 400:
                ok += 1
        json.dump(results, open("ingest_results.json", "w"), indent=2)
        print(f"\n{ok}/{len(items)} posted. Details in ingest_results.json")
        sys.exit(0 if ok == len(items) else 1)

    sys.exit("nothing to do; pass --selftest or --batch assets.json")


if __name__ == "__main__":
    main()
