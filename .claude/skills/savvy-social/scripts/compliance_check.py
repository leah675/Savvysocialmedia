#!/usr/bin/env python3
"""Savvy Financial post checker.

Flags house-style and compliance red flags in a draft post and lists the
disclosures the topic likely needs. It's a safety net for the writer, not a
compliance approval: the firm's compliance team has the final say.

Usage:
    python3 compliance_check.py draft.md
    echo "caption text" | python3 compliance_check.py -
    python3 compliance_check.py draft.md --caption-only   # check just the "## Caption" section

Exit code is 1 when any BLOCKER is found, else 0.
"""

import argparse
import re
import sys

# (pattern, message, severity). Severity: BLOCKER must be fixed; REVIEW needs a human look.
RED_FLAGS = [
    (r"\bguarantee(d|s)?\b", "'guarantee' language: only for contractual insurance guarantees, with disclosure #4", "REVIEW"),
    (r"\brisk[- ]free\b", "'risk-free' is promissory. Use 'designed to' / 'can reduce'", "BLOCKER"),
    (r"\b(loophole|secret|hack|trick)s?\b", "'loophole/secret/hack/trick' suggests something improper. Use strategy, provision, rule", "REVIEW"),
    (r"\bfree money\b", "'free money' is misleading shorthand. Name it (employer match, deduction)", "BLOCKER"),
    (r"\b(beat|outperform)(s|ing)? the market\b", "performance claim", "BLOCKER"),
    (r"\boutperform", "performance claim", "REVIEW"),
    (r"\b(best|top|#1|number one)\b", "possible superlative you can't back up", "REVIEW"),
    (r"\bthe only way\b", "superlative", "BLOCKER"),
    (r"\b(never|can't|cannot|won't) lose\b", "promissory", "BLOCKER"),
    (r"\byou will (retire|be rich|get rich|save|make|never)\b", "promissory 'you will'", "BLOCKER"),
    (r"\b(get rich|retire early|millionaire by)\b", "outcome promise", "BLOCKER"),
    (r"\bsafe\b(?! deposit| harbor)", "'safe' can imply no risk. Consider 'designed to reduce risk'", "REVIEW"),
    (r"\balways\b", "'always' can be promissory. Check context", "REVIEW"),
    (r"\btax[- ]free\b(?![^.\n]{0,60}(when|if|qualified|rules|conditions|requirements))",
     "'tax-free' on its own. Add 'when rules are met' / 'qualified withdrawals'", "REVIEW"),
    (r"\b(my|our) clients? (saved|earned|made|got|achieved|said|love)", "testimonial/performance language", "BLOCKER"),
    (r"\b(i|we) helped (a|one|my|our) client", "client story: needs compliance approval before drafting", "BLOCKER"),
    (r"\bclient (story|stories|win|wins|result|results|testimonial|review)s?\b", "client results/testimonials need compliance approval", "REVIEW"),
    (r"\beveryone should\b", "suitability varies. Use 'many people may want to consider'", "BLOCKER"),
    (r"\byou should (buy|sell|invest|convert|roll|open|move|cancel|claim|withdraw)\b", "individualized advice. Teach the question instead", "BLOCKER"),
    (r"\b(act now|last chance|before it's too late|don't miss out|limited time)\b", "pressure tactic. Cite a real deadline calmly if there is one", "BLOCKER"),
    (r"\byou'?re (behind|making a (huge )?mistake|bad with money)\b", "fear/shame language (brand rule)", "REVIEW"),
    (r"\byou'?ll never retire\b", "fear language (brand rule)", "BLOCKER"),
    (r"\$[A-Z]{1,5}\b", "looks like a ticker symbol", "BLOCKER"),
    (r"\b(bitcoin|ethereum|btc|eth|solana|dogecoin)\b", "specific digital asset named", "BLOCKER"),
    (r"\bsave \$[\d,]+(k)? (in|on) taxes\b", "tax savings stated as fact. Label as hypothetical", "BLOCKER"),
    (r"\b\d{1,2}(\.\d+)?% (return|returns|growth|a year|per year|annually)\b",
     "return assumption: must be labeled hypothetical with assumptions", "REVIEW"),
    (r"\b(vote|election|democrat|republican|trump|harris|biden)\b", "political content. Keep neutral", "REVIEW"),
]

STYLE_FLAGS = [
    ("—", "em dash (—). House style: use a period, comma, colon, or line break", "BLOCKER"),
    ("–", "en dash (–). Prefer 'to' in ranges or a hyphen", "REVIEW"),
    ("~", "tilde (~). House style bans tildes", "BLOCKER"),
]

