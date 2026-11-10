# BetsuBetsu (別々) 🧾

> *“Betsu-betsu de onegaishimasu”* — “Separate checks, please.”  
> An artisanal, mobile-first bill splitting web application designed for group dining. It pairs client-side OCR receipt transcription with an inline verification suite, multi-person split matrix, and a mathematically rigorous proportional fee allocation engine.

---

## ✨ Features

- **Receipt Capture & OCR:**
  - Client-side transcription using `tesseract.js` with zero server image storage.
  - Optical tuning with high-DPI auto-scaling, column segmentation (`PSM 4`), and interword space preservation.
  - Automatic extraction of item names, quantities, unit prices, line totals, service charges, sales tax/SST/VAT, rounding adjustments, and grand total.
  - Direct "Paste or Edit Raw Text" modal for quick manual input or adjustments.

- **Interactive Verification & Inline Ledger:**
  - Side-by-side or sheet-based interactive receipt inspection loupe with pan & zoom.
  - Full inline table editing for items, quantities, prices, and line totals ($Qty \times Price$).
  - Tax & Extra Fees manager with percentage (%) vs. fixed ($/RM) toggles, custom compounding bases (subtotal vs. subtotal + service charge), and discounts.
  - Real-time **Discrepancy Sentinel** detecting cent mismatches between calculated sum and printed total with 1-click **Auto-Resolve**.

- **People & Item Assignment Matrix:**
  - Participant manager with custom avatar chips, names, and distinct color tagging.
  - 1-tap item assignment, multi-select equal sharing ($1/N$ each), and communal "Split All".
  - Live unassigned item indicator and real-time running personal totals.

- **Proportional Calculation Engine:**
  - Raw personal subtotal ($S_p$) based on personal consumption and fractional shares.
  - Proportional extra charges: $\text{Fee}_p = \text{Total Fee} \times (S_p / S_{\text{total}})$.
  - **Penny Rounding Protection:** Exact cent closure allocating any division remainder to top shareholders so $\sum \text{Payable}_p \equiv \text{Grand Total}$.

- **Summary & Group Chat Export:**
  - Itemized personal breakdown cards.
  - 1-click formatted summary ready for WhatsApp / Telegram / iMessage with optional payment notes (e.g., DuitNow, Venmo, Zelle).
  - Print-friendly thermal receipt view.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org) 16 (App Router) & React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **OCR Engine:** `tesseract.js` (Client-side)
- **Validation:** Zod
- **Icons:** Lucide React
- **Celebrations:** Canvas Confetti

---

## 🚀 Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
npm start
```

### 4. Run Mathematical Verification
```bash
npx tsx scripts/verify-calculator.ts
```

---

## 📄 License

MIT
