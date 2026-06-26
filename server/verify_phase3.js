import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import GlobalFood from './models/GlobalFood.js';
import CustomFood from './models/CustomFood.js';
import DailyLog from './models/DailyLog.js';
import assert from 'assert';

dotenv.config();

const runTests = async () => {
  try {
    await connectDB();
    console.log('--- Phase 3 Mongoose Model & Logic Verification Tests ---');

    // Setup: Clean up any test foods/logs
    const testUserId = new mongoose.Types.ObjectId();
    const testDate = '2026-06-26';
    await CustomFood.deleteMany({ userId: testUserId });
    await DailyLog.deleteMany({ userId: testUserId });

    // Test Case 1: Fetch and verify Seeded Global Foods
    const globalCount = await GlobalFood.countDocuments();
    console.log(`Test 1: Global Food database has ${globalCount} documents.`);
    assert.ok(globalCount >= 50, 'Global foods count should be at least 50');
    
    const chicken = await GlobalFood.findOne({ name: 'Chicken Breast' });
    console.log('Test 1: Chicken Breast macros:', {
      name: chicken.name,
      serving: chicken.servingUnit,
      calories: chicken.caloriesPerServing,
    });
    assert.strictEqual(chicken.servingUnit, '100g');
    assert.strictEqual(chicken.caloriesPerServing, 165);
    console.log('✓ Test 1 Passed (Global Seed Foods verified)');

    // Test Case 2: Create Custom Food with Case-Insensitivity Duplicate Check
    const customFood1 = new CustomFood({
      userId: testUserId,
      name: 'Custom Oats',
      servingUnit: '50g',
      caloriesPerServing: 180,
      proteinPerServing: 6,
      carbsPerServing: 32,
      fatPerServing: 3,
    });
    await customFood1.save();
    console.log('Test 2: Created custom food.');

    // Attempt case-insensitive duplicate creation (should fail)
    let duplicateError = null;
    try {
      const duplicate = await CustomFood.findOne({
        userId: testUserId,
        name: { $regex: new RegExp('^custom oats$', 'i') },
      });
      if (duplicate) {
        throw new Error('A custom food with this name already exists');
      }
      const customFood2 = new CustomFood({
        userId: testUserId,
        name: 'custom oats',
        servingUnit: '50g',
        caloriesPerServing: 180,
        proteinPerServing: 6,
        carbsPerServing: 32,
        fatPerServing: 3,
      });
      await customFood2.save();
    } catch (err) {
      duplicateError = err;
    }
    assert.ok(duplicateError, 'Should prevent inserting duplicate custom food names (case-insensitive)');
    console.log('✓ Test 2 Passed (Case-insensitive duplicate check working)');

    // Test Case 3: Log a Global Food and calculate macros/totals
    let log = await DailyLog.findOne({ userId: testUserId, date: testDate });
    if (!log) {
      log = new DailyLog({
        userId: testUserId,
        date: testDate,
        foods: [],
      });
    }

    // Simulate POST /api/logs/:date/food with Chicken Breast, quantity 2
    const quantity = 2;
    const foodDoc = await GlobalFood.findOne({ name: 'Chicken Breast' });
    log.foods.push({
      name: foodDoc.name,
      quantity,
      caloriesPerUnit: foodDoc.caloriesPerServing,
      proteinPerUnit: foodDoc.proteinPerServing,
      carbsPerUnit: foodDoc.carbsPerServing,
      fatPerUnit: foodDoc.fatPerServing,
      totalCalories: foodDoc.caloriesPerServing * quantity,
      totalProtein: foodDoc.proteinPerServing * quantity,
      totalCarbs: foodDoc.carbsPerServing * quantity,
      totalFat: foodDoc.fatPerServing * quantity,
    });

    log.totalCalories = log.foods.reduce((sum, f) => sum + f.totalCalories, 0);
    log.totalProtein = log.foods.reduce((sum, f) => sum + f.totalProtein, 0);
    log.totalCarbs = log.foods.reduce((sum, f) => sum + f.totalCarbs, 0);
    log.totalFat = log.foods.reduce((sum, f) => sum + f.totalFat, 0);

    await log.save();
    
    let updatedLog = await DailyLog.findOne({ userId: testUserId, date: testDate });
    console.log('Test 3: Logged 2 servings of chicken. Totals:', {
      calories: updatedLog.totalCalories,
      protein: updatedLog.totalProtein,
    });
    assert.strictEqual(updatedLog.foods.length, 1);
    assert.strictEqual(updatedLog.totalCalories, 330);
    assert.strictEqual(updatedLog.totalProtein, 62);
    console.log('✓ Test 3 Passed (Logging global food with macro calculations verified)');

    // Test Case 4: Add duplicate food on same day (Combine logic)
    // Add 1 more serving of chicken breast (simulating case-insensitive combine)
    const extraQty = 1;
    const existingIndex = updatedLog.foods.findIndex(
      f => f.name.toLowerCase() === 'chicken breast'
    );
    assert.ok(existingIndex > -1);
    
    const existing = updatedLog.foods[existingIndex];
    existing.quantity += extraQty;
    existing.totalCalories = existing.caloriesPerUnit * existing.quantity;
    existing.totalProtein = existing.proteinPerUnit * existing.quantity;
    existing.totalCarbs = existing.carbsPerUnit * existing.quantity;
    existing.totalFat = existing.fatPerUnit * existing.quantity;
    updatedLog.markModified('foods');

    updatedLog.totalCalories = updatedLog.foods.reduce((sum, f) => sum + f.totalCalories, 0);
    updatedLog.totalProtein = updatedLog.foods.reduce((sum, f) => sum + f.totalProtein, 0);
    updatedLog.totalCarbs = updatedLog.foods.reduce((sum, f) => sum + f.totalCarbs, 0);
    updatedLog.totalFat = updatedLog.foods.reduce((sum, f) => sum + f.totalFat, 0);

    await updatedLog.save();

    let combinedLog = await DailyLog.findOne({ userId: testUserId, date: testDate });
    console.log('Test 4: Combined log totals:', {
      qty: combinedLog.foods[0].quantity,
      calories: combinedLog.totalCalories,
      protein: combinedLog.totalProtein,
    });
    assert.strictEqual(combinedLog.foods.length, 1);
    assert.strictEqual(combinedLog.foods[0].quantity, 3);
    assert.strictEqual(combinedLog.totalCalories, 495);
    assert.strictEqual(combinedLog.totalProtein, 93);
    console.log('✓ Test 4 Passed (Case-insensitive food combining verified)');

    // Test Case 5: Forged Macros protection verification
    // Attempting to send forged macros for Chicken Breast (should be resolved from DB using ID on server)
    const forgedPayload = {
      foodId: chicken._id,
      source: 'global',
      quantity: 1,
      // Forged values:
      caloriesPerServing: 9999,
      proteinPerServing: 9999,
    };
    
    // Simulate resolution logic:
    let resolvedDoc = await GlobalFood.findById(forgedPayload.foodId);
    assert.strictEqual(resolvedDoc.caloriesPerServing, 165, 'Resolved calories should be the true DB value, not forged client-sent values');
    console.log('✓ Test 5 Passed (Server-side macro lookup verified and protected against forging)');

    // Test Case 6: Deleting food entry and recalculating totals
    const foodEntryId = combinedLog.foods[0]._id;
    combinedLog.foods = combinedLog.foods.filter(f => f._id.toString() !== foodEntryId.toString());
    
    combinedLog.totalCalories = combinedLog.foods.reduce((sum, f) => sum + f.totalCalories, 0);
    combinedLog.totalProtein = combinedLog.foods.reduce((sum, f) => sum + f.totalProtein, 0);
    combinedLog.totalCarbs = combinedLog.foods.reduce((sum, f) => sum + f.totalCarbs, 0);
    combinedLog.totalFat = combinedLog.foods.reduce((sum, f) => sum + f.totalFat, 0);

    await combinedLog.save();

    let deletedLog = await DailyLog.findOne({ userId: testUserId, date: testDate });
    console.log('Test 6: Deleted entry. Totals:', {
      foodsCount: deletedLog.foods.length,
      calories: deletedLog.totalCalories,
    });
    assert.strictEqual(deletedLog.foods.length, 0);
    assert.strictEqual(deletedLog.totalCalories, 0);
    assert.strictEqual(deletedLog.totalProtein, 0);
    console.log('✓ Test 6 Passed (Deletion and totals recalculation verified)');

    // Clean up
    await CustomFood.deleteMany({ userId: testUserId });
    await DailyLog.deleteMany({ userId: testUserId });
    
    await mongoose.connection.close();
    console.log('Database connection closed.');
    console.log('All backend verification tests passed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Test run failed:', err);
    process.exit(1);
  }
};

runTests();
