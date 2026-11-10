---
name: AsingAsing
description: Japanese-inspired thermal receipt and proportional bill-splitting midnight ledger
colors:
  primary: "#F5EFE6"
  primary-hover: "#E6DDD0"
  neutral-bg: "#121110"
  neutral-surface: "#1C1A17"
  neutral-muted: "#171513"
  neutral-hover: "#26231F"
  neutral-text: "#F5EFE6"
  neutral-secondary: "#A89F91"
  neutral-tertiary: "#7D7569"
  border-crease: "#2E2A24"
  border-strong: "#3D372F"
  accent-hanko: "#E05353"
  accent-hanko-hover: "#FF6B6B"
  accent-matcha: "#2ECC71"
  accent-matcha-hover: "#34D399"
  highlight-chamois: "#D4A373"
  avatar-blue: "#2563EB"
  avatar-emerald: "#059669"
  avatar-amber: "#D97706"
  avatar-violet: "#7C3AED"
  avatar-orange: "#EA580C"
  avatar-teal: "#0D9488"
  avatar-red: "#DC2626"
  avatar-indigo: "#4F46E5"
  avatar-cyan: "#0891B2"
  avatar-purple: "#9333EA"
  avatar-green: "#16A34A"
  avatar-terracotta: "#C2410C"
  avatar-magenta: "#DB2777"
  avatar-goldenrod: "#CA8A04"
  avatar-sky: "#0284C7"
  avatar-slate: "#475569"
typography:
  display:
    fontFamily: "var(--font-serif), Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "var(--font-serif), Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "var(--font-sans), -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "var(--font-sans), -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "var(--font-mono), monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    letterSpacing: "0.08em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.neutral-secondary}"
    rounded: "{rounded.md}"
    padding: "6px 10px"
---

# Design System: AsingAsing (The Midnight Ledger)

## Overview

**Creative North Star: "The Midnight Ledger" (Binchōtan Charcoal Slate & Phosphor Print)**

AsingAsing evokes the quiet precision and tactile intimacy of a Japanese izakaya receipt slip examined under late-night restaurant illumination. It is grounded in the tradition of paying separately (*asing-asing*), transforming the friction of bill calculation into a composed, tangible ritual. 

Rather than adopting cold corporate SaaS darkness (pitch OLED black `#000000` or sterile neon cyber-blue), "The Midnight Ledger" is grounded in artisanal **Binchōtan charcoal soot** (`#121110`), warm slate receipt cards (`#1C1A17`), and bone-parchment ink (`#F5EFE6`). Delicate tactile creases (`#2E2A24`) demarcate stages, while vermilion hanko stamps (`#E05353`) and matcha green audit seals (`#2ECC71`) provide unmistakable semantic feedback.

The density is calibrated for hurried tabletop ergonomics on mobile viewports. Financial calculations adhere to ledger rigor: monospace tabular figures guarantee numbers align down columns, while progressive disclosure keeps the interface uncluttered yet capable.

**Key Characteristics:**
- **Warm Binchōtan Materiality:** Deep charcoal soot ground (`#121110`) paired with tactile slate cards (`#1C1A17`) and recessed wells (`#171513`). Never cold blue-gray or pitch pitch-black.
- **Bone Parchment Ink:** Crisp high-contrast off-white (`#F5EFE6`, >= 14:1 contrast ratio) ensuring high legibility in dim dining ambient light.
- **Hanko & Matcha Seals:** Vermilion cinder (`#E05353`) for alerts and unassigned items; matcha green (`#2ECC71`) for balanced cent-closure verification.
- **Strictly Flat Physicality:** Spatial hierarchy is established through 1px crisp crease borders (`#2E2A24`) and subtle surface shifts, never muddy diffuse drop-shadows.
- **Physical Print Preservation:** While the screen experience is deeply dark, the `@media print` engine preserves pure white paper (`#FFFFFF`) and sumi charcoal ink (`#1C1917`) to prevent toner waste on real printers.

---

## Colors

The palette draws from traditional Japanese stationer and charcoal ledger materials: Binchōtan oak charcoal, warm aged bone parchment, cinnabar hanko ink, and ceremonial matcha seal lacquer.

### Primary (Action & Foreground)
- **Bone Parchment** (`#F5EFE6`): Primary action buttons, active navigation markers, high-contrast headings, and primary monetary values.
- **Parchment Hover** (`#E6DDD0`): Hover state for primary buttons and high-contrast interactions.

