export type FeeType = 'percent' | 'fixed';
export type FeeCompoundRule = 'subtotal' | 'subtotal_plus_service';

export interface ExtraFee {
  id: string;
  name: string;
  type: FeeType;
  value: number; // e.g. 10 for 10% or 5.00 for $5 flat
  appliesTo: FeeCompoundRule;
  isDiscount?: boolean; // if true, subtracts from total
}

export interface FeePreset {
  label: string;
  name: string;
  type: FeeType;
  value: number;
  appliesTo: FeeCompoundRule;
  isDiscount?: boolean;
}

export const FEE_PRESETS: FeePreset[] = [
  {
    label: '10% Service Charge',
    name: 'Service Charge',
    type: 'percent',
    value: 10,
    appliesTo: 'subtotal',
  },
  {
    label: '6% SST',
    name: 'SST (6%)',
    type: 'percent',
    value: 6,
    appliesTo: 'subtotal_plus_service',
  },
  {
    label: '8% SST',
    name: 'SST (8%)',
    type: 'percent',
    value: 8,
    appliesTo: 'subtotal_plus_service',
  },
  {
    label: '9% GST',
    name: 'GST (9%)',
    type: 'percent',
    value: 9,
    appliesTo: 'subtotal_plus_service',
  },
  {
    label: '10% Discount',
    name: '10% Discount',
    type: 'percent',
    value: 10,
    appliesTo: 'subtotal',
    isDiscount: true,
  },
  {
    label: '15% Tip',
    name: 'Tip (15%)',
    type: 'percent',
    value: 15,
    appliesTo: 'subtotal',
  },
];

