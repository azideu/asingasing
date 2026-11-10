---
name: AsingAsing
description: Japanese-inspired thermal receipt and proportional bill-splitting ledger
colors:
  primary: "#1C1917"
  primary-hover: "#332E2B"
  neutral-bg: "#FAF7F2"
  neutral-surface: "#FFFFFF"
  neutral-muted: "#F3ECE1"
  neutral-text: "#1C1917"
  neutral-secondary: "#57534E"
  neutral-tertiary: "#78716C"
  border-crease: "#E5DDCF"
  border-strong: "#D9CDB8"
  accent-hanko: "#C53030"
  accent-matcha: "#1B6B38"
  highlight-chamois: "#E8D5B5"
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
    textColor: "{colors.neutral-surface}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-secondary}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.neutral-secondary}"
    rounded: "{rounded.md}"
    padding: "6px 10px"
---

# Design System: AsingAsing

## Overview

**Creative North Star: "The Thermal Ledger"**

AsingAsing evokes the tactile intimacy and quiet precision of a restaurant slip printed on thermal paper. It is grounded in the tradition of paying separately (*asing-asing*), transforming the friction of bill calculation into an honest, tangible ritual. The aesthetic avoids cold corporate SaaS tropes and gaudy fintech gradients, choosing instead warm washi paper backgrounds, deep sumi charcoal ink, tactile paper creases, and perforated ticket details.

The density is calibrated for hurried tabletop ergonomics on mobile screens under restaurant lighting. Financial data is displayed with ledger-like rigor: monospace tabular figures ensure numbers align down columns, while delicate paper-crease dividers demarcate stages. Color is applied with intentional restraint—deep charcoal and paper hues carry the structural weight, while scarlet hanko stamps and matcha seals signify verification and mathematical closure.

**Key Characteristics:**
- **Tactile Paper Materiality:** Natural washi tone (`#FAF7F2`) paired with pure paper cards (`#FFFFFF`) and muted parchment (`#F3ECE1`).
- **Sumi & Hanko Palette:** Rich charcoal typography punctuated by red stamp alerts and green balance seals.
- **Ledger Monospace Rigor:** Tabular numerals for monetary totals, quantities, and audit lines.
- **Strictly Flat Physicality:** Depth conveyed through 1px paper borders (`#E5DDCF`) and background shifts rather than drop shadows.
- **Restaurant Ergonomics:** High touch contrast, one-handed mobile action buttons, and clear step-based flow.

## Colors

The palette draws from traditional Japanese stationer and receipt paper materials: aged washi, pressed sumi ink, vermilion cinnabar stamps, and matcha green audit seals.

