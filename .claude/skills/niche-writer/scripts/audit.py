"""
Niche entry audit.

Reads a niche markdown file (path argument or stdin) and reports whether it
meets the BohdiAI niche-writing rules. Exits 0 on pass, 1 on fail.

Output is a JSON report on stdout:

    {
      "pass": false,
      "issues": [
        {"severity": "error", "rule": "missing_section", "detail": "Section 'Adjacent niches' is missing"},
        ...
      ]
    }

Run:
    python audit.py path/to/niche.md
    cat niche.md | python audit.py
"""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass, field
from typing import Iterable


# ---------- Rules ---------------------------------------------------------

REQUIRED_FRONTMATTER_FIELDS = {
    "slug",
    "display_name",
    "tenant_type_fit",
    "status",
}

VALID_TENANT_TYPES = {"seller", "doer"}
VALID_STATUSES = {"draft", "in_review", "approved", "retired"}

EXPECTED_SECTIONS_IN_ORDER = [
    "What this business does",
    "Brand exemplars across the range",
    "Who their customers are",
    "How they talk about their products",
    "Common specializations and variations",
    "What customers ask before buying",
    "Visual direction range",
    "What tends to surface on the storefront",
    "What to avoid",
    "Adjacent niches",
]

# Forbidden sentence patterns. Each entry is a regex matched case-insensitively
# against the entire body text. The intent is to catch monolithic
# generalizations — sentences that flatten the category into a single profile.
FORBIDDEN_SENTENCE_PATTERNS = [
    (
        r"\bmost\s+(?:\w+\s+)?(?:makers|sellers|buyers|customers|brands|shops|stores)\s+(?:are|tend\s+to|do|have|use|prefer)\b",
        "monolithic_makers_buyers_claim",
        "Sentence flattens the category — 'most makers/buyers...'. Rewrite as a range or as plural archetypes.",
    ),
    (
        r"\bthe\s+typical\s+(?:\w+\s+)?(?:maker|seller|buyer|customer|shop|brand)\b",
        "typical_archetype_claim",
        "Sentence asserts a single typical profile. Rewrite as plural archetypes or remove.",
    ),
    (
        r"\bsuccessful\s+(?:\w+\s+)?(?:brands|shops|makers|sellers)\s+all\b",
        "all_successful_claim",
        "Sentence asserts all successful brands share a trait. Rewrite as a range or remove.",
    ),
    (
        r"\bthe\s+(?:genre|category|market)\s+has\s+converged\s+on\b",
        "convergence_claim",
        "Sentence claims category convergence on a single aesthetic. Replace with a range description.",
    ),
    (
        r"\b(?:every|all)\s+(?:successful|top|leading)\s+(?:brand|shop|maker)s?\s+(?:does|do|has|have|use|uses)\b",
        "every_top_brand_claim",
        "Sentence makes a universal claim about top brands. Rewrite as a range.",
    ),
]

# Words that signal visual direction is being framed as a range and that the
# mood pick overrides niche-level tendencies. The Visual direction range
# section should contain at least one phrase from each group.
VISUAL_RANGE_SIGNALS = [
    r"\brange\s+of\s+(?:visual\s+)?sensibilities\b",
    r"\bwide\s+range\b",
    r"\bspans?\s+(?:from|across)\b",
    r"\bdirections?\s+observed\b",
]

VISUAL_OVERRIDE_SIGNALS = [
    r"\bmood\s+pick\b.*\b(?:overrides?|chooses?|narrows?|drives?)\b",
    r"\binspiration\s+url",
    r"\btenant'?s?\s+(?:own\s+)?(?:assets|inspiration|references)\b",
]

MIN_BRAND_EXEMPLAR_BULLETS = 3
MIN_SECTION_WORDS = 40


# ---------- Report shape --------------------------------------------------

@dataclass
class Issue:
    severity: str  # "error" or "warning"
    rule: str
    detail: str


@dataclass
class Report:
    issues: list[Issue] = field(default_factory=list)

    @property
    def passed(self) -> bool:
        return not any(i.severity == "error" for i in self.issues)

    def error(self, rule: str, detail: str) -> None:
        self.issues.append(Issue("error", rule, detail))

    def warning(self, rule: str, detail: str) -> None:
        self.issues.append(Issue("warning", rule, detail))

    def to_json(self) -> str:
        return json.dumps(
            {
                "pass": self.passed,
                "issues": [
                    {"severity": i.severity, "rule": i.rule, "detail": i.detail}
                    for i in self.issues
                ],
            },
            indent=2,
        )


# ---------- Frontmatter parsing ------------------------------------------

