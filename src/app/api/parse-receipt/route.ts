import { NextRequest, NextResponse } from 'next/server';
import { LineItem, ExtraFee, normalizeFeeWithPresets } from '@/types/receipt';

interface GeminiParsedResponse {
  items?: Array<{
    name: string;
    qty?: number;
    unitPrice?: number;
    totalPrice?: number;
    notes?: string;
  }>;
  fees?: Array<{
    name: string;
    type?: 'percent' | 'fixed';
    value?: number;
    printedAmount?: number;
    appliesTo?: 'subtotal' | 'subtotal_plus_service';
    isDiscount?: boolean;
  }>;
  subtotal?: number;
  grandTotal?: number;
}

const SYSTEM_INSTRUCTION = `You are a high-precision dining receipt parser.
Extract all purchased line items (food, drinks, merchandise), individual item quantities, unit prices, total item prices, and extra charges (Service Charge, SST/GST/VAT/Taxes, Discounts, Rounding Adjustment, Tips).

Return a strict JSON object with:
{
  "items": [
    {
      "name": "Dish or Drink Name",
      "qty": 1,
      "unitPrice": 12.50,
      "totalPrice": 12.50,
      "notes": "optional modifications or choices"
    }
  ],
  "fees": [
    {
      "name": "Service Charge",
      "type": "percent", // or "fixed"
      "value": 10,
      "appliesTo": "subtotal", // or "subtotal_plus_service"
      "isDiscount": false
    }
  ],
  "subtotal": 50.00,
  "grandTotal": 58.00
}

Rules:
1. Ignore header/footer metadata (restaurant address, registration numbers, order/table ID, cashier name, date/time, wifi passwords).
2. For line items:
   - "name": Clean item title only (strip out leading "1x", "2x" or trailing price).
   - "qty": Numerical quantity (default 1).
   - "unitPrice": Numerical unit price. If only line total is given, calculate total / qty.
   - "totalPrice": Numerical line total.
   - Do NOT include taxes, service charges, discounts, or subtotal lines as food items.
   - ZERO-PRICED ITEMS & MODIFIERS:
     * NEVER parse items worth 0 or 0.00 as standalone line items.
     * If a 0.00 line is a preparation choice or kitchen modifier (e.g. "Less Ice", "Medium Rare", "No Coriander", "Dine In", "Warm Water") belonging to a dish/drink, attach it to that dish's "notes" property instead of creating a separate item.
     * Ignore standalone zero-priced items, complimentary items (e.g. "Complimentary Mint 0.00"), or promotional zero lines entirely.
3. For extra fees & charges:
   Normalize fee names and compounding rules to strictly follow these standard presets:
   - 10% Service Charge: name "Service Charge", type "percent", value 10, appliesTo "subtotal" (normalize raw labels like "ServiceCrg 10%", "SVC 10%", "SC 10%")
   - 6% SST / Service Tax: name "SST (6%)", appliesTo "subtotal_plus_service" (normalize raw labels like "Servce Tax 6%", "Gov Tax 6%", "SST 6%")
   - 8% SST / Service Tax: name "SST (8%)", appliesTo "subtotal_plus_service"
   - 9% GST: name "GST (9%)", appliesTo "subtotal_plus_service"
   - 10% Discount: name "10% Discount", type "percent", value 10, appliesTo "subtotal", isDiscount: true
   - 15% Tip: name "Tip (15%)", type "percent", value 15, appliesTo "subtotal"
   - EXACT PRINTED FIGURES: If a fee line on the receipt prints an explicit currency amount (e.g. "(Servce Tax 6%  10.25)"), include "printedAmount": 10.25 and set type: "fixed", value: 10.25 so the fee matches the physical receipt figure instead of deviating due to tax-exempt items.
   - INCLUSIVE TAXES: If a tax is enclosed in parentheses (e.g. "(Servce Tax 6% 10.25)") AND the receipt grand total shows that the tax is already included in the food subtotal, do NOT add it as an extra fee.
   - In restaurant dining (e.g. Malaysia, Singapore), Government Service Tax / SST / GST is calculated on (Subtotal + Service Charge), so appliesTo MUST be "subtotal_plus_service".
   - Service Charge is calculated on subtotal, so appliesTo MUST be "subtotal".
   - Rounding adjustment: e.g. -0.02 or +0.03. Name "Rounding Adjustment", type "fixed". Mark isDiscount: true if negative.
   - Other discounts or vouchers: Mark isDiscount: true.
4. "subtotal": numerical sum of items before taxes/fees.
5. "grandTotal": final net payable amount printed on the receipt.
6. Return valid JSON only, without markdown fences or additional conversational text.`;