### Neutral (Surfaces & Typography)
- **Charcoal Soot Base** (`#121110`): Global screen canvas, outer wrapper background, and print inverted base.
- **Binchōtan Slate Card** (`#1C1A17`): Elevated surface cards, line-item table shells, modals, and summary containers (Sheet Level 1).
- **Recessed Well / Tray** (`#171513`): Secondary controls, input wells, step navigation progress trays, and loupe canvas (Sheet Level 2).
- **Active Surface Hover** (`#26231F`): Interactive hover fill on dark cards, buttons, and participant chips.
- **Parchment White Text** (`#F5EFE6`): Primary body text, dish titles, and monetary numbers (>= 14:1 contrast).
- **Sandstone Muted** (`#A89F91`): Secondary labels, participant subtotals, and inactive icons (>= 6:1 contrast).
- **Warm Graphite** (`#7D7569`): Explanatory captions, step subtitles, unit price currency symbols, and disabled elements (>= 4.5:1 contrast).

### Creases & Dividers
- **Perforated Crease** (`#2E2A24`): Standard 1px divider lines, component borders, and card outlines.
- **Strong Border** (`#3D372F`): Input borders, active focus indicators, and secondary button boundaries.

### Semantic Accents (Hanko & Matcha)
- **Hanko Vermilion** (`#E05353`, hover `#FF6B6B`): Discrepancy warnings, unassigned diner badges, destructive actions, and discount indicators.
- **Matcha Seal** (`#2ECC71`, hover `#34D399`): Exact mathematical balance confirmation, completed step indicators, and copy success feedback.
- **Chamois Highlight** (`#D4A373`): Recommended badge indicator, AI scan highlights, and active focus underlays.

### Categorical Avatars
A vibrant, high-contrast palette calibrated for legibility against `#1C1A17` dark slate:
- Blue (`#2563EB`), Emerald (`#059669`), Amber (`#D97706`), Violet (`#7C3AED`), Orange (`#EA580C`), Teal (`#0D9488`), Red (`#DC2626`), Indigo (`#4F46E5`), Cyan (`#0891B2`), Purple (`#9333EA`), Green (`#16A34A`), Terracotta (`#C2410C`), Magenta (`#DB2777`), Goldenrod (`#CA8A04`), Sky (`#0284C7`), Slate (`#475569`).

### Named Rules
1. **The Hanko Stamp Rule.** Vermilion (`#E05353`) and Matcha (`#2ECC71`) are reserved strictly for mathematical verification, discrepancies, and reconciliation stamps. They never appear as decorative flourishes.
2. **The Charcoal Warmth Rule.** All dark surfaces must stay within the warm umber/charcoal spectrum (`#121110`, `#1C1A17`, `#171513`). Never introduce cool bluish slates (`#0f172a`, `#1e293b`) or stark uncolored black (`#000000`).
3. **The Print Paper Rule.** When printing or exporting to PDF (`@media print`), all dark backgrounds flip to pure white paper (`#FFFFFF`) with rich black ink (`#1C1917`) to save ink and ensure standard thermal slip aesthetics.

---

## Typography

**Display Font:** Editorial Serif (`var(--font-serif)`, Newsreader / Georgia, serif)  
**Body Font:** Modern Sans (`var(--font-sans)`, Geist Sans, -apple-system, sans-serif)  
**Label/Mono Font:** Precise Ledger Mono (`var(--font-mono)`, Geist Mono, monospace)

### Hierarchy
- **Display** (bold 700, 1.5rem–1.875rem / 24–30px, line-height 1.2): Masthead brand mark "AsingAsing" and primary view headers.
- **Headline** (bold 700, 1.25rem–1.5rem / 20–24px, line-height 1.3): Major step section headers and modal titles.
- **Title** (semibold 600, 1rem / 16px, line-height 1.4): Card group headings and participant summary headers.
- **Body** (regular 400, 0.875rem / 14px, line-height 1.5): Standard explanatory text, item descriptions, and user notes.
- **Label / Tabular** (bold 700 or medium 500, 0.75rem / 12px, letter-spacing 0.08em): Monospace line totals, currency labels, stamp badges, and status pills.

### Named Rules
**The Tabular Numerals Rule.** Every monetary value, unit price, quantity, tax percentage, and cent calculation must be rendered with `.tabular-numbers` and monospace figures to guarantee clean vertical column alignment.

