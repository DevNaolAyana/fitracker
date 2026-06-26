import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import GlobalFood from '../models/GlobalFood.js';

dotenv.config();

const foods = [
  // Protein sources
  { name: 'Chicken Breast', servingUnit: '100g', caloriesPerServing: 165, proteinPerServing: 31, carbsPerServing: 0, fatPerServing: 3.6 },
  { name: 'Whole Egg', servingUnit: '1 large', caloriesPerServing: 70, proteinPerServing: 6, carbsPerServing: 0.6, fatPerServing: 5 },
  { name: 'Egg White', servingUnit: '1 large', caloriesPerServing: 17, proteinPerServing: 3.6, carbsPerServing: 0.2, fatPerServing: 0.1 },
  { name: 'Lean Ground Beef', servingUnit: '100g', caloriesPerServing: 250, proteinPerServing: 26, carbsPerServing: 0, fatPerServing: 15 },
  { name: 'Salmon Fillet', servingUnit: '100g', caloriesPerServing: 208, proteinPerServing: 20, carbsPerServing: 0, fatPerServing: 13 },
  { name: 'Tuna (Canned in Water)', servingUnit: '100g', caloriesPerServing: 116, proteinPerServing: 26, carbsPerServing: 0, fatPerServing: 1 },
  { name: 'Firm Tofu', servingUnit: '100g', caloriesPerServing: 76, proteinPerServing: 8, carbsPerServing: 1.9, fatPerServing: 4.8 },
  { name: 'Red Lentils (Cooked)', servingUnit: '100g', caloriesPerServing: 116, proteinPerServing: 9, carbsPerServing: 20, fatPerServing: 0.4 },
  { name: 'Black Beans (Cooked)', servingUnit: '100g', caloriesPerServing: 132, proteinPerServing: 8.9, carbsPerServing: 23.7, fatPerServing: 0.5 },
  { name: 'Whey Protein Powder', servingUnit: '1 scoop (30g)', caloriesPerServing: 120, proteinPerServing: 24, carbsPerServing: 3, fatPerServing: 1.5 },
  { name: 'Greek Yogurt (Plain 0%)', servingUnit: '100g', caloriesPerServing: 59, proteinPerServing: 10, carbsPerServing: 3.6, fatPerServing: 0.4 },
  { name: 'Cottage Cheese (2%)', servingUnit: '100g', caloriesPerServing: 80, proteinPerServing: 11, carbsPerServing: 4, fatPerServing: 2.3 },
  { name: 'Turkey Breast', servingUnit: '100g', caloriesPerServing: 135, proteinPerServing: 30, carbsPerServing: 0, fatPerServing: 1 },
  { name: 'Tempeh', servingUnit: '100g', caloriesPerServing: 193, proteinPerServing: 19, carbsPerServing: 9, fatPerServing: 11 },

  // Carb sources
  { name: 'White Rice (Cooked)', servingUnit: '100g', caloriesPerServing: 130, proteinPerServing: 2.7, carbsPerServing: 28, fatPerServing: 0.3 },
  { name: 'Brown Rice (Cooked)', servingUnit: '100g', caloriesPerServing: 111, proteinPerServing: 2.6, carbsPerServing: 23, fatPerServing: 0.9 },
  { name: 'Rolled Oats (Dry)', servingUnit: '40g', caloriesPerServing: 150, proteinPerServing: 5, carbsPerServing: 27, fatPerServing: 3 },
  { name: 'Whole Wheat Bread', servingUnit: '1 slice (30g)', caloriesPerServing: 80, proteinPerServing: 4, carbsPerServing: 15, fatPerServing: 1 },
  { name: 'White Bread', servingUnit: '1 slice (25g)', caloriesPerServing: 67, proteinPerServing: 2, carbsPerServing: 13, fatPerServing: 0.8 },
  { name: 'Pasta (Cooked)', servingUnit: '100g', caloriesPerServing: 158, proteinPerServing: 5.8, carbsPerServing: 31, fatPerServing: 0.9 },
  { name: 'Potato (Boiled)', servingUnit: '100g', caloriesPerServing: 87, proteinPerServing: 1.9, carbsPerServing: 20, fatPerServing: 0.1 },
  { name: 'Sweet Potato (Baked)', servingUnit: '100g', caloriesPerServing: 90, proteinPerServing: 2, carbsPerServing: 21, fatPerServing: 0.2 },
  { name: 'Quinoa (Cooked)', servingUnit: '100g', caloriesPerServing: 120, proteinPerServing: 4.4, carbsPerServing: 21.3, fatPerServing: 1.9 },
  { name: 'Jasmine Rice (Cooked)', servingUnit: '100g', caloriesPerServing: 129, proteinPerServing: 2.5, carbsPerServing: 28, fatPerServing: 0.2 },
  { name: 'Couscous (Cooked)', servingUnit: '100g', caloriesPerServing: 112, proteinPerServing: 3.8, carbsPerServing: 23, fatPerServing: 0.2 },

  // Fruits
  { name: 'Banana', servingUnit: '1 medium', caloriesPerServing: 105, proteinPerServing: 1.3, carbsPerServing: 27, fatPerServing: 0.3 },
  { name: 'Apple', servingUnit: '1 medium', caloriesPerServing: 95, proteinPerServing: 0.5, carbsPerServing: 25, fatPerServing: 0.3 },
  { name: 'Orange', servingUnit: '1 medium', caloriesPerServing: 62, proteinPerServing: 1.2, carbsPerServing: 15.4, fatPerServing: 0.2 },
  { name: 'Blueberries', servingUnit: '100g', caloriesPerServing: 57, proteinPerServing: 0.7, carbsPerServing: 14, fatPerServing: 0.3 },
  { name: 'Strawberries', servingUnit: '100g', caloriesPerServing: 32, proteinPerServing: 0.7, carbsPerServing: 7.7, fatPerServing: 0.3 },
  { name: 'Raspberries', servingUnit: '100g', caloriesPerServing: 52, proteinPerServing: 1.2, carbsPerServing: 12, fatPerServing: 0.7 },
  { name: 'Avocado', servingUnit: '1 medium', caloriesPerServing: 240, proteinPerServing: 3, carbsPerServing: 12, fatPerServing: 22 },
  { name: 'Grapes', servingUnit: '100g', caloriesPerServing: 69, proteinPerServing: 0.7, carbsPerServing: 18, fatPerServing: 0.2 },
  { name: 'Watermelon', servingUnit: '100g', caloriesPerServing: 30, proteinPerServing: 0.6, carbsPerServing: 7.6, fatPerServing: 0.2 },

  // Vegetables
  { name: 'Broccoli (Raw)', servingUnit: '100g', caloriesPerServing: 34, proteinPerServing: 2.8, carbsPerServing: 7, fatPerServing: 0.4 },
  { name: 'Spinach (Raw)', servingUnit: '100g', caloriesPerServing: 23, proteinPerServing: 2.9, carbsPerServing: 3.6, fatPerServing: 0.4 },
  { name: 'Carrots (Raw)', servingUnit: '100g', caloriesPerServing: 41, proteinPerServing: 0.9, carbsPerServing: 10, fatPerServing: 0.2 },
  { name: 'Cucumber (Raw)', servingUnit: '100g', caloriesPerServing: 15, proteinPerServing: 0.7, carbsPerServing: 3.6, fatPerServing: 0.1 },
  { name: 'Cherry Tomatoes', servingUnit: '100g', caloriesPerServing: 18, proteinPerServing: 0.9, carbsPerServing: 3.9, fatPerServing: 0.2 },
  { name: 'Zucchini', servingUnit: '100g', caloriesPerServing: 17, proteinPerServing: 1.2, carbsPerServing: 3.1, fatPerServing: 0.3 },
  { name: 'Bell Pepper', servingUnit: '1 medium', caloriesPerServing: 31, proteinPerServing: 1, carbsPerServing: 6, fatPerServing: 0.3 },

  // Dairy & Alternatives
  { name: 'Whole Milk', servingUnit: '240ml', caloriesPerServing: 149, proteinPerServing: 8, carbsPerServing: 12, fatPerServing: 8 },
  { name: 'Skim Milk', servingUnit: '240ml', caloriesPerServing: 83, proteinPerServing: 8, carbsPerServing: 12, fatPerServing: 0.2 },
  { name: 'Almond Milk (Unsweetened)', servingUnit: '240ml', caloriesPerServing: 30, proteinPerServing: 1, carbsPerServing: 1, fatPerServing: 2.5 },
  { name: 'Cheddar Cheese', servingUnit: '28g', caloriesPerServing: 113, proteinPerServing: 7, carbsPerServing: 0.4, fatPerServing: 9 },
  { name: 'Mozzarella Cheese', servingUnit: '28g', caloriesPerServing: 85, proteinPerServing: 6, carbsPerServing: 1, fatPerServing: 6 },

  // Fats & Oils & Nuts
  { name: 'Extra Virgin Olive Oil', servingUnit: '1 tbsp (14g)', caloriesPerServing: 119, proteinPerServing: 0, carbsPerServing: 0, fatPerServing: 13.5 },
  { name: 'Peanut Butter (Smooth)', servingUnit: '1 tbsp (16g)', caloriesPerServing: 94, proteinPerServing: 4, carbsPerServing: 3, fatPerServing: 8 },
  { name: 'Almonds', servingUnit: '1 oz (28g)', caloriesPerServing: 164, proteinPerServing: 6, carbsPerServing: 6, fatPerServing: 14 },
  { name: 'Walnuts', servingUnit: '1 oz (28g)', caloriesPerServing: 185, proteinPerServing: 4.3, carbsPerServing: 3.9, fatPerServing: 18.5 },
  { name: 'Butter', servingUnit: '1 tbsp (14g)', caloriesPerServing: 102, proteinPerServing: 0.1, carbsPerServing: 0, fatPerServing: 11.5 },
  { name: 'Coconut Oil', servingUnit: '1 tbsp (14g)', caloriesPerServing: 117, proteinPerServing: 0, carbsPerServing: 0, fatPerServing: 13.6 }
];

const seedGlobalFoods = async () => {
  try {
    await connectDB();
    console.log('Database connected for seeding...');

    console.log(`Seeding ${foods.length} global foods...`);
    const operations = foods.map(food => ({
      updateOne: {
        filter: { name: food.name },
        update: { $set: food },
        upsert: true
      }
    }));

    const result = await GlobalFood.bulkWrite(operations);
    console.log('Seeding completed successfully!');
    console.log(`Matched: ${result.matchedCount}, Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`);

    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
};

seedGlobalFoods();
