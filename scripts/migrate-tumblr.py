#!/usr/bin/env python3
"""
Tumblr HTML export -> Astro MDX migration for dmgerbino.com

Input:  the extracted Tumblr export (posts/html/*.html + media/)
Output: src/content/writing/*.mdx, public/media/*, redirects for vercel.json,
        and a human-review report (migration-report.md).

Tumblr's post URLs match on ID only (the slug is decorative), so redirects
use /post/{id}/:slug* wildcards -- old slugs are not needed.
"""

import json
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path

from bs4 import BeautifulSoup
from markdownify import markdownify
from slugify import slugify

EXPORT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/home/claude/tumblr-export")
SITE = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("/home/claude/dmgerbino")
OUT_CONTENT = SITE / "src/content/writing"
OUT_MEDIA = SITE / "public/media"
POSTS = EXPORT / "posts/html"

DEAD_HOSTS = ("draftin.com",)  # services that no longer exist


def parse_timestamp(text: str) -> datetime:
    # e.g. "May 11th, 2016 4:54am"
    clean = re.sub(r"(\d+)(st|nd|rd|th)", r"\1", text.strip())
    return datetime.strptime(clean, "%B %d, %Y %I:%M%p")


def mdx_escape(md: str) -> str:
    """Escape characters that MDX would interpret as JSX."""
    md = md.replace("{", "\\{").replace("}", "\\}")
    md = re.sub(r"<!--.*?-->", "", md, flags=re.S)
    md = re.sub(r"<(https?://[^>\s]+)>", r"\1", md)  # autolinks -> bare URLs
    md = md.replace("<", "\\<")  # no intentional HTML survives markdownify
    return md


def extract(post_path: Path):
    html = post_path.read_text(encoding="utf-8", errors="replace")
    soup = BeautifulSoup(html, "html.parser")
    body = soup.body
    warnings = []

    # --- footer metadata ---
    footer = body.find(id="footer")
    ts = parse_timestamp(footer.find(id="timestamp").get_text())
    tags = [t.get_text(strip=True) for t in footer.find_all(class_="tag")]
    footer.decompose()

    # --- audio embeds -> plain links (players are long dead) ---
    for emb in body.find_all("embed"):
        src = emb.get("src", "")
        link = soup.new_tag("a", href=src)
        link.string = f"Audio: {src}"
        emb.replace_with(link)
        warnings.append(f"audio embed converted to link ({src})")

    # --- images: local media rewritten, dead hosts flagged ---
    for img in body.find_all("img"):
        src = img.get("src", "")
        if "media/" in src and "://" not in src:
            img["src"] = "/media/" + src.split("media/")[-1]
        elif any(h in src for h in DEAD_HOSTS):
            warnings.append(f"DEAD IMAGE (host shut down): {src[:80]}...")
        elif src.startswith("http"):
            warnings.append(f"remote image, verify still live: {src[:100]}")

    # --- title heuristics by post shape ---
    title, title_el = None, None
    h = body.find(["h1", "h2"])
    if h and h.get_text(strip=True):
        title, title_el = h.get_text(" ", strip=True), h
    else:
        first_a = body.find("a")
        text_len = len(body.get_text(strip=True))
        if first_a and first_a.get_text(strip=True) and text_len < 600:
            title = first_a.get_text(" ", strip=True)  # link/quote-style post
    if not title:
        text = body.get_text(" ", strip=True)
        title = (text[:80].rsplit(" ", 1)[0] + "…") if len(text) > 80 else text
    if title_el is not None:
        title_el.decompose()
    title = re.sub(r"\s+", " ", title).strip().rstrip(".")

    # --- body -> markdown ---
    md = markdownify(str(body), heading_style="ATX", strip=["style", "script"])
    md = re.sub(r"\n{3,}", "\n\n", md).strip()
    md = mdx_escape(md)

    # --- description: first substantive paragraph, <=155 chars ---
    desc = ""
    for para in body.find_all("p"):
        t = re.sub(r"\s+", " ", para.get_text(" ", strip=True))
        if len(t) > 40 and not t.lower().startswith("audio:"):
            desc = t
            break
    if not desc:
        t = re.sub(r"\s+", " ", body.get_text(" ", strip=True))
        desc = re.sub(r"(?i)^audio:\s*\S+\s*", "", t) or title
    if len(desc) > 155:
        desc = desc[:155].rsplit(" ", 1)[0].rstrip(",;:") + "…"

    return {
        "id": post_path.stem,
        "title": title,
        "description": desc,
        "date": ts,
        "tags": tags,
        "markdown": md,
        "warnings": warnings,
    }


def frontmatter(p, slug):
    def q(s):
        return "'" + s.replace("'", "''") + "'"

    lines = [
        "---",
        f"title: {q(p['title'])}",
        f"description: {q(p['description'])}",
        f"pubDate: {p['date'].strftime('%Y-%m-%d')}",
    ]
    if p["tags"]:
        lines.append("tags:")
        lines += [f"  - {q(t)}" for t in p["tags"]]
    lines += [f"tumblrId: {q(p['id'])}", "draft: false", "---", ""]
    return "\n".join(lines)


def main():
    OUT_CONTENT.mkdir(parents=True, exist_ok=True)
    posts = sorted(
        (extract(f) for f in POSTS.glob("*.html")), key=lambda p: p["date"]
    )

    # unique slugs
    seen = {}
    for p in posts:
        s = slugify(p["title"], max_length=70, word_boundary=True, save_order=True) or f"post-{p['id']}"
        if s in seen:
            s = f"{s}-{p['id'][-4:]}"
        seen[s] = True
        p["slug"] = s

    redirects, report = [], ["# Tumblr migration report", ""]
    for p in posts:
        (OUT_CONTENT / f"{p['slug']}.mdx").write_text(
            frontmatter(p, p["slug"]) + "\n" + p["markdown"] + "\n", encoding="utf-8"
        )
        for src in (f"/post/{p['id']}", f"/post/{p['id']}/:slug*"):
            redirects.append(
                {"source": src, "destination": f"/writing/{p['slug']}", "permanent": True}
            )
        report.append(f"## {p['date'].date()} — {p['title']}")
        report.append(f"- slug: `/writing/{p['slug']}`  (tumblr id {p['id']})")
        report.append(f"- tags: {', '.join(p['tags']) or '(none)'}")
        for w in p["warnings"]:
            report.append(f"- ⚠️  {w}")
        report.append("")

    # media
    media_src = EXPORT / "media"
    if media_src.exists():
        OUT_MEDIA.mkdir(parents=True, exist_ok=True)
        for f in media_src.iterdir():
            shutil.copy2(f, OUT_MEDIA / f.name)

    # merge redirects into vercel.json
    vj_path = SITE / "vercel.json"
    vj = json.loads(vj_path.read_text())
    existing = {(r["source"]) for r in vj.get("redirects", [])}
    vj["redirects"] = vj.get("redirects", []) + [
        r for r in redirects if r["source"] not in existing
    ]
    vj_path.write_text(json.dumps(vj, indent=2) + "\n")

    (SITE / "migration-report.md").write_text("\n".join(report), encoding="utf-8")
    print(f"migrated {len(posts)} posts, {len(redirects)} redirects, "
          f"{sum(len(p['warnings']) for p in posts)} warnings")


if __name__ == "__main__":
    main()
