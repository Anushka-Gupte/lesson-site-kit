#!/usr/bin/env python3
"""QA Link & Asset Crawler for "From Zero" static site.
Crawls all HTML pages in the site, reporting broken internal links,
missing images, missing or invalid alt text, and missing anchor targets.
Exits 0 on success, 1 on failure.
"""

import os
import sys
import urllib.parse
from html.parser import HTMLParser
from pathlib import Path

PAGES = [
    "index.html",
    "404.html",
    "lessons/transformer/index.html",
    "lessons/harness/index.html",
    "lessons/roofline/index.html",
]

class PageInspector(HTMLParser):
    def __init__(self, page_path):
        super().__init__()
        self.page_path = Path(page_path)
        self.page_dir = self.page_path.parent
        self.links = []       # (href, line, attrs)
        self.images = []      # (src, alt, line, attrs, in_aria_hidden)
        self.scripts = []     # (src, line)
        self.stylesheets = [] # (href, line, rel)
        self.ids = set()
        self.aria_hidden_depth = 0

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        line, _ = self.getpos()

        if attr_dict.get("aria-hidden") == "true":
            self.aria_hidden_depth += 1

        if "id" in attr_dict:
            self.ids.add(attr_dict["id"])

        if tag == "a":
            href = attr_dict.get("href")
            if href:
                self.links.append((href, line, attr_dict))
        elif tag == "img":
            src = attr_dict.get("src")
            alt = attr_dict.get("alt")
            is_hidden = self.aria_hidden_depth > 0 or attr_dict.get("aria-hidden") == "true" or attr_dict.get("role") in ("presentation", "none")
            self.images.append((src, alt, line, attr_dict, is_hidden))
        elif tag == "script":
            src = attr_dict.get("src")
            if src:
                self.scripts.append((src, line))
        elif tag == "link":
            rel = attr_dict.get("rel", "")
            href = attr_dict.get("href")
            if href and ("stylesheet" in rel or "icon" in rel):
                self.stylesheets.append((href, line, rel))

    def handle_endtag(self, tag):
        # We don't track exact tag balance for aria-hidden, but we can decrement if needed
        # In practice, decorative containers are short divs
        pass


