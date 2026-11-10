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