### Primary
- **Sumi Ink** (#1C1917): Primary brand tone, high-contrast headings, active icons, primary button backgrounds, and strong text.

### Neutral
- **Washi Cream** (#FAF7F2): Global page canvas, mobile navigation backdrops, and receipt negative space.
- **Pure Parchment** (#FFFFFF): Foreground cards, floating toolbars, interactive inputs, and table containers.
- **Muted Parchment** (#F3ECE1): Step navigation trays, table header strips, and code blocks.
- **Weathered Charcoal** (#57534E): Secondary copy, item quantities, and inactive icons.
- **Muted Graphite** (#78716C): Explanatory captions, step indicators, and currency symbols.
- **Perforated Crease** (#E5DDCF): Standard 1px divider lines, component borders, and paper card outlines.
- **Chamois Highlight** (#E8D5B5): Selection highlights, active hover states, and focus underlays.

### Tertiary (Semantic Stamps)
- **Hanko Vermilion** (#C53030): Warning states, unassigned item pings, discrepancy alerts, and delete actions.
- **Matcha Seal** (#1B6B38): Balanced state confirmation, verified checkmarks, and completed step badges.

### Named Rules
**The Hanko Stamp Rule.** Accent red (#C53030) and matcha green (#1B6B38) are reserved exclusively for mathematical verification, errors, and reconciliation stamps. They never appear as decorative flourishes.

**The Paper Tone Rule.** Contrast is created strictly between Washi Cream (#FAF7F2), Pure Parchment (#FFFFFF), and Muted Parchment (#F3ECE1). Never introduce cool grays or blue-tinted slates into the surface hierarchy.

## Typography

**Display Font:** Editorial Serif (`var(--font-serif)`, Georgia, serif)  
**Body Font:** Clean Modern Sans (`var(--font-sans)`, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)  
**Label/Mono Font:** Precise Ledger Mono (`var(--font-mono)`, Geist Mono, monospace)

**Character:** A deliberate dialogue between an artisanal, literary Japanese editorial serif for mastheads and a crisp, distraction-free grotesque body, supported by monospace numbers that evoke thermal receipt printers.

### Hierarchy
- **Display** (bold 700, 1.5rem / 24px, line-height 1.2): Masthead title "AsingAsing" and primary view headers.
- **Headline** (bold 700, 1.25rem / 20px, line-height 1.3): Major step section headers and modal titles.
- **Title** (semibold 600, 1rem / 16px, line-height 1.4): Card group headings and participant summary headers.
- **Body** (regular 400, 0.875rem / 14px, line-height 1.5): Standard explanatory text, item descriptions, and user notes.
- **Label / Tabular** (bold 700 or medium 500, 0.75rem / 12px, letter-spacing 0.08em): Monospace line totals, currency labels, stamp badges, and status pills.

### Named Rules
**The Tabular Numerals Rule.** Every monetary value, unit price, quantity, tax percentage, and cent calculation must be rendered with `.tabular-numbers` and monospace figures to guarantee clean vertical column alignment.

## Layout

AsingAsing adopts a mobile-first, centered-column layout with a maximum container width of 1152px (`max-w-6xl`) on desktop, collapsing to a single-column thumb-friendly stack on handheld viewports (`max-w-md` to `max-w-xl`).

- **Header:** Sticky top header (backdrop-blur with 95% Washi Cream) anchored by a 1px crease border (`#E5DDCF`), carrying the serif brand mark, currency switcher, and quick reset.
- **Step Navigation:** Desktop displays a 4-column connected progress tray (`#F3ECE1`); mobile transitions to an anchored bottom bar with thumb-accessible "Back" and "Next" triggers.
- **Spacing Rhythm:** Standard spacing increments based on an 8px module (4px micro, 8px compact, 12px snug, 16px default, 24px section separation).
- **Split View:** On desktop review screens, an interactive pan/zoom receipt photo panel sits alongside the editable line-item table, collapsing into a toggleable view on mobile.

## Elevation & Depth

AsingAsing adheres to a strictly flat, tactile surface model. Depth is established purely through tonal paper contrast and crisp 1px borders, simulating sheets of paper placed atop a desk.

### Surface Vocabulary
- **Canvas Base:** Washi Cream (`#FAF7F2`) ground floor.
- **Sheet Level 1:** Pure Parchment (`#FFFFFF`) with a 1px Perforated Crease border (`#E5DDCF`).
- **Sheet Level 2 (Recessed):** Muted Parchment (`#F3ECE1`) for secondary controls and input wells.
- **Active / Pressed Feedback:** Physical scale-down (`active:scale-98` / `active:scale-95`) rather than floating shadow lifts.

### Named Rules
**The Strictly Flat Rule.** No ambient blur shadows, fuzzy drop-shadows, or skeuomorphic gradients are permitted on cards or panels. All structural separation is achieved with 1px `#E5DDCF` borders and `#FAF7F2` / `#FFFFFF` surface shifts. Faint structural 2xs shadows (`shadow-2xs`) are tolerated only on elevated floating select dropdowns.

## Shapes

- **Card Corners:** Smooth rounded corners with 12px (`rounded-xl`) and 16px (`rounded-2xl`) radii, giving cards a friendly, non-aggressive paper-slip feel.
- **Borders & Creases:** Strict 1px uniform solid borders (`#E5DDCF` or `#D9CDB8`).
- **Pills & Badges:** Full pill geometry (`rounded-full`) for circular participant tokens and step indicators; tight 4px radius (`rounded-sm`) for thermal stamp badges.
- **Perforated Edge Detail:** Radial dot repeating patterns (`.perforated-edge`) for paper tear-off motifs.

## Components

### Buttons
- **Primary Action:** Sumi Ink background (`#1C1917`), white text, 12px radius (`rounded-xl`), 12px 16px padding (`py-3 px-4`), semibold 14px type. State transitions use dark brown hover (`#332E2B`) and physical press (`active:scale-98`).
- **Secondary / Ghost:** Pure Parchment (`#FFFFFF`) or transparent background with 1px border (`#E5DDCF`), charcoal text (`#57534E`), subtle `#F3ECE1` hover fill.
- **Icon Actions:** Compact 28px-32px square or circular targets with clean Lucide SVG icons (14px-16px).

### Cards / Paper Containers
- **Background:** Pure Parchment (`#FFFFFF`) on top of Washi Cream (`#FAF7F2`).
- **Border:** 1px `#E5DDCF` with 12px-16px corners (`rounded-xl` or `rounded-2xl`).
- **Padding:** 16px (`p-4`) on mobile, expanding to 20px-24px (`p-5` or `p-6`) on desktop.

### Inputs & Editable Fields
- **Background:** Muted Parchment (`#FAF7F2` or `#F3ECE1`) at rest, transitioning to Pure Parchment (`#FFFFFF`) on focus.
- **Border:** 1px `#D9CDB8` stroke shifting to 1px Sumi Ink (`#1C1917`) on focus ring.
- **Typography:** Tabular monospace (`font-mono`) for monetary inputs, sans-serif for item names.

### Participant Badges & Selection Matrix
- **Diner Avatars:** 28px-32px circular pills with curated high-contrast avatar hues (`#3B82F6`, `#EC4899`, `#10B981`, `#F59E0B`, `#8B5CF6`, `#14B8A6`, `#EF4444`, `#6366F1`) and crisp initial letters.
- **Tagging Matrix:** Click/tap toggles diner assignment; assigned items show filled badges, unassigned items render with subtle dashed borders and warning pings.

### Stamp Badges
- **Style:** Compact uppercase monospace label with 4px corner radius (`.stamp-badge`), 0.08em letter spacing, and a colored background wash.

## Do's and Don'ts

### Do:
- **Do** format all currency and financial totals in monospace tabular figures (`font-mono tabular-numbers`).
- **Do** use 1px crease borders (`#E5DDCF`) and paper shifts (`#FAF7F2` to `#FFFFFF`) for spatial depth.
- **Do** reserve Hanko Vermilion (`#C53030`) strictly for discrepancy alerts and unassigned warnings.
- **Do** ensure all mobile interactive targets maintain at least a 44x44px touch area.
- **Do** celebrate bill balancing with the Matcha Seal (`#1B6B38`) and verified stamp badges.

### Don't:
- **Don't** use diffuse SaaS drop-shadows or floating multi-layered cards.
- **Don't** introduce generic tech-blue gradients, neon buttons, or purple glow effects.
- **Don't** use proportional fonts for line-item prices, which causes column misalignment.
- **Don't** use low-contrast gray text on prices; money values must remain legible in dim ambient lighting.
- **Don't** clutter the mobile viewport with non-essential decoration during dining table sessions.
