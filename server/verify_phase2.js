import { calculateMacros } from './utils/macroCalculator.js';
import assert from 'assert';

console.log('--- Phase 2 Verification Tests ---');

// Test Case 1: Standard male calculation
const maleProfile = {
  heightCm: 181,
  age: 22,
  gender: 'male',
  activityLevel: 'moderate',
  goal: 'maintain',
  targetOverrides: {},
};
const result1 = calculateMacros(maleProfile, 78);
console.log('Test 1: Standard Male:', result1);
assert.ok(result1);
assert.strictEqual(result1.bmr, 1806);
assert.strictEqual(result1.tdee, 2800);
assert.strictEqual(result1.calories, 2800);
assert.strictEqual(result1.protein, 140);
assert.strictEqual(result1.fat, 62);
assert.strictEqual(result1.carbs, 421);
console.log('✓ Test 1 Passed');

// Test Case 2: Gender 'other' (average)
const otherProfile = {
  ...maleProfile,
  gender: 'other',
};
const result2 = calculateMacros(otherProfile, 78);
console.log('Test 2: Gender Other:', result2);
assert.ok(result2);
assert.strictEqual(result2.bmr, 1723);
assert.strictEqual(result2.tdee, 2671);
assert.strictEqual(result2.calories, 2671);
assert.strictEqual(result2.protein, 140);
assert.strictEqual(result2.fat, 62);
assert.strictEqual(result2.carbs, 388);
console.log('✓ Test 2 Passed');

// Test Case 3: Overrides
const overrideProfile = {
  ...maleProfile,
  targetOverrides: {
    protein: 180,
  },
};
const result3 = calculateMacros(overrideProfile, 78);
console.log('Test 3: Overrides:', result3);
assert.ok(result3);
assert.strictEqual(result3.protein, 180);
assert.strictEqual(result3.calories, 2800);
assert.strictEqual(result3.fat, 62);
assert.strictEqual(result3.carbs, 381);
console.log('✓ Test 3 Passed');

// Test Case 4: Missing weight / fields handles gracefully
const missingProfile = {
  ...maleProfile,
  age: null,
};
const result4 = calculateMacros(missingProfile, 78);
console.log('Test 4: Missing profile field returns null:', result4);
assert.strictEqual(result4, null);

const result5 = calculateMacros(maleProfile, null);
console.log('Test 5: Missing weight returns null:', result5);
assert.strictEqual(result5, null);
console.log('✓ Tests 4 & 5 Passed');

console.log('All backend verification tests passed successfully!');
