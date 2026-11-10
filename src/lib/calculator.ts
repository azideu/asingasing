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

export function isRoundingFee(fee: ExtraFee): boolean {
  const name = fee.name.toLowerCase();
  const isNameMatching =
    name.includes('rounding') ||
    name.includes('round') ||
    name.includes('adj') ||
    name.includes('diff') ||
    name.includes('odd cent');
  // Fixed fee of 10 cents or less is intrinsically a cash rounding / odd-cent adjustment
  const isSmallFixedFee = fee.type === 'fixed' && fee.value > 0 && fee.value <= 0.10;
  return isNameMatching || isSmallFixedFee;
}

export function calculateReceiptSplit(
  items: LineItem[],
  fees: ExtraFee[],
  participants: Participant[],
  targetGrandTotal?: number | null,
  roundingWinnerId?: string | null
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
    const remainderCents = itemTotalCents % count;

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

  // Distribute fees proportionally (or allocate rounding fee to single designated payer)
  const assignedSubtotal = fromCents(totalAssignedSubtotalCents);
  const hasValidLotteryWinner =
    Boolean(roundingWinnerId) && participants.some((p) => p.id === roundingWinnerId);

  // Identify designated payer for rounding fees & cent differences:
  // Winner if lottery was drawn, otherwise default to the diner with largest subtotal (e.g. bill payer)
  const sortedParticipants = [...participants].sort((a, b) => {
    return (
      toCents(breakdowns[b.id].rawSubtotal) -
      toCents(breakdowns[a.id].rawSubtotal)
    );
  });
  const defaultRoundingPayerId = sortedParticipants.length > 0 ? sortedParticipants[0].id : participants[0]?.id;
  const designatedRoundingPayerId = hasValidLotteryWinner ? roundingWinnerId : defaultRoundingPayerId;

  for (const p of participants) {
    const b = breakdowns[p.id];
    let personalTotalFeeCents = 0;

    for (const cf of computedFees) {
      const feeCents = toCents(cf.computedAmount);
      const isRnd = isRoundingFee(cf.fee);
      let personalFeeShareCents = 0;

      if (isRnd) {
        // Rounding fees are absorbed 100% in whole by ONE person, NEVER split into fractions of a cent!
        personalFeeShareCents = p.id === designatedRoundingPayerId ? feeCents : 0;
      } else if (assignedSubtotal > 0) {
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
    if (p.id === designatedRoundingPayerId && hasValidLotteryWinner) {
      b.isLotteryWinner = true;
    }
  }

  // 6. Penny Rounding Protection
  // Ensure sum of all participants' payable exactly equals finalTargetTotalCents
  const totalAllocatedCents = participants.reduce((acc, p) => {
    return acc + toCents(breakdowns[p.id].grandTotal);
  }, 0);

  const centDifference = finalTargetTotalCents - totalAllocatedCents;
  // Only apply penny adjustments for small rounding discrepancies (<= 15 cents) or when all items are assigned
  const isMinorRoundingDifference = Math.abs(centDifference) <= Math.max(15, participants.length);

  if (centDifference !== 0 && participants.length > 0 && (allAssigned || isMinorRoundingDifference)) {
    // Single designated rounding payer absorbs the cent difference so other diners have 0 adjustment
    const targetPayerId = designatedRoundingPayerId && breakdowns[designatedRoundingPayerId]
      ? designatedRoundingPayerId
      : sortedParticipants[0].id;
    const b = breakdowns[targetPayerId];
    b.centsAdjustment += fromCents(centDifference);
    b.grandTotal = fromCents(toCents(b.grandTotal) + centDifference);
    if (hasValidLotteryWinner) {
      b.isLotteryWinner = true;
    }
  }

  // Calculate net rounding amount across the whole receipt
  let totalRoundingCents = centDifference;
  for (const cf of computedFees) {
    if (isRoundingFee(cf.fee)) {
      const amt = toCents(cf.computedAmount);
      totalRoundingCents += cf.fee.isDiscount ? -amt : amt;
    }
  }
  const roundingTotal = fromCents(totalRoundingCents);
  const isRoundingActive = Math.abs(totalRoundingCents) > 0;

  // If rounding is removed or zero, completely clear lottery winner flags from all diners
  if (!isRoundingActive) {
    for (const p of participants) {
      if (breakdowns[p.id]) {
        breakdowns[p.id].isLotteryWinner = false;
      }
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
    roundingTotal,
    roundingWinnerId: isRoundingActive && hasValidLotteryWinner ? roundingWinnerId : null,
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
