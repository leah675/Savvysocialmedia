# Visuals: Spec Format and Design Rules

Every post ships with rendered images. `scripts/render_visuals.mjs` turns a `visuals.json` into PNGs using the Savvy brand system from the kits.

```bash
node <skill-dir>/scripts/render_visuals.mjs path/to/post-folder/visuals.json [outDir]
```

Output goes to `visuals/` next to the JSON unless you pass `outDir`. Requires Node with Playwright (preinstalled in Claude Code cloud sessions; locally, `npm i -g playwright && npx playwright install chromium`).

## What gets rendered

| Spec key | File(s) | Size |
|---|---|---|
| `slides` | `slide-01.png` … | 1080 × 1350 portrait (or `"size": "square"` for 1080 × 1080) |
| `linkedin: true` | `linkedin-cover.png` (slide 1 re-laid out) | 1200 × 1200 |
| `story` | `story-01.png` … (alternating navy and cream; text kept out of the top and bottom 250 px) | 1080 × 1920 |
| `reelCover` | `reel-cover.png` | 1080 × 1920 |
| `endcard` | `reel-endcard.png` (monogram, sign-off, on-screen disclosure; hold at least 3 seconds) | 1080 × 1920 |
| `banner` | `newsletter-banner.png` (hook + series name; never the whole carousel) | 1800 × 720 |

## Spec format

```json
{
  "series": "playbook | wealthcode | general",
  "size": "portrait | square",
  "linkedin": true,
  "slides": [
    {"layout": "cover", "icon": "calendar", "title": "Medicare has more than [[one]] window.", "body": "Optional subline."},
    {"layout": "text", "kicker": "Small caps label", "title": "Headline", "body": "Supporting copy."},
    {"layout": "statement", "title": "One big line, centered energy.", "icon": "shield"},
    {"layout": "quote", "kicker": "Optional label", "lines": ["\"Inner dialogue line.\"", "\"Another.\""]},
    {"layout": "list", "title": "Ask before you retire:", "items": ["Question one?", "Question two?"], "body": "Optional line under the list."},
    {"layout": "signoff", "title": "Takeaway line with the [[key word]].", "body": "Optional.", "footnote": "Short disclosure."}
  ],
  "story": [ {"layout": "statement", "kicker": "True or false?", "title": "…", "footnote": "Disclosure on the link frame."} ],
  "reelCover": {"icon": "calendar", "title": "Hook with [[accent]]"},
  "endcard": {"title": "Short closing line.", "disclosure": "Disclosure text from the library."},
  "banner": {"icon": "calendar", "title": "Newsletter hook", "body": "Preview line."}
}
```

**Optional per-slide keys:** `bg` (`navy`, `cream`, `creamdark`), `size` (headline px), `itemSize` (list px), `footnote` (small text bottom left), `photo` (path to an image, relative to the JSON; adds a navy gradient overlay so text stays readable), `hideLabel`.

**Markup in any text:** `[[word]]` makes the accent word (gold italic serif in the Playbook, gold bold caps in Wealth Code). `\n` is a line break. Straight quotes and apostrophes are converted to curly ones, and hyphenated words never split across lines.

## Icons (one metaphor per post)

`calendar`, `folder`, `shield`, `house`, `heart`, `umbrella`, `clock`, `key`, `door`, `mirror`, `checklist`, `family`, `table`, `hourglass`, `scale`, `buckets`, `sunrise`

Suggested pairings: retirement dates and Medicare → calendar · documents and accounts → folder · protection and insurance → shield or umbrella · home equity → house · tax buckets → buckets · environment and "choose your table" → table or door · identity → mirror · starting over → sunrise · time and buying back time → clock or hourglass · tradeoffs → scale.

## Design rules (from the kits)

- **Palette:** navy `#1B1E4B` and gold `#C9A961` are the base of every piece, with cream `#FAF7F0` for breathing room. Sage and terra are only for gains/losses in data.
- **Playbook:** calm, editorial, left-aligned; alternates navy and cream slides; accent word in gold italic.
- **Wealth Code:** bold and cinematic; deep navy with a soft center glow; centered caps serif headlines; one gold CAPS word per slide; inner dialogue in serif italic.
- **Logo:** gold SF monogram bottom right on every slide. One logo per piece. Never recolor or stretch it.
- **Never** print week numbers or "Vol." on artwork.
- **One idea per slide.** If the renderer warns it shrank the text, split the slide or cut words.
- **Disclosures:** the last carousel slide carries a short footnote; the reel end card carries the on-screen disclosure; the caption carries the full short-form disclosure.
- **No real clients** in images. Composite or generated people are never presented as clients.

## Photos

The kits call for Leah's portraits (Playbook covers) and dramatic editorial photography (Wealth Code). The renderer works without photos, using the gold line-icon metaphor. When a photo is available, save it in `brand/photos/` and add `"photo": "../../../brand/photos/<file>.jpg"` to the cover slide (path relative to the visuals.json), then re-render. Keep Leah's full head and hair in frame; the overlay sits on the lower half where the text is.

## Assets

- `assets/sf-monogram-gold.png`: gold SF monogram on transparent background, extracted from the kit logo
- `assets/savvy-logo-full.png`: full logo with tagline, transparent background (for light backgrounds)
- `assets/fonts/`: Playfair Display (SIL Open Font License) and Carlito (SIL Open Font License, metric-compatible with Calibri)
