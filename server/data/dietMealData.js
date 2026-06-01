/**
 * Meal templates for AI diet planner (educational — regional Indian-friendly options).
 */

const GOAL_LABELS = {
  weight_loss: "Weight Loss",
  weight_gain: "Weight Gain",
  diabetes: "Diabetes Management",
  hypertension: "Hypertension (Low Sodium)",
  cholesterol: "Cholesterol Control",
};

const ALLERGY_KEYWORDS = {
  nuts: ["nut", "peanut", "almond", "walnut", "cashew"],
  dairy: ["milk", "yogurt", "curd", "paneer", "cheese", "ghee", "butter", "lassi"],
  gluten: ["wheat", "roti", "chapati", "bread", "naan", "pasta", "semolina", "rava"],
  shellfish: ["prawn", "shrimp", "crab", "lobster"],
  soy: ["soy", "tofu", "soya"],
  eggs: ["egg", "omelette", "bhurji"],
};

function meal(id, name, items, nutrition, opts = {}) {
  return {
    id,
    name,
    items,
    calories: nutrition.calories,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fat: nutrition.fat,
    fiber: nutrition.fiber || 0,
    sodium: nutrition.sodium || 0,
    dietTypes: opts.dietTypes || ["vegetarian", "eggetarian", "vegan"],
    goals: opts.goals || ["weight_loss", "weight_gain", "diabetes", "hypertension", "cholesterol"],
    allergens: opts.allergens || [],
    tags: opts.tags || [],
  };
}

