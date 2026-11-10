import { calculateReceiptSplit, formatCurrency } from '../src/lib/calculator';
import { SAMPLE_PARTICIPANTS } from '../src/lib/sampleReceipts';
import { ExtraFee, LineItem } from '../src/types/receipt';

console.log('--- RUNNING BETSUBETSU MATHEMATICAL VERIFICATION ---\n');

// Test 1: Multi-item dinner with 10% Service Charge and 6% SST
const testItems1: LineItem[] = [
  { id: 'item-1', name: 'Maki Platter', qty: 1, unitPrice: 30.0, totalPrice: 30.0, assignedTo: ['p-kenji', 'p-aya'] },
  { id: 'item-2', name: 'Wagyu Beef', qty: 1, unitPrice: 40.0, totalPrice: 40.0, assignedTo: ['p-kenji'] },
  { id: 'item-3', name: 'Green Tea', qty: 2, unitPrice: 5.0, totalPrice: 10.0, assignedTo: ['p-kenji', 'p-aya'] },
];
const testFees1: ExtraFee[] = [
  { id: 'fee-1', name: 'Service Charge (10%)', type: 'percent', value: 10, appliesTo: 'subtotal' },
  { id: 'fee-2', name: 'Gov Service Tax (6%)', type: 'percent', value: 6, appliesTo: 'subtotal' },
];
const testParticipants1 = SAMPLE_PARTICIPANTS.slice(0, 2);
const res1 = calculateReceiptSplit(testItems1, testFees1, testParticipants1, 92.80);

console.log(`[Test 1: Dinner with Tax & Service]`);
console.log(`- Items Subtotal: ${formatCurrency(res1.itemsSubtotal)}`);
console.log(`- Calculated Total: ${formatCurrency(res1.calculatedGrandTotal)}`);
console.log(`- Target Total: ${formatCurrency(res1.targetGrandTotal)}`);
console.log(`- Balanced: ${res1.isBalanced}`);

let sum1 = 0;
for (const p of testParticipants1) {
  const b = res1.breakdowns[p.id];
  console.log(`  * ${p.name}: ${formatCurrency(b.grandTotal)} (Subtotal: ${formatCurrency(b.rawSubtotal)}, Fees: ${formatCurrency(b.totalFees)})`);
  sum1 += b.grandTotal;
}

const diff1 = Math.abs(sum1 - res1.targetGrandTotal);
console.log(`- Sum of Diners: ${formatCurrency(sum1)} vs Target ${formatCurrency(res1.targetGrandTotal)} (Residual: ${diff1.toFixed(4)})\n`);
if (diff1 > 0.001) {
  throw new Error('Test 1 Failed: Sum does not match target!');
}

// Test 2: Penny Rounding Allocation (Split RM 10.00 between 3 people)
const itemsTest2: LineItem[] = [
  {
    id: 'item-1',
    name: 'Shared Pizza',
    qty: 1,
    unitPrice: 10.0,
    totalPrice: 10.0,
    assignedTo: ['p-kenji', 'p-aya', 'p-daisuke'],
  },
];
const feesTest2: ExtraFee[] = [];
const participantsTest2 = SAMPLE_PARTICIPANTS.slice(0, 3);
const res2 = calculateReceiptSplit(itemsTest2, feesTest2, participantsTest2, 10.0);

console.log(`[Test 2: Penny Rounding Protection on RM 10.00 / 3 people]`);
let sumTest2 = 0;
for (const p of participantsTest2) {
  const b = res2.breakdowns[p.id];
  console.log(`  * ${p.name}: ${formatCurrency(b.grandTotal)} (Adj: ${formatCurrency(b.centsAdjustment)})`);
  sumTest2 += b.grandTotal;
}
console.log(`- Sum of Diners: ${formatCurrency(sumTest2)} vs Target: RM 10.00`);
if (Math.abs(sumTest2 - 10.0) > 0.001) {
  throw new Error('Test 2 Failed: Penny rounding protection did not balance to RM 10.00!');
}

console.log('\n✓ ALL MATHEMATICAL CHECKS PASSED WITH EXACT CENT PRECISION IN MYR (RM)!');