---

## Elevation & Depth

AsingAsing adheres to a tactile paper-and-slate surface model. Depth is established purely through tonal contrast and crisp 1px crease borders, simulating dark paper sheets resting upon a dark desk.

### Surface Vocabulary
- **Canvas Base:** Charcoal Soot (`#121110`) ground floor.
- **Sheet Level 1:** Binchōtan Slate Card (`#1C1A17`) with a 1px Perforated Crease border (`#2E2A24`).
- **Sheet Level 2 (Recessed):** Recessed Well (`#171513`) for secondary controls, input wells, and preview canvases.
- **Active / Pressed Feedback:** Physical scale-down (`active:scale-98` / `active:scale-95`) rather than floating shadow lifts.

### Named Rules
**The Strictly Flat Rule.** No ambient blur shadows, fuzzy drop-shadows, or skeuomorphic gradients are permitted on cards or panels. All structural separation is achieved with 1px `#2E2A24` borders and `#121110` / `#1C1A17` surface shifts. Faint structural 2xs shadows (`shadow-2xs`) are tolerated only on elevated floating select dropdowns.

---

## Components

### Buttons
- **Primary Action:** Bone Parchment background (`#F5EFE6`), dark ink text (`#121110`), 12px radius (`rounded-xl`), 12px 16px padding (`py-3 px-4`), semibold 14px type. State transitions use warm beige hover (`#E6DDD0`) and physical press (`active:scale-98`).
- **Secondary / Ghost:** Binchōtan Slate (`#1C1A17`) or transparent background with 1px border (`#3D372F`), parchment text (`#F5EFE6`), subtle `#26231F` hover fill.
- **Icon Actions:** Compact 28px–32px square or circular targets with clean Lucide SVG icons (14px–16px).

### Cards & Paper Containers
- **Background:** Binchōtan Slate (`#1C1A17`) on top of Charcoal Soot (`#121110`).
- **Border:** 1px `#2E2A24` with 12px–16px corners (`rounded-xl` or `rounded-2xl`).
- **Padding:** 16px (`p-4`) on mobile, expanding to 20px–24px (`p-5` or `p-6`) on desktop.

### Inputs & Editable Fields
- **Background:** Recessed Well (`#171513`) at rest, transitioning to Dark Charcoal (`#121110`) on focus.
- **Border:** 1px `#3D372F` stroke shifting to 1px Bone Parchment (`#F5EFE6`) on focus.
- **Typography:** Tabular monospace (`font-mono`) for monetary inputs, sans-serif for item names.

### Participant Badges & Selection Matrix
- **Diner Avatars:** 28px–32px circular pills with curated high-contrast avatar hues and crisp initial letters.
- **Tagging Matrix:** Click/tap toggles diner assignment; assigned items show filled badges with `#F5EFE6` checkmarks; unassigned items render with subtle vermilion warning pings (`#E05353`).
- **Mobile Repeat:** Single-tap "Same as #" button copies assignment from previous dish without repeating selection.

### Stamp Badges
- **Style:** Compact uppercase monospace label with 4px corner radius (`.stamp-badge`), 0.08em letter spacing, and a colored background wash.

---

## Do's and Don'ts

### Do:
- **Do** format all currency and financial totals in monospace tabular figures (`font-mono tabular-numbers`).
- **Do** use 1px crease borders (`#2E2A24`) and paper shifts (`#121110` to `#1C1A17`) for spatial depth.
- **Do** reserve Hanko Vermilion (`#E05353`) strictly for discrepancy alerts and unassigned warnings.
- **Do** ensure all mobile interactive targets maintain at least a 44x44px touch area.
- **Do** celebrate bill balancing with the Matcha Seal (`#2ECC71`) and verified stamp badges.
- **Do** keep `@media print` rules pure white paper (`#FFFFFF`) and dark sumi ink (`#1C1917`).

### Don't:
- **Don't** use diffuse SaaS drop-shadows or floating multi-layered cards.
- **Don't** introduce generic tech-blue gradients, neon buttons, or purple glow effects.
- **Don't** use proportional fonts for line-item prices, which causes column misalignment.
- **Don't** use low-contrast gray text on prices; money values must remain legible in dim ambient lighting.
- **Don't** clutter the mobile viewport with non-essential decoration during dining table sessions.