const MEAL_POOL = {
  breakfast: {
    vegetarian: [
      meal("bv1", "Oats with banana & flax", ["Rolled oats 50g", "Banana", "Flax seeds", "Cinnamon"], { calories: 320, protein: 12, carbs: 52, fat: 8, fiber: 8, sodium: 80 }, { goals: ["weight_loss", "diabetes", "cholesterol"], tags: ["low_gi", "high_fiber"], allergens: [] }),
      meal("bv2", "Vegetable upma (millet)", ["Foxtail millet upma", "Peas, carrot", "Mustard tempering"], { calories: 340, protein: 10, carbs: 55, fat: 9, fiber: 7, sodium: 220 }, { goals: ["diabetes", "hypertension"], tags: ["low_gi"], allergens: ["gluten"] }),
      meal("bv3", "Idli with sambar", ["2 steamed idli", "Vegetable sambar 1 cup", "Coconut chutney (small)"], { calories: 380, protein: 14, carbs: 62, fat: 8, fiber: 6, sodium: 480 }, { dietTypes: ["vegetarian", "eggetarian"], goals: ["weight_loss", "hypertension"], tags: ["low_fat"] }),
      meal("bv4", "Greek-style yogurt parfait", ["Low-fat yogurt", "Berries", "Pumpkin seeds"], { calories: 290, protein: 18, carbs: 32, fat: 10, fiber: 5, sodium: 120 }, { goals: ["weight_gain", "weight_loss"], allergens: ["dairy"] }),
      meal("bv5", "Moong dal chilla", ["Moong batter pancake", "Mint chutney", "Salad"], { calories: 310, protein: 16, carbs: 38, fat: 9, fiber: 9, sodium: 200 }, { goals: ["diabetes", "cholesterol", "weight_loss"], tags: ["high_fiber", "low_gi"] }),
    ],
    eggetarian: [
      meal("be1", "Egg white omelette & toast", ["3 egg whites + 1 whole egg", "Multigrain toast", "Tomato, spinach"], { calories: 350, protein: 28, carbs: 28, fat: 12, fiber: 5, sodium: 420 }, { dietTypes: ["eggetarian", "non_vegetarian"], goals: ["weight_loss", "weight_gain"], allergens: ["eggs", "gluten"] }),
      meal("be2", "Boiled eggs & fruit", ["2 boiled eggs", "Apple or orange", "Green tea"], { calories: 280, protein: 18, carbs: 22, fat: 14, fiber: 4, sodium: 180 }, { dietTypes: ["eggetarian", "non_vegetarian"], goals: ["weight_loss", "diabetes"], allergens: ["eggs"] }),
    ],
    non_vegetarian: [
      meal("bn1", "Grilled chicken & veggies", ["Chicken breast 100g", "Steamed broccoli", "Olive oil drizzle"], { calories: 380, protein: 42, carbs: 12, fat: 16, fiber: 4, sodium: 280 }, { dietTypes: ["non_vegetarian"], goals: ["weight_loss", "weight_gain", "cholesterol"], tags: ["high_protein"] }),
      meal("bn2", "Fish curry & brown rice (small)", ["Rohu/salmon piece", "Light tomato curry", "Brown rice 1/2 cup"], { calories: 420, protein: 35, carbs: 45, fat: 12, fiber: 3, sodium: 520 }, { dietTypes: ["non_vegetarian"], goals: ["weight_gain", "diabetes"], allergens: ["shellfish"] }),
    ],
    vegan: [
      meal("bvg1", "Tofu scramble & salad", ["Tofu crumble", "Turmeric, peppers", "Mixed greens"], { calories: 300, protein: 20, carbs: 18, fat: 16, fiber: 6, sodium: 240 }, { dietTypes: ["vegan"], allergens: ["soy"] }),
      meal("bvg2", "Poha (flattened rice) veg", ["Poha", "Peanuts (optional skip)", "Lemon, peas"], { calories: 330, protein: 8, carbs: 58, fat: 8, fiber: 4, sodium: 190 }, { dietTypes: ["vegan", "vegetarian"], allergens: ["nuts"] }),
    ],
  },
  morningSnack: {
    vegetarian: [
      meal("sv1", "Apple & almonds", ["1 medium apple", "6 almonds"], { calories: 180, protein: 4, carbs: 24, fat: 9, fiber: 5, sodium: 5 }, { allergens: ["nuts"] }),
      meal("sv2", "Buttermilk (chaas)", ["Low-fat chaas 1 glass", "Roasted cumin"], { calories: 60, protein: 4, carbs: 6, fat: 2, fiber: 0, sodium: 180 }, { goals: ["hypertension", "weight_loss"], allergens: ["dairy"] }),
      meal("sv3", "Carrot sticks & hummus", ["Carrot", "Chickpea hummus 3 tbsp"], { calories: 150, protein: 6, carbs: 18, fat: 6, fiber: 5, sodium: 210 }),
    ],
    eggetarian: [meal("se1", "Hard-boiled egg", ["1 egg"], { calories: 78, protein: 6, carbs: 1, fat: 5, fiber: 0, sodium: 62 }, { dietTypes: ["eggetarian", "non_vegetarian"], allergens: ["eggs"] })],
    non_vegetarian: [meal("sn1", "Chicken soup cup", ["Clear chicken soup", "Vegetables"], { calories: 120, protein: 14, carbs: 8, fat: 4, fiber: 1, sodium: 380 }, { dietTypes: ["non_vegetarian"] })],
    vegan: [meal("svg1", "Orange & walnuts", ["Orange", "4 walnut halves"], { calories: 160, protein: 3, carbs: 20, fat: 9, fiber: 4, sodium: 2 }, { allergens: ["nuts"] })],
  },
  lunch: {
    vegetarian: [
      meal("lv1", "Dal, brown rice & salad", ["Masoor dal 1 cup", "Brown rice 3/4 cup", "Cucumber salad"], { calories: 520, protein: 22, carbs: 78, fat: 12, fiber: 12, sodium: 420 }, { goals: ["diabetes", "hypertension", "cholesterol"], tags: ["low_gi", "high_fiber"] }),
      meal("lv2", "2 roti, paneer bhurji (light)", ["Whole wheat roti x2", "Paneer bhurji small", "Raita"], { calories: 580, protein: 28, carbs: 62, fat: 24, fiber: 8, sodium: 650 }, { allergens: ["dairy", "gluten"] }),
      meal("lv3", "Quinoa vegetable bowl", ["Quinoa", "Roasted vegetables", "Tahini dressing light"], { calories: 480, protein: 16, carbs: 58, fat: 20, fiber: 10, sodium: 320 }, { goals: ["weight_loss", "cholesterol"] }),
      meal("lv4", "South Indian thali (light)", ["Sambar", "Rice 1/2 cup", "Poriyal", "Curd small"], { calories: 550, protein: 18, carbs: 82, fat: 14, fiber: 9, sodium: 720 }, { allergens: ["dairy"] }),
    ],
    eggetarian: [
      meal("le1", "Egg curry & roti", ["Egg curry 2 eggs", "1 roti", "Salad"], { calories: 520, protein: 26, carbs: 48, fat: 22, fiber: 5, sodium: 580 }, { allergens: ["eggs", "gluten"] }),
    ],
    non_vegetarian: [
      meal("ln1", "Grilled fish & veggies", ["Fish fillet 150g", "Sautéed beans", "Lemon"], { calories: 450, protein: 40, carbs: 20, fat: 22, fiber: 6, sodium: 380 }, { goals: ["weight_loss", "cholesterol", "hypertension"] }),
      meal("ln2", "Chicken tikka & salad", ["Chicken tikka 120g", "Green salad", "Mint dip"], { calories: 480, protein: 45, carbs: 15, fat: 26, fiber: 4, sodium: 520 }),
    ],
    vegan: [
      meal("lvg1", "Rajma & brown rice", ["Rajma curry", "Brown rice", "Onion salad"], { calories: 510, protein: 20, carbs: 80, fat: 10, fiber: 14, sodium: 450 }),
      meal("lvg2", "Chickpea salad bowl", ["Chickpeas", "Tomato, cucumber", "Olive oil 1 tsp"], { calories: 440, protein: 18, carbs: 52, fat: 18, fiber: 12, sodium: 290 }),
    ],
  },
  eveningSnack: {
    vegetarian: [
      meal("ev1", "Green tea & roasted chana", ["Green tea", "Roasted chana 30g"], { calories: 140, protein: 8, carbs: 18, fat: 4, fiber: 5, sodium: 90 }),
      meal("ev2", "Sprout chaat", ["Moong sprouts", "Lemon, spices", "Onion tomato"], { calories: 160, protein: 10, carbs: 22, fat: 3, fiber: 6, sodium: 150 }, { goals: ["diabetes", "weight_loss"] }),
      meal("ev3", "Fruit bowl", ["Papaya or berries 1 cup"], { calories: 90, protein: 1, carbs: 22, fat: 0, fiber: 4, sodium: 5 }, { goals: ["weight_loss", "diabetes"], tags: ["low_gi"] }),
    ],
    eggetarian: [],
    non_vegetarian: [meal("en1", "Turkey/chicken slice roll", ["Lean slice", "Lettuce wrap"], { calories: 150, protein: 22, carbs: 4, fat: 5, fiber: 1, sodium: 410 }, { dietTypes: ["non_vegetarian"] })],
    vegan: [meal("evg1", "Coconut water & peanuts", ["Coconut water", "Handful peanuts"], { calories: 170, protein: 5, carbs: 14, fat: 11, fiber: 3, sodium: 25 }, { allergens: ["nuts"] })],
  },
  dinner: {
    vegetarian: [
      meal("dv1", "Vegetable soup & salad", ["Mixed veg soup", "Large salad", "1 tsp olive oil"], { calories: 320, protein: 10, carbs: 38, fat: 14, fiber: 8, sodium: 380 }, { goals: ["weight_loss", "hypertension"] }),
      meal("dv2", "Palak dal & 1 roti", ["Spinach dal", "1 whole wheat roti", "Salad"], { calories: 420, protein: 18, carbs: 52, fat: 14, fiber: 10, sodium: 480 }, { allergens: ["gluten"] }),
      meal("dv3", "Grilled tofu & stir-fry", ["Tofu 120g", "Bell pepper stir-fry", "Brown rice 1/2 cup"], { calories: 460, protein: 24, carbs: 48, fat: 18, fiber: 7, sodium: 360 }, { dietTypes: ["vegan", "vegetarian"], allergens: ["soy"] }),
      meal("dv4", "Khichdi (light)", ["Moong dal khichdi", "Ghee 1 tsp", "Papad skip"], { calories: 400, protein: 14, carbs: 58, fat: 12, fiber: 6, sodium: 350 }, { goals: ["diabetes", "hypertension"], allergens: ["dairy"] }),
    ],
    eggetarian: [
      meal("de1", "Egg bhurji & roti", ["Egg bhurji", "1 roti", "Salad"], { calories: 450, protein: 24, carbs: 40, fat: 20, fiber: 4, sodium: 520 }, { allergens: ["eggs", "gluten"] }),
    ],
    non_vegetarian: [
      meal("dn1", "Baked chicken & vegetables", ["Chicken 120g", "Zucchini, beans"], { calories: 400, protein: 42, carbs: 18, fat: 18, fiber: 5, sodium: 340 }),
      meal("dn2", "Fish stew (light)", ["White fish", "Tomato broth", "Vegetables"], { calories: 380, protein: 36, carbs: 22, fat: 16, fiber: 4, sodium: 450 }),
    ],
    vegan: [
      meal("dvg1", "Lentil soup & salad", ["Red lentil soup", "Garden salad"], { calories: 350, protein: 18, carbs: 48, fat: 8, fiber: 12, sodium: 320 }),
    ],
  },
};

const GOAL_TIPS = {
  weight_loss: [
    "Aim for 0.5–1 kg loss per week — avoid extreme deficits",
    "Prioritize protein to preserve muscle",
    "Walk 30–45 minutes daily",
  ],
  weight_gain: [
    "Add healthy calorie-dense snacks (nuts, avocado, smoothies)",
    "Strength training 3x/week supports lean gain",
    "Eat every 3–4 hours",
  ],
  diabetes: [
    "Choose low-GI carbs and high fiber",
    "Avoid sugary drinks and refined flour",
    "Pair carbs with protein or healthy fat",
  ],
  hypertension: [
    "Keep sodium under 2,300 mg/day (ideally 1,500 mg)",
    "Increase potassium-rich foods (banana, spinach, beans)",
    "Limit processed and restaurant foods",
  ],
  cholesterol: [
    "Reduce saturated fat; choose lean protein and fish",
    "Add soluble fiber (oats, beans, flax)",
    "Limit fried foods and full-fat dairy",
  ],
};

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

module.exports = {
  GOAL_LABELS,
  ALLERGY_KEYWORDS,
  MEAL_POOL,
  GOAL_TIPS,
  DAY_NAMES,
};