def split_frontmatter(text: str) -> tuple[dict[str, object], str] | tuple[None, str]:
    """Returns (frontmatter_dict, body) or (None, text) if no frontmatter."""
    if not text.startswith("---"):
        return None, text
    end_match = re.search(r"\n---\s*\n", text)
    if not end_match:
        return None, text
    raw = text[3:end_match.start()].strip()
    body = text[end_match.end():]
    return parse_simple_yaml(raw), body


def parse_simple_yaml(raw: str) -> dict[str, object]:
    """
    Minimal YAML parser for the limited shapes niche frontmatter uses:
    scalar values, inline arrays `[a, b]`, and dash-prefixed lists under a key.
    """
    result: dict[str, object] = {}
    current_key: str | None = None
    current_list: list[str] | None = None

    for raw_line in raw.splitlines():
        line = raw_line.rstrip()
        if not line or line.lstrip().startswith("#"):
            continue

        if line.startswith("  -") or line.startswith("\t-"):
            if current_list is None or current_key is None:
                continue  # malformed, skip
            current_list.append(line.lstrip("- \t").strip())
            continue

        # Top-level key
        if ":" in line:
            # Commit any in-progress list
            if current_key is not None and current_list is not None:
                result[current_key] = current_list
                current_list = None

            key, _, value = line.partition(":")
            key = key.strip()
            value = value.strip()

            if not value:
                # List follows on subsequent lines
                current_key = key
                current_list = []
            elif value.startswith("[") and value.endswith("]"):
                inner = value[1:-1].strip()
                items = [
                    p.strip().strip('"').strip("'")
                    for p in inner.split(",")
                    if p.strip()
                ]
                result[key] = items
                current_key = None
                current_list = None
            else:
                result[key] = value.strip('"').strip("'")
                current_key = None
                current_list = None

    if current_key is not None and current_list is not None:
        result[current_key] = current_list

    return result


# ---------- Section parsing -----------------------------------------------

def parse_sections(body: str) -> list[tuple[str, str]]:
    """Returns ordered list of (heading, body) pairs for level-2 headings."""
    sections: list[tuple[str, str]] = []
    current_heading: str | None = None
    current_lines: list[str] = []

    for line in body.splitlines():
        match = re.match(r"^##\s+(.+?)\s*$", line)
        if match:
            if current_heading is not None:
                sections.append((current_heading, "\n".join(current_lines).strip()))
            current_heading = match.group(1).strip()
            current_lines = []
        else:
            if current_heading is not None:
                current_lines.append(line)

    if current_heading is not None:
        sections.append((current_heading, "\n".join(current_lines).strip()))

    return sections


# ---------- Checks --------------------------------------------------------

def check_frontmatter(fm: dict[str, object] | None, report: Report) -> None:
    if fm is None:
        report.error(
            "missing_frontmatter",
            "File has no YAML frontmatter block. Expected --- delimited block at top.",
        )
        return

    missing = REQUIRED_FRONTMATTER_FIELDS - fm.keys()
    if missing:
        report.error(
            "missing_frontmatter_field",
            f"Frontmatter is missing required field(s): {sorted(missing)}",
        )

    slug = fm.get("slug")
    if isinstance(slug, str):
        if not re.match(r"^[a-z][a-z0-9_]*$", slug):
            report.error(
                "invalid_slug",
                f"Slug '{slug}' must be lowercase alphanumeric with underscores, starting with a letter.",
            )

    tenant_type_fit = fm.get("tenant_type_fit")
    if isinstance(tenant_type_fit, list):
        bad = [v for v in tenant_type_fit if v not in VALID_TENANT_TYPES]
        if bad:
            report.error(
                "invalid_tenant_type_fit",
                f"tenant_type_fit contains invalid value(s) {bad}. Must be 'seller' and/or 'doer'.",
            )
        if not tenant_type_fit:
            report.error(
                "empty_tenant_type_fit",
                "tenant_type_fit must contain at least one of 'seller' or 'doer'.",
            )
    elif tenant_type_fit is not None:
        report.error(
            "malformed_tenant_type_fit",
            "tenant_type_fit must be an array like [seller] or [seller, doer].",
        )

    status = fm.get("status")
    if isinstance(status, str) and status not in VALID_STATUSES:
        report.error(
            "invalid_status",
            f"status '{status}' must be one of {sorted(VALID_STATUSES)}.",
        )
    if status == "approved":
        report.warning(
            "premature_approval",
            "status is 'approved'. New niche entries should be written as 'draft'; approval is a human step.",
        )


