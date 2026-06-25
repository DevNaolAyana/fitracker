/**
 * Calculate BMR, TDEE, and macro targets based on profile parameters and weight.
 * 
 * BMR (Mifflin-St Jeor):
 * - male: 10 * weightKg + 6.25 * heightCm - 5 * age + 5
 * - female: 10 * weightKg + 6.25 * heightCm - 5 * age - 161
 * - other: average of male and female results (10 * weightKg + 6.25 * heightCm - 5 * age - 78)
 * 
 * TDEE = BMR * activityMultiplier
 * - sedentary: 1.2
 * - light: 1.375
 * - moderate: 1.55
 * - active: 1.725
 * - very_active: 1.9
 * 
 * Calories adjusted by goal:
 * - lose: TDEE - 500
 * - maintain: TDEE
 * - gain: TDEE + 300
 * 
 * Macros:
 * - Protein: 1.8 g per kg bodyweight
 * - Fat: 0.8 g per kg bodyweight
 * - Carbs: (calorieTarget - proteinTarget * 4 - fatTarget * 9) / 4 (floored at 0)
 * 
 * If overrides are provided in targetOverrides, they replace the auto-calculated values.
 * If calories or macros are overridden, they are used to compute remaining values (e.g. carbs formula).
 */
export function calculateMacros({ heightCm, age, gender, activityLevel, goal, targetOverrides }, weightKg) {
  if (!weightKg || !heightCm || !age || !gender || !activityLevel) {
    return null;
  }

  // BMR
  let bmr;
  if (gender === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else if (gender === 'female') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  } else {
    // other/unspecified: average of male and female
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 78;
  }

  // Activity multiplier
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  const multiplier = multipliers[activityLevel] || 1.2;
  const tdee = bmr * multiplier;

  // Calorie adjustments
  let calorieTarget = tdee;
  if (goal === 'lose') {
    calorieTarget = tdee - 500;
  } else if (goal === 'gain') {
    calorieTarget = tdee + 300;
  }

  // Base macro calculations (before overrides)
  const baseProtein = 1.8 * weightKg;
  const baseFat = 0.8 * weightKg;

  // Merge with overrides
  const finalCalories = targetOverrides?.calories || Math.round(calorieTarget);
  const finalProtein = targetOverrides?.protein || Math.round(baseProtein);
  const finalFat = targetOverrides?.fat || Math.round(baseFat);

  // Carbs are the remainder, or override if specified.
  // Note: when protein or fat are overridden but carbs are not, carbs are still recomputed
  // from the effective (overridden) protein/fat values against the calorie target. This is
  // intentional — it keeps total macros (P×4 + C×4 + F×9) consistent with the calorie target
  // instead of silently leaving an unaccounted-for gap in the macro budget.
  let finalCarbs;
  if (targetOverrides?.carbs !== undefined && targetOverrides?.carbs !== null && targetOverrides?.carbs !== 0) {
    finalCarbs = targetOverrides.carbs;
  } else {
    finalCarbs = Math.max(0, Math.round((finalCalories - finalProtein * 4 - finalFat * 9) / 4));
  }

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calories: Math.round(finalCalories),
    protein: Math.round(finalProtein),
    fat: Math.round(finalFat),
    carbs: Math.round(finalCarbs),
  };
}
