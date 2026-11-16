---
type: Slice Design Sheet
title: "Swiss politics launcher"
eyebrow: "Boussole citoyenne (civic-compass) · slice design sheet"
description: "A static launcher for Swiss politics: the next ballot, the parties from left to right, decision aids and official sites, fed by a sourced JSON referential. One slice covers the whole site: 9 screens, no HTTP API, 8 modules, 5 data files."
tags: [slice-design, civic-compass]
timestamp: 2026-11-16T20:00:00Z
status: draft
owner: Victor Hueni
last_reviewed: 2026-11-16
review_interval: 30d
---

# Swiss politics launcher: slice design sheet

The architectural view of one vertical slice, in four layers from the outside in: screens, API and contracts, code organisation, database. It is read before the slice's plan or tickets are cut, and they cite this folder by its path.

**Specification:** [PRD-0001: Swiss politics launcher](../../../product-specs/prds/prd-0001-swiss-politics-launcher.md)

**Authority.** This sheet follows the specification. When the two differ, the specification decides and the sheet is corrected.

## What is in this folder

| File | What it is |
|---|---|
| `README.md` | This file. Its frontmatter gives the page its title (`title`), its lead (`description`) and the line above the title (`eyebrow`). |
| `header.html`, `footer.html` | The labels under the lead, and the foot of the page. |
| `screens.html`, `api.html`, `code.html`, `database.html` | The content of one tab each. |
| `*.puml`, `_theme.puml`, `_palette.puml`, `render.sh` | The UML diagram sources and their PlantUML render pipeline (pinned `plantuml/plantuml:1.2026.2`, Docker). |
| `capture-screens.ts` | Captures the screens of the built site at phone width into `views/ui-*.svg`, light and dark frame. |
| `views/`, `views/dark/` | The rendered figures, light and dark. Committed. |
| `out/` | The built page and its verdict. Generated, ignored by git. |

The screens are screenshots of the real site, not wireframes: the site already exists, and PlantUML's wireframe syntax (salt) ignores the theme palette, so its dark variant would be unreadable. The site has a light theme only, so the screenshot is the same in both variants; only its frame changes.

## Rebuild

```bash
# 0. The screens (needs Chromium): build the site at the repository root, then capture
npm run build
node docs/plans/active/swiss-politics-launcher/capture-screens.ts

# 1. The UML diagrams, light and dark (needs Docker), from this folder
./render.sh

# 2. The page, then its verdict; <com-artefact-viz> is the folder of that skill
python3 <com-artefact-viz>/scripts/render.py --kind slice-design --slice . --out out/swiss-politics-launcher.html
python3 <com-artefact-viz>/scripts/shared/check_render.py --record out/swiss-politics-launcher.html.verdict.txt out/swiss-politics-launcher.html
```

The build is done when `out/swiss-politics-launcher.html.verdict.txt` opens with `PASS: no findings`.

**Published page:** https://claude.ai/artifact/Vn8oXEHZVTgLLxi3iAMoS1 (private)
