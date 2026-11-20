#!/usr/bin/env python3
"""Inventory the preserved published site without executing its HTML or scripts."""

import argparse
from collections import Counter
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import subprocess
from urllib.parse import unquote, urljoin, urlsplit

ROOT = Path(__file__).resolve().parent.parent
BASE = "archive/pre-redesign-2026-10-22"
ORIGIN = "https://moldach.github.io"
OUTPUT = ROOT / "docs/migration"
TEMPLATES = {"blog-with-jupyter", "getting-started", "writing-technical-content"}
DOWNLOADS = {".pdf", ".zip", ".csv", ".rmd", ".ipynb", ".pptx", ".docx", ".r", ".txt"}


def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()


def route_for(path):
    if path == "index.html":
        return "/"
    if path.endswith("/index.html"):
        return "/" + path.removesuffix("index.html")
    return "/" + path


def destination_for(route):
    special = {"/": "/", "/home/": "/", "/en/": "/", "/post/": "/writing/",
               "/project/": "/work/", "/authors/admin/": "/about/"}
    if route in special:
        return special[route], "rewrite"
    parts = route.strip("/").split("/")
    if len(parts) == 2 and parts[0] == "post" and parts[1] not in TEMPLATES:
        return f"/writing/{parts[1]}/", "migrate-writing"
    if len(parts) == 2 and parts[0] == "project":
        return f"/work/{parts[1]}/", "migrate-project-review"
    if route.startswith("/slides/") or route.startswith("/files/"):
        return route, "retain-download-or-slides"
    if route == "/404.html":
        return route, "replace-error-page"
    return "/archive" + route, "retain-archive"


