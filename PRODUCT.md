# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Social diners and group meal organizers (friends, colleagues, families) splitting restaurant, cafe, or mamak bills right at the table or shortly after a meal.

## Product Purpose

AsingAsing (Asing-Asing) provides fast, mathematically fair, and privacy-preserving restaurant bill splitting. It allows organizers to snap a receipt photo or paste receipt text, extract items directly in the browser via client-side OCR without uploading images to any server, adjust items and extra fees, assign dishes (individually, to subsets, or table-wide), calculate exact proportional taxes, service charges, and rounding, and share clean breakdowns instantly over messaging apps. Success is settling the bill in under 60 seconds with complete transparency and zero rounding disputes.

## Positioning

100% in-browser client-side OCR with zero cloud image uploads, coupled with exact proportional fee distribution (taxes, service charges, discounts, and tips are proportionally weighted by each diner's food spend, rather than unfairly divided equally).

## Operating Context

- Mobile web browsers on handheld smartphones in dim, busy restaurant environments or immediately following a group meal.
- Secondary usage on desktop or tablet when reviewing or consolidating receipts.
- Thermal receipt formats with multi-column layouts, varying print quality, and specific Southeast Asian conventions (Malaysia SST, 10% service charge, 5-cent cash rounding).
- Export targets: Direct clipboard copy formatted for WhatsApp, Telegram, or text messaging, and printable receipt cards.

## Capabilities and Constraints

- **Client-Side OCR**: Browser-based OCR via `tesseract.js` (`eng.traineddata`), ensuring no receipt images leave the device.
- **Verification & Item Editing**: Side-by-side pan/zoom view of the receipt image alongside editable item names, quantities, unit prices, line totals, and extra fees.
- **Discrepancy Highlighting**: Real-time balancing checks between line items and the printed grand total, with one-tap rounding adjustments.
- **Participant Assignment**: Quick-tap participant badges, assigning items to a single person, splitting equally among a selected subset, or splitting across the entire party.
- **Proportional Fee Math**: Subtotals calculated from personal items and shared fractions; taxes, service charges, discounts, and tips distributed strictly proportional to each diner's spend; cent-perfect rounding distribution.
- **Regional Focus**: Malaysian / Southeast Asian tax & receipt conventions (SST rates, service charge ordering before/after tax, 5-cent cash rounding).
- **Technical Stack**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Zod, Lucide React, canvas-confetti.

## Brand Commitments

- **Name**: AsingAsing (Asing-Asing) — Malay idiom for "separately / each paying their own share".
- **Voice & Tone**: Calm, precise, trustworthy, transparent, and hassle-free. Numbers must always feel mathematically accountable and effortless to verify.

## Evidence on Hand

- Complete Next.js 16 App Router codebase in `src/`.
- Working local OCR engine (`src/lib/ocr.ts`, `eng.traineddata`).
- Comprehensive calculator engine verified with test cases (`src/lib/calculator.ts`, `scripts/verify-calculator.ts`).
- Curated sample receipts for immediate testing (`src/lib/sampleReceipts.ts`).
- Active multi-step interface covering Capture, Editor, Assignment, and Summary (`src/components/`).

## Product Principles

- **Zero Privacy Leakage**: Receipts and transaction data stay strictly local in the browser—no accounts, no cloud database, no tracking.
- **Proportional Fairness**: Diners only pay fees, taxes, and tips on what they ordered; shared items are divided accurately by fractional shares.
- **Instant Confidence**: Always provide clear visual verification comparing original receipt text/photo against parsed items, highlighting mismatches clearly.
- **Frictionless Handoff**: Eliminate manual math and awkward table conversations; provide one-tap formatted messages for WhatsApp and Telegram.

## Accessibility & Inclusion

- Mobile-first responsive layout with minimum 44x44px touch targets for easy one-handed table usage.
- High-contrast typography and clear monetary values legible in dim ambient lighting.
- Accessible color indicators paired with visible participant names/labels so color alone is never the sole differentiator.