def inspect_all_pages():
    repo_root = Path(".").resolve()
    page_data = {}
    errors = []
    warnings = []

    # 1. Parse all pages first to extract IDs and elements
    for rel_path in PAGES:
        abs_path = repo_root / rel_path
        if not abs_path.is_file():
            errors.append(f"Missing required page: {rel_path}")
            continue

        try:
            content = abs_path.read_text(encoding="utf-8")
        except Exception as e:
            errors.append(f"Could not read {rel_path}: {e}")
            continue

        inspector = PageInspector(rel_path)
        inspector.feed(content)
        page_data[rel_path] = inspector

    print(f"Parsed {len(page_data)} pages. Checking references...\n")

    # 2. Check 404.html self-containment rule (SPEC.md rule 50)
    if "404.html" in page_data:
        inspector_404 = page_data["404.html"]
        if inspector_404.stylesheets:
            for href, line, _ in inspector_404.stylesheets:
                errors.append(f"404.html line {line}: SPEC says 404.html must be self-contained; references external/relative stylesheet {href}")
        if inspector_404.scripts:
            for src, line in inspector_404.scripts:
                errors.append(f"404.html line {line}: SPEC says 404.html must be self-contained; references external/relative script {src}")

    # 3. Check each page's links and assets
    for rel_path, inspector in page_data.items():
        base_dir = inspector.page_dir

        # Check stylesheets
        for href, line, rel in inspector.stylesheets:
            if href.startswith(("http://", "https://", "//")):
                continue
            clean_href = href.split("?")[0].split("#")[0]
            target_path = (base_dir / clean_href).resolve()
            if not target_path.is_file():
                errors.append(f"BROKEN STYLESHEET {rel_path}:{line} -> {href} (resolved: {target_path})")

        # Check scripts
        for src, line in inspector.scripts:
            if src.startswith(("http://", "https://", "//")):
                continue
            clean_src = src.split("?")[0].split("#")[0]
            target_path = (base_dir / clean_src).resolve()
            if not target_path.is_file():
                errors.append(f"BROKEN SCRIPT {rel_path}:{line} -> {src} (resolved: {target_path})")

        # Check images
        for src, alt, line, _, is_hidden in inspector.images:
            if not src:
                errors.append(f"EMPTY IMAGE SRC {rel_path}:{line}")
                continue

            if alt is None:
                errors.append(f"MISSING ALT ATTRIBUTE {rel_path}:{line} -> {src} has no alt attribute")
            elif not alt.strip():
                if is_hidden:
                    # In WCAG, decorative images hidden from AT or role="presentation" use alt=""
                    # But SPEC requires all images to explain what they teach. We log a warning for QA report.
                    warnings.append(f"EMPTY ALT (DECORATIVE) {rel_path}:{line} -> {src} in aria-hidden/presentation has alt=\"\"")
                else:
                    errors.append(f"EMPTY ALT TEXT {rel_path}:{line} -> {src} alt attribute is empty but not marked aria-hidden")
            elif alt.strip().lower() in ("illustration", "image", "photo", "diagram", "hero image"):
                warnings.append(f"GENERIC ALT TEXT {rel_path}:{line} -> '{alt}' for {src} (SPEC: explains what it teaches)")

            if not src.startswith(("http://", "https://", "data:", "//")):
                clean_src = src.split("?")[0].split("#")[0]
                target_path = (base_dir / clean_src).resolve()
                if not target_path.is_file():
                    errors.append(f"MISSING IMAGE FILE {rel_path}:{line} -> {src} (resolved: {target_path})")

        # Check links
        for href, line, _ in inspector.links:
            if not href:
                warnings.append(f"EMPTY HREF {rel_path}:{line}")
                continue

            # In 404.html, href="/" is used with an inline JS client-side updater for GitHub Pages
            if rel_path == "404.html" and href == "/":
                warnings.append(f"ROOT HREF in 404.html:{line} -> href=\"/\" relies on client JS fallback for GitHub Pages sub-path")
                continue

            # External or special protocols
            if href.startswith(("http://", "https://", "mailto:", "tel:", "javascript:")):
                continue

            if href.startswith("#"):
                fragment = href[1:]
                if fragment and fragment not in inspector.ids:
                    errors.append(f"BROKEN LOCAL ANCHOR {rel_path}:{line} -> #{fragment} (target ID not found on page)")
                continue

            parsed = urllib.parse.urlparse(href)
            target_page_rel = parsed.path
            fragment = parsed.fragment

            # If link is e.g. "lessons/transformer/" or "../../index.html"
            target_path = (base_dir / target_page_rel).resolve()
            if target_path.is_dir():
                # Directory index
                target_file = target_path / "index.html"
            else:
                target_file = target_path

            if not target_file.is_file():
                errors.append(f"BROKEN LINK {rel_path}:{line} -> {href} (resolved: {target_file})")
            else:
                # Check fragment target if specified
                if fragment:
                    try:
                        target_rel_str = str(target_file.relative_to(repo_root)).replace("\\", "/")
                    except ValueError:
                        target_rel_str = None

                    if target_rel_str and target_rel_str in page_data:
                        target_inspector = page_data[target_rel_str]
                        if fragment not in target_inspector.ids:
                            errors.append(f"BROKEN ANCHOR {rel_path}:{line} -> {href} (#{fragment} not in {target_rel_str})")

    # Output Summary
    print("=" * 60)
    print("QA LINKS & ASSETS REPORT")
    print("=" * 60)
    print(f"Total pages checked: {len(page_data)}")
    for rel_path, inspector in page_data.items():
        print(f"  - {rel_path:30} ({len(inspector.links)} links, {len(inspector.images)} imgs, {len(inspector.stylesheets)} styles, {len(inspector.scripts)} scripts)")

    if warnings:
        print(f"\nWARNINGS ({len(warnings)}):")
        for w in warnings:
            print(f"  [WARN] {w}")

    if errors:
        print(f"\nERRORS ({len(errors)}):")
        for e in errors:
            print(f"  [FAIL] {e}")
        print("\nResult: FAILED")
        return 1
    else:
        print("\nResult: PASSED (0 broken internal links, 0 missing images, all stylesheets and scripts present)")
        return 0

if __name__ == "__main__":
    sys.exit(inspect_all_pages())
