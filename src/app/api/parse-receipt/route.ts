import { NextRequest, NextResponse } from 'next/server';
import { LineItem, ExtraFee } from '@/types/receipt';

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
      "name": "Service Charge (10%)",
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
3. For extra fees & charges:
   - SST / GST / Service Tax: extract percentage or fixed amount.
   - Service Charge (e.g. 10%): extract percentage or fixed amount.
   - Rounding adjustment: e.g. -0.02 or +0.03. Mark isDiscount: true if negative.
   - Discounts or vouchers: Mark isDiscount: true.
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

    // Convert items to LineItem[]
    const now = Date.now();
    const items: LineItem[] = (parsed.items || []).map((it, idx) => {
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

    // Convert fees to ExtraFee[]
    const fees: ExtraFee[] = (parsed.fees || []).map((fee, idx) => {
      const val = Math.abs(Number(fee.value) || 0);
      return {
        id: `fee-${now}-${idx}`,
        name: fee.name?.trim() || `Fee #${idx + 1}`,
        type: fee.type === 'percent' ? 'percent' : 'fixed',
        value: val,
        appliesTo: fee.appliesTo === 'subtotal_plus_service' ? 'subtotal_plus_service' : 'subtotal',
        isDiscount: fee.isDiscount === true,
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
