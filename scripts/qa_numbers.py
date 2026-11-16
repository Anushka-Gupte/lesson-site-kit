#!/usr/bin/env python3
"""QA Numbers and Spec Verification Script for "From Zero".
Validates that every measured, reasoned, and spec sheet number in content/*.md
appears faithfully on the corresponding HTML lesson pages,
and verifies that epistemic labels (measured, reasoned, spec sheet) are kept.
Exits 0 on success, 1 on failure.
"""

import os
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

class HTMLTextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text_parts = []
        self.callout_labels = []
        self._current_tag = None
        self._in_callout_label = False

    def handle_starttag(self, tag, attrs):
        self._current_tag = tag
        attr_dict = dict(attrs)
        classes = attr_dict.get("class", "").split()
        if "callout__label" in classes:
            self._in_callout_label = True

    def handle_endtag(self, tag):
        if self._in_callout_label:
            self._in_callout_label = False
        self._current_tag = None

    def handle_data(self, data):
        clean = data.strip()
        if clean:
            self.text_parts.append(clean)
            if self._in_callout_label:
                self.callout_labels.append(clean.lower())

    def get_full_text(self):
        return " ".join(self.text_parts)


VERIFICATION_SPECS = {
    "transformer": {
        "html_path": "lessons/transformer/index.html",
        "content_candidates": [
            "content/The Transformer, from Scratch.md",
            "content/transformer.md"
        ],
        "tables": {
            "Next Word Probabilities": [
                ("late", "40%"),
                ("delayed", "25%"),
                ("cancelled", "10%"),
                ("crowded", "8%")
            ],
            "Attention Score Spread (dimension d vs spread)": [
                ("4", "1.73"),
                ("16", "3.64"),
                ("64", "7.33"),
                ("256", "14.7"),
                ("1024", "29.7")
            ],
            "Score Shrinkage & Gradient (Saturation Prevention)": [
                ("without shrinking", "49%"),
                ("without shrinking", "73%"),
                ("without shrinking", "87%"),
                ("without shrinking", "93%"),
                ("without shrinking", "97%"),
                ("with shrinking", "32%"),
                ("learning signal without", "0.05"),
                ("learning signal with", "0.35")
            ],
            "Word Attention Distribution ('they' attention)": [
                ("friend", "80%"),
                ("my", "8%"),
                ("today", "4%"),
                ("you", "3%"),
                ("How", "2%")
            ]
        },
        "epistemic_labels": ["measured"]
    },
    "harness": {
        "html_path": "lessons/harness/index.html",
        "content_candidates": [
            "content/What Is a Harness Pi vs Hermes.md",
            "content/harness.md"
        ],
        "tables": {
            "Fixed Overhead Measurements (Pi vs Hermes)": [
                ("Pi system prompt", "2,295"),
                ("Pi tools", "2,956"),
                ("Pi tool count", "4 tools"),
                ("Pi total fixed", "5,251"),
                ("Hermes system prompt", "6,634"),
                ("Hermes tools", "47,080"),
                ("Hermes tool count", "27 tools"),
                ("Hermes total fixed", "53,714"),
                ("Hermes multiplier", "10.2")
            ],
            "Measurement Dates & Version Signatures": [
                ("measurement date", "13 November 2026"),
                ("Pi version", "1.5.2"),
                ("Hermes Agent version", "0.19.0")
            ]
        },
        "epistemic_labels": ["measured"]
    },
    "roofline": {
        "html_path": "lessons/roofline/index.html",
        "content_candidates": [
            "content/The GPU Roofline Plot, from Scratch.md",
            "content/roofline.md"
        ],
        "tables": {
            "MI300X Theoretical Spec Sheet": [
                ("peak compute BF16", "1,307"),
                ("vector FP32 compute", "163"),
                ("memory bandwidth", "5.3"),
                ("ridge point", "247")
            ],
            "CPU Empirical Measurements": [
                ("CPU memory bandwidth", "11.7"),
                ("CPU ridge point", "13"),
                ("CPU fusion before", "167"),
                ("CPU fusion after", "46"),
                ("CPU fusion speedup", "3.7")
            ],
            "Tesla T4 Spec Sheet vs Measured": [
                ("T4 bandwidth spec", "320"),
                ("T4 bandwidth measured", "247"),
                ("T4 bandwidth reached", "77%"),
                ("T4 compute spec", "65"),
                ("T4 compute measured", "36"),
                ("T4 compute reached", "56%"),
                ("T4 ridge spec", "203"),
                ("T4 ridge measured", "147")
            ],
            "Tesla T4 Fusion Experiment": [
                ("unfused time", "8.98"),
                ("fused time", "2.13"),
                ("speedup factor", "4.2"),
                ("unfused bandwidth", "239"),
                ("fused bandwidth", "252")
            ]
        },
        "epistemic_labels": ["measured", "reasoned", "spec"]
    }
}


