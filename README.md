# BetsuBetsu (別々)

BetsuBetsu is a mobile-first web app for splitting restaurant bills. It scans receipt photos in your browser, lets you fix misread items, and splits shared dishes among people while dividing tax, service charge, and tips in proportion to what each person spent.

---

## Features

- **Receipt scanning:**
  - Client-side OCR using `tesseract.js`. Your receipt photos stay in your browser and are not uploaded to a server.
  - Automatic column layout detection and resolution scaling to read thermal receipt paper.
  - Extracts item names, quantities, unit prices, line totals, service charges, taxes (including SST and VAT), rounding, and grand totals.
  - Option to paste receipt text directly if a photo is blurry.

- **Item verification and editing:**
  - Zoom and pan the receipt image next to the item list to check prices.
  - Click any field to edit the item name, quantity, unit price, or line total.
  - Add missing items, duplicate rows, or delete unneeded lines.
  - Set up extra fees as a percentage or fixed amount, and choose whether tax applies before or after service charge.
  - Highlights mismatches between the items and the printed grand total, with a button to balance rounding differences.

- **Split items among people:**
  - Add people with custom names and color badges.
  - Tap people to assign an item to one person, split it equally among several, or split it across the whole table.
  - Shows unassigned items so nothing gets left out.

- **Proportional fee split:**
  - Calculates each person's subtotal from their personal items and their share of split dishes.
  - Divides taxes, service charges, discounts, and tips in proportion to each person's share of the food.
  - Distributes rounding cents to ensure the individual totals add up to the receipt total.

- **Summary and sharing:**
  - Itemized breakdown cards showing what each person ordered and their share of fees.
  - One-click copy formatted for WhatsApp, Telegram, or text messages.
  - Printable receipt view.

---

## Tech Stack

- Next.js 16 (App Router) and React 19
- TypeScript
- Tailwind CSS v4
- `tesseract.js` for client-side OCR
- Zod
- Lucide React

---

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production build
```bash
npm run build
npm start
```

### 4. Run calculations test
```bash
npx tsx scripts/verify-calculator.ts
```

---

## License

MIT
