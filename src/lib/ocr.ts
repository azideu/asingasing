import { LineItem, ExtraFee, normalizeFeeWithPresets } from '@/types/receipt';

export interface PreprocessOptions {
  grayscale: boolean;
  contrast: number; // 0 to 50
  threshold?: number; // 0 to 255 (if set, applies binarization)
  brightness?: number; // -50 to 50
  autoScale?: boolean; // upscales small/medium images for high OCR resolution
}

export async function preprocessImage(
  imageSource: string | HTMLImageElement,
  options: PreprocessOptions
): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = typeof imageSource === 'string' ? new Image() : imageSource;
    if (typeof imageSource === 'string') {
      img.crossOrigin = 'anonymous';
      img.src = imageSource;
    }

    const process = () => {
      const origWidth = img.naturalWidth || img.width;
      const origHeight = img.naturalHeight || img.height;

      // Smart scaling: Tesseract works best when text x-height >= 25px.
      // If image width is below 1600px, upscale it up to 2000px width.
      let scale = 1;
      if (options.autoScale !== false && origWidth > 0 && origWidth < 1600) {
        scale = Math.min(2.5, 1800 / origWidth);
      }

      const targetWidth = Math.round(origWidth * scale);
      const targetHeight = Math.round(origHeight * scale);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas 2D context not available'));
        return;
      }

      // High-quality image scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      const data = imgData.data;

      const contrast = options.contrast || 0;
      const contrastFactor =
        contrast !== 0
          ? (259 * (contrast + 255)) / (255 * (259 - contrast))
          : 1;
      const brightness = options.brightness || 0;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Apply brightness
        if (brightness !== 0) {
          r += brightness;
          g += brightness;
          b += brightness;
        }

        // Apply contrast
        if (contrast !== 0) {
          r = contrastFactor * (r - 128) + 128;
          g = contrastFactor * (g - 128) + 128;
          b = contrastFactor * (b - 128) + 128;
        }

        // Grayscale conversion
        if (options.grayscale) {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = gray;
          g = gray;
          b = gray;
        }

        // Optional binarization thresholding
        if (options.threshold !== undefined && options.threshold > 0) {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const val = gray > options.threshold ? 255 : 0;
          r = val;
          g = val;
          b = val;
        }

        // Clamp values
        data[i] = Math.min(255, Math.max(0, r));
        data[i + 1] = Math.min(255, Math.max(0, g));
        data[i + 2] = Math.min(255, Math.max(0, b));
      }

      ctx.putImageData(imgData, 0, 0);
      resolve({
        dataUrl: canvas.toDataURL('image/jpeg', 0.95),
        width: canvas.width,
        height: canvas.height,
      });
    };

    if (img.complete && (img.naturalWidth > 0 || img.width > 0)) {
      process();
    } else {
      img.onload = process;
      img.onerror = (err) => reject(err);
    }
  });
}

export interface ParsedReceiptData {
  items: LineItem[];
  fees: ExtraFee[];
  subtotal?: number;
  grandTotal?: number;
}

