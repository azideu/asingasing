import { NextRequest, NextResponse } from 'next/server';
import { LineItem, ExtraFee, normalizeFeeWithPresets } from '@/types/receipt';
import { GeminiResponseSchema } from '@/lib/validation';

// Rate limiter storage: IP -> { count, resetAt }
const ipRateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  // Periodic garbage collection for expired entries to prevent memory leak
  if (ipRateLimits.size > 2000) {
    for (const [key, record] of ipRateLimits.entries()) {
      if (now > record.resetAt) {
        ipRateLimits.delete(key);
      }
    }
  }

  const existing = ipRateLimits.get(ip);
  if (!existing || now > existing.resetAt) {
    ipRateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count >= limit) {
    return false;
  }

  existing.count += 1;
  return true;
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
  const encodedModel = encodeURIComponent(model);
  const encodedKey = encodeURIComponent(apiKey);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodedModel}:generateContent?key=${encodedKey}`;

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

const MAX_BASE64_LENGTH = 10 * 1024 * 1024; // 10MB base64 string (~7.5MB raw image)
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic']);

export async function POST(req: NextRequest) {
  try {
    // 1. IP extraction and rate limiting
    const forwardedHeader = req.headers.get('x-forwarded-for');
    const clientIp = forwardedHeader ? forwardedHeader.split(',')[0].trim() : (req.headers.get('x-real-ip') || '127.0.0.1');

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid JSON request payload.' },
        { status: 400 }
      );
    }

    const { image, apiKey: clientApiKey } = body as { image?: unknown; apiKey?: unknown };

    // 2. Rate limit: 10 req/min for server-keyed free tier; 60 req/min for user-supplied key
    const hasCustomKey = typeof clientApiKey === 'string' && clientApiKey.trim().length > 0;
    const rateLimit = hasCustomKey ? 60 : 10;
    if (!checkRateLimit(clientIp, rateLimit, 60_000)) {
      return NextResponse.json(
        {
          error: hasCustomKey
            ? 'Rate limit exceeded (60 requests/minute). Please slow down.'
            : 'Public AI rate limit reached (10 requests/minute). Please wait a moment or configure your own Gemini API key in settings.',
        },
        { status: 429 }
      );
    }

    // 3. Payload validation
    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: 'Missing receipt image data (base64 string required)' },
        { status: 400 }
      );
    }

    if (image.length > MAX_BASE64_LENGTH) {
      return NextResponse.json(
        { error: 'Receipt image exceeds the maximum supported size of 7.5MB.' },
        { status: 413 }
      );
    }

    // 4. API Key Resolution and Sanity Validation
    const resolvedApiKey = (hasCustomKey ? (clientApiKey as string).trim() : '') || process.env.GEMINI_API_KEY;
    if (!resolvedApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is required. Please set GEMINI_API_KEY or provide a key in settings.' },
        { status: 401 }
      );
    }

    // Google API keys contain alphanumeric, dashes, and underscores (typically 20-100 chars)
    if (!/^[a-zA-Z0-9_\-]{10,128}$/.test(resolvedApiKey)) {
      return NextResponse.json(
        { error: 'Invalid Gemini API key format.' },
        { status: 400 }
      );
    }

    // 5. Safe O(1) Data URL Parsing (prevents ReDoS and memory spikes)
    let mimeType = 'image/jpeg';
    let base64Data = image;

    if (image.startsWith('data:')) {
      const commaIdx = image.indexOf(',');
      if (commaIdx === -1) {
        return NextResponse.json(
          { error: 'Invalid data URL format: missing data payload separator.' },
          { status: 400 }
        );
      }
      const header = image.slice(5, commaIdx);
      const semiIdx = header.indexOf(';');
      const rawMime = (semiIdx !== -1 ? header.slice(0, semiIdx) : header).toLowerCase().trim();
      const normalizedMime = rawMime === 'image/jpg' ? 'image/jpeg' : rawMime;

      if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
        return NextResponse.json(
          { error: `Unsupported image format (${rawMime || 'unknown'}). Supported: JPG, PNG, WEBP, HEIC.` },
          { status: 400 }
        );
      }

      mimeType = normalizedMime;
      base64Data = image.slice(commaIdx + 1).trim();
    }

    // 6. Attempt with primary model gemini-3.5-flash, fallback to gemini-3.1-flash-lite if busy
    let geminiRes = await callGemini('gemini-3.5-flash', resolvedApiKey, mimeType, base64Data);

    if (geminiRes.status === 503 || geminiRes.status === 429) {
      console.warn(`Primary model gemini-3.5-flash returned ${geminiRes.status}, falling back to gemini-3.1-flash-lite...`);
      geminiRes = await callGemini('gemini-3.1-flash-lite', resolvedApiKey, mimeType, base64Data);
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

    // 7. Parse and Validate AI output with Zod
    let rawJson: unknown;
    try {
      rawJson = JSON.parse(rawText);
    } catch {
      console.error('Failed to parse Gemini JSON:', rawText);
      return NextResponse.json(
        { error: 'Failed to parse AI response into structured receipt data.' },
        { status: 500 }
      );
    }

    const validationResult = GeminiResponseSchema.safeParse(rawJson);
    if (!validationResult.success) {
      console.error('Gemini response schema validation failed:', validationResult.error);
      return NextResponse.json(
        { error: 'AI returned an unexpected receipt format.' },
        { status: 502 }
      );
    }

    const parsed = validationResult.data;

    // 8. Convert items to LineItem[], strictly filtering out zero-priced items
    const now = Date.now();
    const items: LineItem[] = (parsed.items || [])
      .filter((it) => {
        const qty = Math.max(1, Math.round(Number(it.qty) || 1));
        const totalPrice = Number(it.totalPrice) || (Number(it.unitPrice) || 0) * qty;
        return totalPrice > 0;
      })
      .map((it, idx) => {
        const qty = Math.max(1, Math.round(Number(it.qty) || 1));
        const totalPrice = Number(it.totalPrice) || (Number(it.unitPrice) || 0) * qty;
        const unitPrice = Number(it.unitPrice) || (totalPrice / qty);

        return {
          id: `item-${now}-${idx}`,
          name: it.name?.trim().slice(0, 200) || `Item #${idx + 1}`,
          qty,
          unitPrice: Math.round(unitPrice * 100) / 100,
          totalPrice: Math.round(totalPrice * 100) / 100,
          assignedTo: [],
          notes: it.notes?.trim().slice(0, 300) || undefined,
        };
      });

    // 9. Convert fees to ExtraFee[] and normalize against preset rules
    const fees: ExtraFee[] = (parsed.fees || []).map((rawFee, idx) => {
      const normalized = normalizeFeeWithPresets(rawFee);
      return {
        id: `fee-${now}-${idx}`,
        name: normalized.name.slice(0, 100),
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
      subtotal: parsed.subtotal !== undefined ? Number(parsed.subtotal) : undefined,
      grandTotal: parsed.grandTotal !== undefined ? Number(parsed.grandTotal) : undefined,
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