# topic keyword patterns -> disclosure number(s) from references/compliance.md
DISCLOSURE_TRIGGERS = [
    ("1 (tax/education)", r"\b(tax|taxes|deduct|deduction|roth|ira|401\(?k\)?|hsa|529|s ?corp|depreciation|rmds?|qcds?|capital gains|charit|irs|augusta|1099|w-2|bracket|estimated tax)"),
    ("2 (hypothetical numbers)", r"(\$\s?\d|\d+\s?%|\bhypothetical\b|\boption a\b|\bexample\b)"),
    ("3 (investing risk)", r"\b(invest|investing|investment|portfolio|market|stocks?|bonds?|allocation|diversif|returns?|cash drag|sequence[- ]of[- ]returns|buffer asset|rsus?|espp|equity comp)"),
    ("4 (insurance guarantees)", r"\b(life insurance|annuit|long[- ]term care|\bltc\b|disability|rider|policy|premium|coverage|umbrella)"),
    ("5 (alternatives/digital)", r"\b(alternative|real estate invest|rental|private (equity|credit|investment)|digital asset|crypto|cost segregation|1031)"),
    ("attorney line (estate/legal)", r"\b(will|wills|trust|trusts|estate|power of attorney|\bpoa\b|beneficiar|guardian|special needs|able account|healthcare directive|probate)\b"),
]

HAS_DISCLOSURE = [
    r"educational purposes only",
    r"not individualized financial",
    r"do(es)? not provide tax",
    r"hypothetical example",
    r"possible loss of principal",
    r"claims-paying ability",
]


def extract_section(text, heading):
    m = re.search(rf"^##\s+{re.escape(heading)}\s*$(.*?)(?=^##\s|\Z)", text, re.M | re.S | re.I)
    return m.group(1).strip() if m else None


def strip_meta_sections(text):
    """Drop the sections that discuss compliance (so the checker doesn't flag its own notes)."""
    for h in ["Compliance notes", "Facts to verify before submitting", "Pre-post checklist",
              "Disclosures attached", "Story map", "Visual direction"]:
        text = re.sub(rf"^##\s+{re.escape(h)}\s*$.*?(?=^##\s|\Z)", "", text, flags=re.M | re.S | re.I)
    return text


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("path", help="draft file, or - for stdin")
    ap.add_argument("--caption-only", action="store_true")
    args = ap.parse_args()

    raw = sys.stdin.read() if args.path == "-" else open(args.path, encoding="utf-8").read()
    caption = extract_section(raw, "Caption")
    body = caption if (args.caption_only and caption) else strip_meta_sections(raw)
    low = body.lower()

    findings = []
    for line_no, line in enumerate(body.splitlines(), 1):
        ll = line.lower()
        for pat, msg, sev in RED_FLAGS:
            for m in re.finditer(pat, ll, re.I):
                # Skip disclosure boilerplate ("Guarantees are based on the claims-paying ability...")
                if "claims-paying" in ll or "does not guarantee" in ll:
                    continue
                findings.append((sev, line_no, m.group(0), msg))
        for ch, msg, sev in STYLE_FLAGS:
            if ch in line:
                findings.append((sev, line_no, ch, msg))
        for m in re.finditer(r"(?<![\w&])#[A-Za-z][\w]*", line):
            findings.append(("BLOCKER", line_no, m.group(0), "hashtag (house style: no hashtags)"))

    print("SAVVY POST CHECK")
    print("=" * 60)
    if findings:
        for sev, ln, hit, msg in sorted(findings, key=lambda f: (f[0] != "BLOCKER", f[1])):
            print(f"[{sev}] line {ln}: '{hit}' -> {msg}")
    else:
        print("No red-flag words or style issues found.")

    if caption:
        n = len(caption)
        status = "OK" if n <= 2200 else "OVER LIMIT"
        print(f"\nCaption length: {n} / 2,200 characters ({status})")
        first = caption.strip().splitlines()[0] if caption.strip() else ""
        if len(first) > 125:
            print(f"  Note: first line is {len(first)} chars; Instagram shows ~125 before 'more'.")
        if n > 2200:
            findings.append(("BLOCKER", 0, "caption", "over 2,200 characters"))
        if not any(re.search(p, caption, re.I) for p in HAS_DISCLOSURE):
            print("  [REVIEW] No short-form disclosure detected in the caption.")

    needed = [name for name, pat in DISCLOSURE_TRIGGERS if re.search(pat, low, re.I)]
    print("\nDisclosures this topic likely needs (see references/compliance.md):")
    if needed:
        for n in needed:
            print(f"  - {n}")
    else:
        print("  - None detected (pure mindset?). If posted from a Savvy account it still goes to compliance.")
    print("  - Full firm disclosure (#6) reachable from profile / link in bio / newsletter footer")

    if re.search(r"\$\s?\d|\d+\s?%", body) and "hypothetical" not in low:
        print("\n[REVIEW] Numbers found but the word 'hypothetical' isn't. Label examples and list assumptions,")
        print("         or cite the official source for rules and limits.")

    blockers = sum(1 for f in findings if f[0] == "BLOCKER")
    reviews = sum(1 for f in findings if f[0] == "REVIEW")
    print("\n" + "=" * 60)
    print(f"{blockers} blocker(s), {reviews} item(s) to review. Compliance has the final say.")
    sys.exit(1 if blockers else 0)


if __name__ == "__main__":
    main()