export function normalizeFeeWithPresets(rawFee: {
  name?: string;
  type?: 'percent' | 'fixed';
  value?: number;
  printedAmount?: number;
  appliesTo?: 'subtotal' | 'subtotal_plus_service';
  isDiscount?: boolean;
}): {
  name: string;
  type: FeeType;
  value: number;
  appliesTo: FeeCompoundRule;
  isDiscount: boolean;
} {
  const rawName = (rawFee.name || '').trim();
  const lower = rawName.toLowerCase();
  let val = Math.abs(Number(rawFee.value) || 0);
  let type: FeeType = rawFee.type === 'fixed' ? 'fixed' : 'percent';
  const appliesTo: FeeCompoundRule =
    rawFee.appliesTo === 'subtotal_plus_service' ? 'subtotal_plus_service' : 'subtotal';
  const isDiscount = rawFee.isDiscount === true || lower.includes('discount') || lower.includes('disc');

  // Check if an explicit currency amount was printed on the receipt for this fee line (e.g. 10.25)
  const explicitAmount =
    rawFee.printedAmount !== undefined && rawFee.printedAmount > 0
      ? Math.abs(rawFee.printedAmount)
      : rawFee.type === 'fixed' && val > 0
      ? val
      : undefined;

  // If rate was not parsed into value, check for percentage pattern in the name (e.g. "ServiceCrg 10%")
  const percentMatch = rawName.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percentMatch && (val === 0 || type === 'percent')) {
    val = parseFloat(percentMatch[1]);
    type = 'percent';
  }

  // 1. Service Charge (10% preset or custom percent / fixed amount)
  const isServiceCharge =
    lower.includes('service charge') ||
    lower.includes('service chg') ||
    lower.includes('servicecrg') ||
    lower.includes('service crg') ||
    lower.includes('svc charge') ||
    lower.includes('svc chg') ||
    lower.includes('servicecharge') ||
    /\b(sc|svc)\s*([0-9]+)?%?/i.test(lower);

  if (isServiceCharge && !lower.includes('tax')) {
    if (explicitAmount !== undefined && explicitAmount !== 10) {
      return {
        name: 'Service Charge',
        type: 'fixed',
        value: explicitAmount,
        appliesTo: 'subtotal',
        isDiscount: false,
      };
    }
    if (val === 10 || (val === 0 && !percentMatch)) {
      return {
        name: 'Service Charge',
        type: 'percent',
        value: 10,
        appliesTo: 'subtotal',
        isDiscount: false,
      };
    }
    return {
      name: val > 0 ? `Service Charge (${val}%)` : 'Service Charge',
      type: type,
      value: val,
      appliesTo: 'subtotal',
      isDiscount: false,
    };
  }

  // 2. Malaysian SST / Service Tax (6% or 8% preset)
  const isSST =
    lower.includes('sst') ||
    lower.includes('service tax') ||
    lower.includes('servce tax') ||
    lower.includes('gov service tax') ||
    lower.includes('gov tax') ||
    lower.includes('govt tax') ||
    lower.includes('sales tax') ||
    lower.includes('cukai perkhidmatan');

  if (isSST) {
    const isEightPercent = val === 8 || lower.includes('8%');
    const sstLabel = isEightPercent ? 'SST (8%)' : 'SST (6%)';

    // If receipt printed an exact dollar amount (e.g. 10.25 on a 6% tax line due to exempt items), preserve the exact fixed amount
    if (explicitAmount !== undefined && explicitAmount !== 6 && explicitAmount !== 8) {
      return {
        name: sstLabel,
        type: 'fixed',
        value: explicitAmount,
        appliesTo: 'subtotal_plus_service',
        isDiscount: false,
      };
    }

    if (val === 6 || lower.includes('6%')) {
      return {
        name: 'SST (6%)',
        type: 'percent',
        value: 6,
        appliesTo: 'subtotal_plus_service',
        isDiscount: false,
      };
    }
    if (val === 8 || lower.includes('8%')) {
      return {
        name: 'SST (8%)',
        type: 'percent',
        value: 8,
        appliesTo: 'subtotal_plus_service',
        isDiscount: false,
      };
    }
    return {
      name: val > 0 ? `SST (${val}%)` : 'SST',
      type: type,
      value: val,
      appliesTo: 'subtotal_plus_service',
      isDiscount: false,
    };
  }

  // 3. GST (9% Singapore / regional preset)
  const isGST = lower.includes('gst');
  if (isGST) {
    if (explicitAmount !== undefined && explicitAmount !== 9) {
      return {
        name: 'GST (9%)',
        type: 'fixed',
        value: explicitAmount,
        appliesTo: 'subtotal_plus_service',
        isDiscount: false,
      };
    }
    if (val === 9 || lower.includes('9%')) {
      return {
        name: 'GST (9%)',
        type: 'percent',
        value: 9,
        appliesTo: 'subtotal_plus_service',
        isDiscount: false,
      };
    }
    return {
      name: val > 0 ? `GST (${val}%)` : 'GST',
      type: type,
      value: val,
      appliesTo: 'subtotal_plus_service',
      isDiscount: false,
    };
  }

  // 4. Discount (10% preset or custom)
  if (isDiscount) {
    if (explicitAmount !== undefined && explicitAmount !== 10) {
      return {
        name: rawName || 'Discount',
        type: 'fixed',
        value: explicitAmount,
        appliesTo: 'subtotal',
        isDiscount: true,
      };
    }
    if (val === 10 || lower.includes('10%')) {
      return {
        name: '10% Discount',
        type: 'percent',
        value: 10,
        appliesTo: 'subtotal',
        isDiscount: true,
      };
    }
    return {
      name: rawName || 'Discount',
      type: type,
      value: val,
      appliesTo: 'subtotal',
      isDiscount: true,
    };
  }

  // 5. Tip (15% preset or custom)
  const isTip = lower.includes('tip') || lower.includes('gratuity');
  if (isTip) {
    if (explicitAmount !== undefined && explicitAmount !== 15) {
      return {
        name: 'Tip',
        type: 'fixed',
        value: explicitAmount,
        appliesTo: 'subtotal',
        isDiscount: false,
      };
    }
    if (val === 15 || lower.includes('15%')) {
      return {
        name: 'Tip (15%)',
        type: 'percent',
        value: 15,
        appliesTo: 'subtotal',
        isDiscount: false,
      };
    }
    return {
      name: val > 0 ? `Tip (${val}%)` : 'Tip',
      type: type,
      value: val,
      appliesTo: 'subtotal',
      isDiscount: false,
    };
  }

  // Generic tax: in restaurant dining, taxes compound on subtotal + service charge
  if (lower.includes('tax') || lower.includes('vat')) {
    if (explicitAmount !== undefined) {
      return {
        name: rawName || 'Tax',
        type: 'fixed',
        value: explicitAmount,
        appliesTo: 'subtotal_plus_service',
        isDiscount: false,
      };
    }
    return {
      name: rawName || 'Tax',
      type: type,
      value: val,
      appliesTo: 'subtotal_plus_service',
      isDiscount: false,
    };
  }

  return {
    name: rawName || 'Extra Fee',
    type: explicitAmount !== undefined ? 'fixed' : type,
    value: explicitAmount !== undefined ? explicitAmount : val,
    appliesTo,
    isDiscount,
  };
}

export interface LineItem {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  assignedTo: string[]; // participant IDs
  notes?: string;
}

export interface Participant {
  id: string;
  name: string;
  color: string; // hex color for avatar/badge
  avatarLetter: string;
}

export interface PersonalBreakdown {
  participantId: string;
  participantName: string;
  color: string;
  items: {
    itemId: string;
    itemName: string;
    itemTotal: number;
    shareRatio: number; // e.g. 0.3333
    shareAmount: number; // dollar share for this item
  }[];
  rawSubtotal: number;
  feeShares: {
    feeId: string;
    feeName: string;
    amount: number;
    isDiscount: boolean;
  }[];
  totalFees: number;
  grandTotal: number;
  centsAdjustment: number; // penny allocation adjustment applied
  isLotteryWinner?: boolean;
}

export interface CalculationResult {
  itemsSubtotal: number;
  computedFees: {
    fee: ExtraFee;
    computedAmount: number;
  }[];
  calculatedGrandTotal: number;
  targetGrandTotal: number;
  discrepancy: number; // calculatedGrandTotal - targetGrandTotal
  isBalanced: boolean;
  unassignedItemIds: string[];
  allAssigned: boolean;
  breakdowns: Record<string, PersonalBreakdown>;
  roundingTotal?: number;
  roundingWinnerId?: string | null;
}

export type StepType = 1 | 2 | 3 | 4; // 1: Capture, 2: Review & Edit, 3: Assign, 4: Summary