class PublishedHTML(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.meta = {}
        self.canonical = None
        self.refs = set()
        self.title = []
        self.heading = []
        self.in_title = False
        self.in_h1 = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "meta":
            key = attrs.get("property", attrs.get("name", ""))
            if key:
                self.meta[key] = attrs.get("content", "")
        if tag == "link" and "canonical" in attrs.get("rel", "").split():
            self.canonical = attrs.get("href")
        for key in ("href", "src", "poster"):
            if attrs.get(key):
                self.refs.add(attrs[key])
        # Responsive image candidates use ordinary URL + width/density descriptors.
        for item in attrs.get("srcset", "").split(","):
            if item.strip():
                self.refs.add(item.strip().split()[0])
        if tag == "title":
            self.in_title = True
        if tag == "h1":
            self.in_h1 = True

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        if tag == "h1":
            self.in_h1 = False

    def handle_data(self, data):
        if self.in_title:
            self.title.append(data)
        if self.in_h1:
            self.heading.append(data)


def resolve_local(reference, page_route, files):
    """Resolve browser paths; never fetch third-party resources during inventory."""
    if reference.startswith(("#", "mailto:", "tel:", "data:", "javascript:")):
        return None
    parsed = urlsplit(urljoin(ORIGIN + page_route, reference))
    if parsed.hostname not in {"moldach.github.io", "moldach.github.com"}:
        return None
    path = unquote(parsed.path).lstrip("/")
    for candidate in (path, path.rstrip("/") + "/index.html" if path else "index.html"):
        if candidate in files:
            return candidate
    return "MISSING:" + ("/" + path)


def inventory():
    paths = [p for p in git("ls-tree", "-rz", "--name-only", BASE).split("\0") if p]
    files = set(paths)
    pages = []
    referrers = {}
    missing = {}
    for path in paths:
        if not path.endswith(".html"):
            continue
        parser = PublishedHTML()
        parser.feed((ROOT / path).read_text(errors="replace"))
        route = route_for(path)
        target, action = destination_for(route)
        local = set()
        external = set()
        for ref in sorted(parser.refs):
            resolved = resolve_local(ref, route, files)
            if resolved and resolved.startswith("MISSING:"):
                missing.setdefault(resolved.removeprefix("MISSING:"), set()).add(route)
            elif resolved:
                local.add(resolved)
                referrers.setdefault(resolved, set()).add(route)
            elif ref.startswith(("https://", "http://", "//")):
                external.add(ref)
        pages.append({
            "sourcePath": path, "oldRoute": route, "destination": target,
            "disposition": action, "migrationState": "not-implemented",
            "title": " ".join("".join(parser.title).split()),
            "heading": " ".join("".join(parser.heading).split()),
            "publishedAt": parser.meta.get("article:published_time"),
            "modifiedAt": parser.meta.get("article:modified_time"),
            "description": parser.meta.get("description"),
            "originalCanonical": parser.canonical,
            "localReferences": sorted(local), "externalReferences": sorted(external),
            "editorialReviewRequired": True,
        })
    assets = []
    for path in paths:
        if path.endswith(".html"):
            continue
        data = (ROOT / path).read_bytes()
        assets.append({
            "sourcePath": path, "oldRoute": "/" + path, "destination": "/" + path,
            "disposition": "retain-at-original-path", "bytes": len(data),
            "sha256": hashlib.sha256(data).hexdigest(),
            "isDownload": Path(path).suffix.lower() in DOWNLOADS,
            "referencedBy": sorted(referrers.get(path, set())),
        })
    search = json.loads((ROOT / "index.json").read_text())
    search_items = search if isinstance(search, list) else search.get("items", [])
    summary = {
        "sourceRepository": "https://github.com/moldach/moldach.github.com",
        "sourceRevision": git("rev-parse", BASE + "^{commit}"),
        "preservationTag": BASE,
        "trackedFiles": len(paths), "htmlPages": len(pages), "assetsAndSupportFiles": len(assets),
        "posts": sum(len(p["oldRoute"].strip("/").split("/")) == 2 and p["oldRoute"].startswith("/post/") for p in pages),
        "projects": sum(p["disposition"] == "migrate-project-review" for p in pages),
        "downloads": sum(a["isDownload"] for a in assets),
        "dispositions": dict(sorted(Counter(p["disposition"] for p in pages).items())),
        "searchRecords": len(search_items),
        "searchPostRecords": [p.get("relpermalink") for p in search_items if str(p.get("relpermalink", "")).startswith("/post/")],
        "placeholderCanonicalPages": sum("example.com" in (p["originalCanonical"] or "") for p in pages),
        "missingLocalTargets": len(missing),
    }
    return {"source": summary, "pages": pages, "assets": assets,
            "existingMissingLocalTargets": [{"target": p, "referencedBy": sorted(refs)} for p, refs in sorted(missing.items())]}


def render_report(data):
    s = data["source"]
    lines = ["# Published-site migration inventory", "", f"Source revision: `{s['sourceRevision']}`.",
             f"Preserved locally as `{BASE}`. Regenerate with `python3 tool/inventory_legacy.py`.", "",
             "## Coverage", "", f"- {s['trackedFiles']} tracked files: {s['htmlPages']} HTML pages and {s['assetsAndSupportFiles']} assets/support files.",
             f"- {s['posts']} post pages, {s['projects']} project pages, {s['downloads']} downloadable files.",
             f"- {s['searchRecords']} generated search records, including only {len(s['searchPostRecords'])} post records.",
             f"- {s['placeholderCanonicalPages']} pages have an example.com canonical URL.",
             f"- {s['missingLocalTargets']} distinct local targets were already missing from the published source.", "",
             "The JSON manifest records every page, proposed destination, metadata, local/external references, every asset's SHA-256 and size, and pre-existing broken local references. References in HTML attributes are covered; CSS URLs and dynamically constructed script URLs still need runtime checking.", "",
             "## Migration policy", "", "Destinations are assigned, not deployed. Every page remains marked not-implemented and requires editorial review. Post dates are preserved, not replaced with the migration date. Template posts and supporting pages remain in an archive, outside primary writing. Historical project entries require review before becoming public case studies. Slides, downloads, and supporting assets retain their original paths. Duplicate destinations are intentional only for old landing-page aliases.", "",
             "The archive is a preservation decision, not permission to republish third-party assets without their original attribution and terms. Do not copy legacy scripts into the modern app without review. Do not forward the old host before verifying the new destination.", "",
             "## Posts and projects", "", "| Existing route | Published | Destination | Disposition |", "| --- | --- | --- | --- |"]
    for p in data["pages"]:
        if p["sourcePath"].startswith(("post/", "project/")):
            lines.append(f"| `{p['oldRoute']}` | {p['publishedAt'] or 'Not supplied'} | `{p['destination']}` | {p['disposition']} |")
    lines += ["", "## Known legacy defects", "", "- The homepage's recent-post widget and search index omit newer posts. The original blogdown configuration is absent; its exact filtering/sorting cause remains unproven.",
              "- Placeholder canonical domains must not be carried into the rebuilt site.",
              "- Missing targets listed in the manifest predate this rebuild; resolve individually rather than asserting they were preserved.", "",
              "## Remaining validation", "", "- Recover and review article bodies, code, equations, captions, and attribution.",
              "- Verify new destinations and each retained download against this manifest at build/cutover.",
              "- Inspect externally hosted media and presentations in a browser; this inventory makes no external availability claim.", ""]
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Fail if checked-in inventory is stale")
    args = parser.parse_args()
    data = inventory()
    outputs = {"inventory.json": json.dumps(data, indent=2, ensure_ascii=False) + "\n",
               "README.md": render_report(data)}
    if args.check:
        stale = [name for name, text in outputs.items() if not (OUTPUT / name).exists() or (OUTPUT / name).read_text() != text]
        if stale:
            raise SystemExit("Stale inventory: " + ", ".join(stale))
    else:
        OUTPUT.mkdir(parents=True, exist_ok=True)
        for name, text in outputs.items():
            (OUTPUT / name).write_text(text)
    print(json.dumps(data["source"], indent=2))


if __name__ == "__main__":
    main()
