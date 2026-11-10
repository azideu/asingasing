import {
  ExtraFee,
  LineItem,
  Participant,
  CalculationResult,
  PersonalBreakdown,
} from '@/types/receipt';

// Helper to convert dollars to cents safely
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

// Helper to convert cents to dollars
export function fromCents(cents: number): number {
  return cents / 100;
}

export function calculateReceiptSplit(
  items: LineItem[],
  fees: ExtraFee[],
  participants: Participant[],
  targetGrandTotal?: number | null
): CalculationResult {
  // 1. Calculate raw items subtotal in cents
  const itemsSubtotalCents = items.reduce((acc, item) => {
    return acc + toCents(item.totalPrice);
  }, 0);
  const itemsSubtotal = fromCents(itemsSubtotalCents);

  // 2. Identify service charge or subtotal base for compounding rules
  let serviceChargeAmount = 0;
  const computedFees: { fee: ExtraFee; computedAmount: number }[] = [];

  // Pass 1: calculate fees that apply strictly to subtotal
  for (const fee of fees) {
    if (fee.appliesTo === 'subtotal') {
      let amount = 0;
      if (fee.type === 'percent') {
        amount = fromCents(Math.round((itemsSubtotalCents * fee.value) / 100));
      } else {
        amount = fee.value;
      }
      computedFees.push({ fee, computedAmount: amount });
      if (
        !fee.isDiscount &&
        fee.name.toLowerCase().includes('service')
      ) {
        serviceChargeAmount += amount;
      }
    }
  }

  // Pass 2: calculate fees that compound on subtotal + service charge
  const subtotalPlusServiceCents = itemsSubtotalCents + toCents(serviceChargeAmount);
  for (const fee of fees) {
    if (fee.appliesTo === 'subtotal_plus_service') {
      let amount = 0;
      if (fee.type === 'percent') {
        amount = fromCents(Math.round((subtotalPlusServiceCents * fee.value) / 100));
      } else {
        amount = fee.value;
      }
      computedFees.push({ fee, computedAmount: amount });
    }
  }

  // 3. Compute Net Extra Charges
  let totalFeesCents = 0;
  for (const cf of computedFees) {
    const feeCents = toCents(cf.computedAmount);
    if (cf.fee.isDiscount) {
      totalFeesCents -= feeCents;
    } else {
      totalFeesCents += feeCents;
    }
  }

  const calculatedGrandTotalCents = itemsSubtotalCents + totalFeesCents;
  const calculatedGrandTotal = fromCents(calculatedGrandTotalCents);

  // Target total defaults to calculated total if not provided or 0
  const finalTargetTotalCents =
    targetGrandTotal && targetGrandTotal > 0
      ? toCents(targetGrandTotal)
      : calculatedGrandTotalCents;
  const finalTargetTotal = fromCents(finalTargetTotalCents);

  const discrepancyCents = calculatedGrandTotalCents - finalTargetTotalCents;
  const discrepancy = fromCents(discrepancyCents);
  const isBalanced = Math.abs(discrepancyCents) === 0;

  // 4. Check unassigned items
  const unassignedItemIds = items
    .filter((item) => !item.assignedTo || item.assignedTo.length === 0)
    .map((item) => item.id);
  const allAssigned = items.length > 0 && unassignedItemIds.length === 0;

  // 5. Personal allocation
  const breakdowns: Record<string, PersonalBreakdown> = {};

  if (participants.length === 0) {
    return {
      itemsSubtotal,
      computedFees,
      calculatedGrandTotal,
      targetGrandTotal: finalTargetTotal,
      discrepancy,
      isBalanced,
      unassignedItemIds,
      allAssigned,
      breakdowns,
    };
  }

  // Initialize participant breakdowns
  for (const p of participants) {
    breakdowns[p.id] = {
      participantId: p.id,
      participantName: p.name,
      color: p.color,
      items: [],
      rawSubtotal: 0,
      feeShares: [],
      totalFees: 0,
      grandTotal: 0,
      centsAdjustment: 0,
    };
  }

  // Distribute items
  let totalAssignedSubtotalCents = 0;

  for (const item of items) {
    const assignedIds = item.assignedTo || [];
    if (assignedIds.length === 0) continue;

    const count = assignedIds.length;
    const itemTotalCents = toCents(item.totalPrice);
    const baseShareCents = Math.floor(itemTotalCents / count);
    let remainderCents = itemTotalCents % count;

    assignedIds.forEach((pid, idx) => {
      if (!breakdowns[pid]) return;
      // distribute leftover 1 cent remainder to early assignees
      const personalItemCents = baseShareCents + (idx < remainderCents ? 1 : 0);
      const personalItemAmount = fromCents(personalItemCents);

      breakdowns[pid].items.push({
        itemId: item.id,
        itemName: item.name,
        itemTotal: item.totalPrice,
        shareRatio: 1 / count,
        shareAmount: personalItemAmount,
      });

      breakdowns[pid].rawSubtotal += personalItemAmount;
      totalAssignedSubtotalCents += personalItemCents;
    });
  }

  // Distribute fees proportionally
  const assignedSubtotal = fromCents(totalAssignedSubtotalCents);

  for (const p of participants) {
    const b = breakdowns[p.id];
    let personalTotalFeeCents = 0;

    for (const cf of computedFees) {
      const feeCents = toCents(cf.computedAmount);
      let personalFeeShareCents = 0;

      if (assignedSubtotal > 0) {
        // Proportion based on personal raw subtotal
        personalFeeShareCents = Math.round(
          (feeCents * toCents(b.rawSubtotal)) / totalAssignedSubtotalCents
        );
      } else {
        // If no items assigned yet, split fees equally
        personalFeeShareCents = Math.round(feeCents / participants.length);
      }

      const personalFeeShare = fromCents(personalFeeShareCents);
      b.feeShares.push({
        feeId: cf.fee.id,
        feeName: cf.fee.name,
        amount: personalFeeShare,
        isDiscount: !!cf.fee.isDiscount,
      });

      if (cf.fee.isDiscount) {
        personalTotalFeeCents -= personalFeeShareCents;
      } else {
        personalTotalFeeCents += personalFeeShareCents;
      }
    }

    b.totalFees = fromCents(personalTotalFeeCents);
    b.grandTotal = fromCents(toCents(b.rawSubtotal) + personalTotalFeeCents);
  }

  // 6. Penny Rounding Protection
  // Ensure sum of all participants' payable exactly equals finalTargetTotalCents
  const totalAllocatedCents = participants.reduce((acc, p) => {
    return acc + toCents(breakdowns[p.id].grandTotal);
  }, 0);

  const centDifference = finalTargetTotalCents - totalAllocatedCents;

  if (centDifference !== 0 && participants.length > 0) {
    // Sort participants by raw subtotal descending (largest shareholders get/absorb penny adjustments)
    const sortedParticipants = [...participants].sort((a, b) => {
      return (
        toCents(breakdowns[b.id].rawSubtotal) -
        toCents(breakdowns[a.id].rawSubtotal)
      );
    });

    const step = centDifference > 0 ? 1 : -1;
    let remainingAdjustment = Math.abs(centDifference);
    let pIdx = 0;

    while (remainingAdjustment > 0) {
      const pid = sortedParticipants[pIdx % sortedParticipants.length].id;
      const b = breakdowns[pid];
      b.centsAdjustment += fromCents(step);
      b.grandTotal = fromCents(toCents(b.grandTotal) + step);
      remainingAdjustment -= 1;
      pIdx++;
    }
  }

  return {
    itemsSubtotal,
    computedFees,
    calculatedGrandTotal,
    targetGrandTotal: finalTargetTotal,
    discrepancy,
    isBalanced,
    unassignedItemIds,
    allAssigned,
    breakdowns,
  };
}

export function formatCurrency(amount: number, symbol = 'RM'): string {
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const prefix = symbol === 'RM' ? 'RM ' : symbol;
  if (amount < 0) {
    return `-${prefix}${formatted}`;
  }
  return `${prefix}${formatted}`;
}
