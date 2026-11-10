import { normalizeFeeWithPresets } from '../src/types/receipt';

console.log('--- TESTING GEMINI / OCR FEE NORMALIZATION TO PRESETS ---');

// Test case 1: The exact case from user's screenshot
const test1 = normalizeFeeWithPresets({
  name: 'ServiceCrg 10%',
  type: 'percent',
  value: 10,
  appliesTo: 'subtotal',
});
console.log('Test 1 (ServiceCrg 10%):', test1);
if (test1.name !== 'Service Charge' || test1.value !== 10 || test1.appliesTo !== 'subtotal') {
  throw new Error(`Test 1 failed: ${JSON.stringify(test1)}`);
}

// Test case 2: Servce Tax 6% from user's screenshot
const test2 = normalizeFeeWithPresets({
  name: 'Servce Tax 6%',
  type: 'percent',
  value: 6,
  appliesTo: 'subtotal',
});
console.log('Test 2 (Servce Tax 6%):', test2);
if (test2.name !== 'SST (6%)' || test2.value !== 6 || test2.appliesTo !== 'subtotal_plus_service') {
  throw new Error(`Test 2 failed: ${JSON.stringify(test2)}`);
}

// Test case 3: 8% SST
const test3 = normalizeFeeWithPresets({
  name: 'Gov Tax 8%',
  type: 'percent',
  value: 8,
});
console.log('Test 3 (Gov Tax 8%):', test3);
if (test3.name !== 'SST (8%)' || test3.value !== 8 || test3.appliesTo !== 'subtotal_plus_service') {
  throw new Error(`Test 3 failed: ${JSON.stringify(test3)}`);
}

// Test case 4: 9% GST
const test4 = normalizeFeeWithPresets({
  name: 'GST 9%',
  type: 'percent',
  value: 9,
});
console.log('Test 4 (GST 9%):', test4);
if (test4.name !== 'GST (9%)' || test4.value !== 9 || test4.appliesTo !== 'subtotal_plus_service') {
  throw new Error(`Test 4 failed: ${JSON.stringify(test4)}`);
}

// Test case 5: 10% Discount
const test5 = normalizeFeeWithPresets({
  name: 'Member Disc 10%',
  type: 'percent',
  value: 10,
});
console.log('Test 5 (Member Disc 10%):', test5);
if (test5.name !== '10% Discount' || test5.value !== 10 || !test5.isDiscount) {
  throw new Error(`Test 5 failed: ${JSON.stringify(test5)}`);
}

// Test case 6: 15% Tip
const test6 = normalizeFeeWithPresets({
  name: 'Gratuity 15%',
  type: 'percent',
  value: 15,
});
console.log('Test 6 (Gratuity 15%):', test6);
if (test6.name !== 'Tip (15%)' || test6.value !== 15 || test6.appliesTo !== 'subtotal') {
  throw new Error(`Test 6 failed: ${JSON.stringify(test6)}`);
}

// Test case 7: Printed explicit amount (10.25) on 6% tax line
const test7 = normalizeFeeWithPresets({
  name: 'Servce Tax 6%',
  printedAmount: 10.25,
});
console.log('Test 7 (Explicit 10.25 on 6% tax):', test7);
if (test7.name !== 'SST (6%)' || test7.type !== 'fixed' || test7.value !== 10.25) {
  throw new Error(`Test 7 failed: ${JSON.stringify(test7)}`);
}

// Test case 8: User configured fixed amount on SST preset
const test8 = normalizeFeeWithPresets({
  name: 'SST (6%)',
  type: 'fixed',
  value: 10.25,
});
console.log('Test 8 (User fixed 10.25):', test8);
if (test8.name !== 'SST (6%)' || test8.type !== 'fixed' || test8.value !== 10.25) {
  throw new Error(`Test 8 failed: ${JSON.stringify(test8)}`);
}

console.log('✓ ALL PRESET NORMALIZATION TESTS PASSED SUCCESSFULLY!');