def check_sections_present_and_ordered(sections: list[tuple[str, str]], report: Report) -> None:
    headings = [h for h, _ in sections]
    found_set = set(headings)
    expected_set = set(EXPECTED_SECTIONS_IN_ORDER)

    missing = [s for s in EXPECTED_SECTIONS_IN_ORDER if s not in found_set]
    for s in missing:
        report.error("missing_section", f"Section '{s}' is missing.")

    unexpected = [h for h in headings if h not in expected_set]
    for h in unexpected:
        report.warning(
            "unexpected_section",
            f"Section '{h}' is not in the template. Either rename to a template section or remove.",
        )

    # Check ordering of the sections that are present
    present_in_order = [h for h in headings if h in expected_set]
    expected_order_of_present = [s for s in EXPECTED_SECTIONS_IN_ORDER if s in found_set]
    if present_in_order != expected_order_of_present:
        report.error(
            "section_order",
            "Template sections are out of order. Expected order: "
            + ", ".join(EXPECTED_SECTIONS_IN_ORDER),
        )


def check_section_lengths(sections: list[tuple[str, str]], report: Report) -> None:
    for heading, body in sections:
        if heading not in EXPECTED_SECTIONS_IN_ORDER:
            continue
        word_count = len(body.split())
        if word_count < MIN_SECTION_WORDS:
            report.error(
                "stub_section",
                f"Section '{heading}' has only {word_count} words. Each section should be substantively written ({MIN_SECTION_WORDS}+ words).",
            )


def check_bias_patterns(body: str, report: Report) -> None:
    for pattern, rule, detail in FORBIDDEN_SENTENCE_PATTERNS:
        matches = list(re.finditer(pattern, body, re.IGNORECASE))
        for match in matches:
            # Extract the sentence containing the match for context.
            start = body.rfind(".", 0, match.start()) + 1
            end_period = body.find(".", match.end())
            end = end_period if end_period != -1 else min(len(body), match.end() + 80)
            snippet = body[start:end].strip()
            if len(snippet) > 200:
                snippet = snippet[:200] + "..."
            report.error(
                rule,
                f"{detail} Offending sentence: \"{snippet}\"",
            )


def check_brand_exemplars(sections: dict[str, str], report: Report) -> None:
    section_body = sections.get("Brand exemplars across the range")
    if section_body is None:
        return  # already flagged by missing_section

    # Count bolded markers like "**Brand Name**" or bullet-prefixed entries.
    bold_entries = re.findall(r"\*\*[^\*\n]+\*\*", section_body)
    bullet_entries = re.findall(r"(?m)^\s*[-*]\s+\*\*", section_body)
    exemplar_count = max(len(bold_entries), len(bullet_entries))

    if exemplar_count < MIN_BRAND_EXEMPLAR_BULLETS:
        report.error(
            "insufficient_brand_exemplars",
            f"Brand exemplars section has {exemplar_count} exemplar(s). Need at least {MIN_BRAND_EXEMPLAR_BULLETS} spanning different positionings.",
        )


def check_visual_direction_framing(sections: dict[str, str], report: Report) -> None:
    section_body = sections.get("Visual direction range")
    if section_body is None:
        return

    has_range = any(
        re.search(p, section_body, re.IGNORECASE) for p in VISUAL_RANGE_SIGNALS
    )
    if not has_range:
        report.error(
            "visual_range_missing",
            "Visual direction range section must explicitly frame the category as a range of sensibilities (e.g., 'range of visual sensibilities', 'wide range', 'directions observed').",
        )

    has_override = any(
        re.search(p, section_body, re.IGNORECASE | re.DOTALL) for p in VISUAL_OVERRIDE_SIGNALS
    )
    if not has_override:
        report.error(
            "visual_override_missing",
            "Visual direction range section must acknowledge that the mood pick (and/or inspiration URLs and tenant's own assets) overrides any niche-level tendency.",
        )


# ---------- Main ----------------------------------------------------------

def audit(text: str) -> Report:
    report = Report()

    fm, body = split_frontmatter(text)
    check_frontmatter(fm, report)

    sections = parse_sections(body)
    check_sections_present_and_ordered(sections, report)
    check_section_lengths(sections, report)
    check_bias_patterns(body, report)

    sections_by_heading = {h: b for h, b in sections}
    check_brand_exemplars(sections_by_heading, report)
    check_visual_direction_framing(sections_by_heading, report)

    return report


def read_input() -> str:
    if len(sys.argv) > 1:
        path = sys.argv[1]
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    return sys.stdin.read()


def main() -> int:
    text = read_input()
    report = audit(text)
    print(report.to_json())
    return 0 if report.passed else 1


if __name__ == "__main__":
    sys.exit(main())
