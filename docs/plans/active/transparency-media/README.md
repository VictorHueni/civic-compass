---
type: Slice Design Sheet
title: "Media ownership (Transparence)"
eyebrow: "Boussole citoyenne (civic-compass) · slice design sheet"
description: "A new Transparence area whose Médias page shows, for the media of French-speaking Switzerland, who publishes each title, who owns the publisher, as a list, a network and a sunburst, and the fög index of ballot coverage, from one hand-kept data file checked by npm run check. 7 screens, no HTTP API, 11 new or changed modules, 2 data files."
tags: [slice-design, civic-compass, media, transparency]
timestamp: 2026-11-18T09:00:00Z
status: draft
owner: Victor Hueni
last_reviewed: 2026-11-18
review_interval: 30d
---

# Media ownership (Transparence): slice design sheet

The architectural view of one vertical slice, in four layers from the outside in: screens, API and contracts, code organisation, database. It is read before the slice's plan or tickets are cut, and they cite this folder by its path.

**Specification:** [PRD-0001: Swiss politics launcher](../../../product-specs/prds/prd-0001-swiss-politics-launcher.md), stories US-20 to US-25, with [Research-0003](../../../architecture/research/0003-media-ownership-and-leaning-sources.md) and its owner rulings.

**Authority.** This sheet follows the specification. When the two differ, the specification decides and the sheet is corrected.

## What is in this folder

| File | What it is |
|---|---|
| `README.md` | This file. Its frontmatter gives the page its title (`title`), its lead (`description`) and the line above the title (`eyebrow`). |
| `header.html`, `footer.html` | The labels under the lead, and the foot of the page. |
| `screens.html`, `api.html`, `code.html`, `database.html` | The content of one tab each. |
| `*.puml`, `_theme.puml`, `_palette.puml`, `render.sh` | The UML diagram sources and their PlantUML render pipeline (pinned `plantuml/plantuml:1.2026.2`, Docker), copied from `../swiss-politics-launcher/`. |
| `capture-screens.ts` | Captures the screens of the built site (`dist/`, opened from disk) at phone width into `views/ui-*.svg`, light and dark frame. |
| `views/`, `views/dark/` | The rendered figures, light and dark. Committed. |
| `out/` | The built page and its verdict. Generated, ignored by git. |

The screens are screenshots of the built site, with the checked data of `data/media.json`; they follow the owner-approved mockup v3, whose sources stay outside git. The fög box of ui-05 comes with US-22: capture again once it is built.

## Rebuild

```bash
# 0. The screens (needs Chromium, no network), from the repository root
npm run build
node docs/plans/active/transparency-media/capture-screens.ts [<site folder>]

# 1. The UML diagrams, light and dark (needs Docker), from this folder
./render.sh

# 2. The page, then its verdict; <com-artefact-viz> is the folder of that skill
python3 <com-artefact-viz>/scripts/render.py --kind slice-design --slice . --out out/transparency-media.html
python3 <com-artefact-viz>/scripts/shared/check_render.py --record out/transparency-media.html.verdict.txt out/transparency-media.html
```

The build is done when `out/transparency-media.html.verdict.txt` opens with `PASS: no findings`.

**Published page:** https://claude.ai/artifact/KZs83Kw4soJazTrUPeZCXJ (private)