async function callGemini(model: string, apiKey: string, mimeType: string, base64Data: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [
          { text: SYSTEM_INSTRUCTION },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      response_mime_type: 'application/json',
      thinkingConfig: {
        thinkingBudget: 0,
      },
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return response;
}

export async function POST(req: NextRequest) {
  try {
    const { image, apiKey: clientApiKey } = await req.json();

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: 'Missing receipt image data (base64 string required)' },
        { status: 400 }
      );
    }

    const apiKey = clientApiKey?.trim() || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is required. Please set GEMINI_API_KEY or provide a key in settings.' },
        { status: 401 }
      );
    }

    // Extract mime type and base64 data
    let mimeType = 'image/jpeg';
    let base64Data = image;

    const dataUrlMatch = image.match(/^data:([^;]+);base64,(.+)$/);
    if (dataUrlMatch) {
      mimeType = dataUrlMatch[1];
      base64Data = dataUrlMatch[2];
    }

    // Attempt with primary model gemini-3.5-flash, fallback to gemini-3.1-flash-lite if busy
    let geminiRes = await callGemini('gemini-3.5-flash', apiKey, mimeType, base64Data);

    if (geminiRes.status === 503 || geminiRes.status === 429) {
      console.warn(`Primary model gemini-3.5-flash returned ${geminiRes.status}, falling back to gemini-3.1-flash-lite...`);
      geminiRes = await callGemini('gemini-3.1-flash-lite', apiKey, mimeType, base64Data);
    }

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API Error:', geminiRes.status, errText);
      let errMsg = 'Failed to analyze receipt with Gemini Vision.';
      try {
        const parsedErr = JSON.parse(errText);
        if (parsedErr.error?.message) {
          errMsg = parsedErr.error.message;
        }
      } catch {}
      return NextResponse.json({ error: errMsg }, { status: geminiRes.status });
    }

    const data = await geminiRes.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return NextResponse.json(
        { error: 'Gemini did not return any readable content from this receipt photo.' },
        { status: 500 }
      );
    }

    let parsed: GeminiParsedResponse = {};
    try {
      parsed = JSON.parse(rawText);
    } catch {
      console.error('Failed to parse Gemini JSON:', rawText);
      return NextResponse.json(
        { error: 'Failed to parse AI response into structured receipt data.' },
        { status: 500 }
      );
    }

    // Convert items to LineItem[], strictly filtering out zero-priced items
    const now = Date.now();
    const items: LineItem[] = (parsed.items || [])
      .filter((it) => {
        const qty = Math.max(1, Math.round(Number(it.qty) || 1));
        const totalPrice = Number(it.totalPrice) || (Number(it.unitPrice) || 0) * qty;
        // Omit items with total price 0 or negative
        return totalPrice > 0;
      })
      .map((it, idx) => {
        const qty = Math.max(1, Math.round(Number(it.qty) || 1));
        const totalPrice = Number(it.totalPrice) || (Number(it.unitPrice) || 0) * qty;
        const unitPrice = Number(it.unitPrice) || (totalPrice / qty);

        return {
          id: `item-${now}-${idx}`,
          name: it.name?.trim() || `Item #${idx + 1}`,
          qty,
          unitPrice: Math.round(unitPrice * 100) / 100,
          totalPrice: Math.round(totalPrice * 100) / 100,
          assignedTo: [],
          notes: it.notes?.trim() || undefined,
        };
      });

    // Convert fees to ExtraFee[] and normalize against preset rules
    const fees: ExtraFee[] = (parsed.fees || []).map((rawFee, idx) => {
      const normalized = normalizeFeeWithPresets(rawFee);
      return {
        id: `fee-${now}-${idx}`,
        name: normalized.name,
        type: normalized.type,
        value: normalized.value,
        appliesTo: normalized.appliesTo,
        isDiscount: normalized.isDiscount,
      };
    });

    return NextResponse.json({
      success: true,
      items,
      fees,
      subtotal: parsed.subtotal ? Number(parsed.subtotal) : undefined,
      grandTotal: parsed.grandTotal ? Number(parsed.grandTotal) : undefined,
      rawOcrText: rawText,
    });
  } catch (error: unknown) {
    console.error('Unhandled receipt parsing route error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error while processing receipt';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