export function parseReceiptText(rawText: string): ParsedReceiptData {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const items: LineItem[] = [];
  const fees: ExtraFee[] = [];
  let detectedSubtotal: number | undefined;
  let detectedGrandTotal: number | undefined;

  // Comprehensive currency & price regex: supports RM, MYR, S$, AU$, $, €, £, ¥, plus OCR variants (RN, AM, R¥, EM)
  const priceRegex = /(?:RM|MYR|S\$|AU\$|[$€£¥]|RN|AM|R¥|EM)?\s*([0-9]+[.,][0-9]{2})\b/i;

  // Metadata lines to skip
  const metaRegex = /(table[:\s]|pax[:\s]|bill\s*no|date[:\s]|time[:\s]|sst\s*id|gst\s*id|sdn\s*bhd|invoice|receipt\s*#|order\s*#|cashier|server|terminal|visa|mastercard|thank\s*you|please\s*come|tel[:\s]|phone[:\s]|welcome)/i;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    if (line.length < 3) continue;

    const lower = line.toLowerCase();

    // 1. Check for "Total after Rounding" or Grand Total lines
    if (
      lower.includes('total after rounding') ||
      lower.includes('grand total') ||
      lower.includes('nett total') ||
      lower.includes('amount due') ||
      lower.includes('balance due') ||
      (lower.includes('total') &&
        !lower.includes('sub') &&
        !lower.includes('items') &&
        !lower.includes('tax'))
    ) {
      const match = line.match(priceRegex);
      if (match) {
        const val = parseFloat(match[1].replace(',', '.'));
        if (!isNaN(val) && val > 0) {
          // If explicitly "total after rounding" or not set yet, update
          if (lower.includes('total after rounding') || !detectedGrandTotal || val > detectedGrandTotal) {
            detectedGrandTotal = val;
          }
        }
      }
      if (
        lower.includes('total after rounding') ||
        lower.includes('grand total') ||
        lower.includes('nett total') ||
        lower === 'total' ||
        lower.startsWith('total ')
      ) {
        continue;
      }
    }

    // 2. Check for Subtotal
    if (
      lower.includes('subtotal') ||
      lower.includes('sub-total') ||
      lower.includes('sub total')
    ) {
      const match = line.match(priceRegex);
      if (match) {
        const val = parseFloat(match[1].replace(',', '.'));
        if (!isNaN(val) && val > 0) {
          detectedSubtotal = val;
        }
      }
      continue;
    }

    // 3. Check for Rounding Adjustment (e.g. "Rounding -RM0.01" or "+0.02")
    if (lower.includes('rounding') && !lower.includes('after')) {
      const match = line.match(priceRegex);
      if (match) {
        let val = parseFloat(match[1].replace(',', '.'));
        const isNeg = line.includes('-') || lower.includes('cr');
        if (isNeg) val = -Math.abs(val);

        fees.push({
          id: `fee-rnd-${Date.now()}-${fees.length}`,
          name: 'Rounding Adjustment',
          type: 'fixed',
          value: Math.abs(val),
          appliesTo: 'subtotal',
          isDiscount: val < 0,
        });
        continue;
      }
    }

    // 4. Check for Malaysian Gov Service Tax (SST 6% / 8%) or standard Tax/VAT/GST
    if (
      lower.includes('gov service tax') ||
      lower.includes('service tax') ||
      lower.includes('gov tax') ||
      lower.includes('sst') ||
      lower.includes('gst') ||
      lower.includes('vat') ||
      (lower.includes('tax') && !lower.includes('total'))
    ) {
      const percentMatch = line.match(/(\d+(?:\.\d+)?)%/);
      const priceMatch = line.match(priceRegex);

      const taxLabel = lower.includes('gov service tax')
        ? 'Gov Service Tax'
        : lower.includes('service tax')
        ? 'Service Tax'
        : lower.includes('sst')
        ? 'SST'
        : lower.includes('gst')
        ? 'GST'
        : lower.includes('vat')
        ? 'VAT'
        : 'Sales Tax';

      if (percentMatch) {
        const rate = parseFloat(percentMatch[1]);
        fees.push({
          id: `fee-tax-${Date.now()}-${fees.length}`,
          name: `${taxLabel} (${rate}%)`,
          type: 'percent',
          value: rate,
          appliesTo: 'subtotal',
        });
        continue;
      } else if (priceMatch) {
        const amt = parseFloat(priceMatch[1].replace(',', '.'));
        fees.push({
          id: `fee-tax-${Date.now()}-${fees.length}`,
          name: taxLabel,
          type: 'fixed',
          value: amt,
          appliesTo: 'subtotal',
        });
        continue;
      }
    }

    // 5. Check for Service Charge (e.g. 10% dining service)
    if (
      lower.includes('service charge') ||
      lower.includes('service chg') ||
      lower.includes('svc chg') ||
      lower.includes('svc charge') ||
      lower.match(/\b(sc|svc)\s*([0-9]+)%/i)
    ) {
      const percentMatch = line.match(/(\d+(?:\.\d+)?)%/);
      const priceMatch = line.match(priceRegex);

      if (percentMatch) {
        const rate = parseFloat(percentMatch[1]);
        fees.push({
          id: `fee-svc-${Date.now()}-${fees.length}`,
          name: `Service Charge (${rate}%)`,
          type: 'percent',
          value: rate,
          appliesTo: 'subtotal',
        });
        continue;
      } else if (priceMatch) {
        const amt = parseFloat(priceMatch[1].replace(',', '.'));
        fees.push({
          id: `fee-svc-${Date.now()}-${fees.length}`,
          name: 'Service Charge',
          type: 'fixed',
          value: amt,
          appliesTo: 'subtotal',
        });
        continue;
      }
    }

    // 6. Check for Discount / Promo / Voucher
    if (
      lower.includes('discount') ||
      lower.includes('disc') ||
      lower.includes('promo') ||
      lower.includes('voucher') ||
      lower.includes('rebate')
    ) {
      const priceMatch = line.match(priceRegex);
      if (priceMatch) {
        const amt = Math.abs(parseFloat(priceMatch[1].replace(',', '.')));
        fees.push({
          id: `fee-disc-${Date.now()}-${fees.length}`,
          name: 'Discount',
          type: 'fixed',
          value: amt,
          appliesTo: 'subtotal',
          isDiscount: true,
        });
        continue;
      }
    }

    // 7. Check for Tip / Gratuity
    if (lower.includes('tip') || lower.includes('gratuity')) {
      const priceMatch = line.match(priceRegex);
      if (priceMatch) {
        const amt = parseFloat(priceMatch[1].replace(',', '.'));
        fees.push({
          id: `fee-tip-${Date.now()}-${fees.length}`,
          name: 'Tip / Gratuity',
          type: 'fixed',
          value: amt,
          appliesTo: 'subtotal',
        });
        continue;
      }
    }

    // Skip generic metadata lines before testing line items
    if (metaRegex.test(line)) continue;

    // 8. Line item detection
    const pMatch = line.match(priceRegex);
    if (pMatch && pMatch.index !== undefined) {
      const price = parseFloat(pMatch[1].replace(',', '.'));
      if (isNaN(price) || price <= 0) continue;

      const beforePrice = line.substring(0, pMatch.index).trim();
      if (!beforePrice || beforePrice.length < 2) continue;

      // Check trailing quantity: "Ebiten Ebikko Maki 1"
      const trailingQty = beforePrice.match(/^(.+?)\s+(\d{1,2})$/);
      // Check leading quantity: "1 Ebiten Ebikko Maki" or "2x Wagyu Skewers"
      const leadingQty = beforePrice.match(/^(\d{1,2})\s*[@xX]?\s+(.+)$/);

      let itemName = beforePrice;
      let qty = 1;

      if (trailingQty) {
        itemName = trailingQty[1].trim();
        qty = parseInt(trailingQty[2], 10);
      } else if (leadingQty) {
        qty = parseInt(leadingQty[1], 10);
        itemName = leadingQty[2].trim();
      }

      // Clean OCR leading noise (e.g. "= _ - Ebi" -> "Ebi Tempura")
      itemName = itemName
        .replace(/^[^a-zA-Z0-9(]+/, '')
        .replace(/[^a-zA-Z0-9)]+$/, '')
        .trim();

      // Skip lines that are just numbers, single chars, or metadata keywords
      if (
        itemName.length >= 2 &&
        !lower.includes('table') &&
        !lower.includes('sub-total') &&
        !lower.includes('total') &&
        !lower.includes('pax')
      ) {
        items.push({
          id: `item-${Date.now()}-${items.length}-${Math.random().toString(36).substring(2, 5)}`,
          name: itemName,
          qty: qty > 0 ? qty : 1,
          unitPrice: parseFloat((price / (qty > 0 ? qty : 1)).toFixed(2)),
          totalPrice: price,
          assignedTo: [],
        });
      }
    }
  }

  const normalizedFees = fees.map((f) => {
    const norm = normalizeFeeWithPresets(f);
    return {
      ...f,
      name: norm.name,
      type: norm.type,
      value: norm.value,
      appliesTo: norm.appliesTo,
      isDiscount: norm.isDiscount,
    };
  });

  return {
    items,
    fees: normalizedFees,
    subtotal: detectedSubtotal,
    grandTotal: detectedGrandTotal,
  };
}