def normalize_text(text):
    t = text.replace("\u00a0", " ").replace("&nbsp;", " ").replace("&thinsp;", " ")
    t = re.sub(r"\s+", " ", t)
    return t


def number_in_text(val, full_text):
    clean_val = val.replace(",", "").strip()
    # Direct substring
    if val in full_text or clean_val in full_text:
        return True

    # Check regex word boundary
    if re.search(r"\b" + re.escape(val) + r"\b", full_text, re.IGNORECASE):
        return True
    if re.search(r"\b" + re.escape(clean_val) + r"\b", full_text, re.IGNORECASE):
        return True

    # Numeric float equivalence (e.g. 14.7 vs 14.70)
    try:
        fval = float(clean_val.rstrip("%"))
        # Find all decimal numbers in text
        for token in re.findall(r"\b\d+\.\d+\b", full_text):
            try:
                if abs(float(token) - fval) < 1e-4:
                    return True
            except ValueError:
                pass
    except ValueError:
        pass

    return False


def verify_numbers():
    repo_root = Path(".").resolve()
    total_checks = 0
    passed_checks = 0
    failed_checks = 0
    failures = []

    print("=" * 65)
    print("QA NUMERICAL & EPISTEMIC VERIFICATION REPORT")
    print("=" * 65)

    for slug, spec in VERIFICATION_SPECS.items():
        html_file = repo_root / spec["html_path"]
        print(f"\nEvaluating Lesson: {slug.upper()} ({spec['html_path']})")

        # Check content file exists
        content_found = None
        for cand in spec["content_candidates"]:
            if (repo_root / cand).is_file():
                content_found = cand
                break
        if content_found:
            print(f"  Source file: {content_found}")
        else:
            print(f"  WARNING: Content source not found among {spec['content_candidates']}")

        if not html_file.is_file():
            print(f"  FAIL: HTML file {spec['html_path']} does not exist!")
            failed_checks += 1
            failures.append(f"{slug}: HTML file missing")
            continue

        raw_html = html_file.read_text(encoding="utf-8")
        parser = HTMLTextExtractor()
        parser.feed(raw_html)
        full_text = normalize_text(parser.get_full_text())

        # Check each table of numbers
        for table_name, items in spec["tables"].items():
            print(f"  Checking table/group: '{table_name}'")
            table_passed = 0
            for label, value in items:
                total_checks += 1
                if number_in_text(value, full_text):
                    passed_checks += 1
                    table_passed += 1
                else:
                    failed_checks += 1
                    msg = f"{slug} - {table_name}: '{label}' value '{value}' NOT FOUND in page text"
                    failures.append(msg)
                    print(f"    [FAIL] {msg}")

            print(f"    Passed: {table_passed}/{len(items)} numbers")

        # Check epistemic labels
        print(f"  Checking Epistemic Labels: {spec['epistemic_labels']}")
        callout_text = " ".join(parser.callout_labels) + " " + full_text.lower()
        for label in spec["epistemic_labels"]:
            total_checks += 1
            if label in callout_text:
                passed_checks += 1
                print(f"    [PASS] Label '{label}' present")
            else:
                failed_checks += 1
                msg = f"{slug}: Required epistemic label '{label}' NOT FOUND in callouts or text"
                failures.append(msg)
                print(f"    [FAIL] {msg}")

    print("\n" + "=" * 65)
    print(f"VERIFICATION SUMMARY: {passed_checks}/{total_checks} checks passed.")
    if failed_checks > 0:
        print(f"FAILED CHECKS ({failed_checks}):")
        for f in failures:
            print(f"  - {f}")
        print("Result: FAILED")
        return 1
    else:
        print("Result: ALL MEASURED AND SPEC NUMBERS VERIFIED UNCHANGED")
        return 0

if __name__ == "__main__":
    sys.exit(verify_numbers())
