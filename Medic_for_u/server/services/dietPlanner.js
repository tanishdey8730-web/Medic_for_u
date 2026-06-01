const {
  GOAL_LABELS,
  ALLERGY_KEYWORDS,
  MEAL_POOL,
  GOAL_TIPS,
  DAY_NAMES,
} = require("../data/dietMealData");

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_CALORIE_ADJUST = {
  weight_loss: -500,
  weight_gain: 400,
  diabetes: -200,
  hypertension: -150,
  cholesterol: -250,
};

const GOAL_MACRO_SPLIT = {
  weight_loss: { protein: 0.3, carbs: 0.4, fat: 0.3 },
  weight_gain: { protein: 0.25, carbs: 0.5, fat: 0.25 },
  diabetes: { protein: 0.25, carbs: 0.42, fat: 0.33 },
  hypertension: { protein: 0.25, carbs: 0.5, fat: 0.25 },
  cholesterol: { protein: 0.28, carbs: 0.47, fat: 0.25 },
};

const SLOT_LABELS = {
  breakfast: "Breakfast",
  morningSnack: "Morning Snack",
  lunch: "Lunch",
  eveningSnack: "Evening Snack",
  dinner: "Dinner",
};

function calcBMR(weightKg, heightCm, age, gender) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === "female") return Math.round(base - 161);
  return Math.round(base + 5);
}

function calcTDEE(bmr, activityLevel) {
  const mult = ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.moderate;
  return Math.round(bmr * mult);
}

function normalizeGoal(goal) {
  const g = String(goal || "weight_loss").toLowerCase().replace(/\s+/g, "_");
  if (g === "weightloss") return "weight_loss";
  if (g === "weightgain") return "weight_gain";
  if (GOAL_LABELS[g]) return g;
  return "weight_loss";
}

function normalizeDietType(dietType) {
  const d = String(dietType || "vegetarian").toLowerCase();
  if (["veg", "vegetarian"].includes(d)) return "vegetarian";
  if (["nonveg", "non_vegetarian", "non-vegetarian", "nonvegetarian"].includes(d)) return "non_vegetarian";
  if (d === "vegan") return "vegan";
  if (["eggetarian", "egg"].includes(d)) return "eggetarian";
  return "vegetarian";
}

function mealConflictsAllergies(meal, allergies) {
  if (!allergies?.length) return false;
  const allergenSet = new Set((meal.allergens || []).map((a) => a.toLowerCase()));
  for (const allergy of allergies) {
    const key = allergy.toLowerCase();
    if (allergenSet.has(key)) return true;
    const keywords = ALLERGY_KEYWORDS[key] || [key];
    const text = `${meal.name} ${(meal.items || []).join(" ")}`.toLowerCase();
    if (keywords.some((kw) => text.includes(kw))) return true;
  }
  return false;
}

function mealMatchesDietType(meal, dietType) {
  const types = meal.dietTypes || ["vegetarian"];
  if (dietType === "non_vegetarian") return true;
  if (dietType === "eggetarian") {
    return types.some((t) => ["vegetarian", "eggetarian", "vegan"].includes(t));
  }
  return types.includes(dietType);
}

function mealMatchesGoal(meal, goal) {
  const goals = meal.goals || [];
  return goals.includes(goal) || goals.length === 0;
}

function getPoolForSlot(slot, dietType) {
  const slotPool = MEAL_POOL[slot];
  if (!slotPool) return [];
  let meals = [];
  if (dietType === "non_vegetarian") {
    meals = [
      ...(slotPool.non_vegetarian || []),
      ...(slotPool.eggetarian || []),
      ...(slotPool.vegetarian || []),
    ];
  } else if (dietType === "eggetarian") {
    meals = [...(slotPool.eggetarian || []), ...(slotPool.vegetarian || [])];
  } else if (dietType === "vegan") {
    meals = [...(slotPool.vegan || []), ...(slotPool.vegetarian || [])];
  } else {
    meals = [...(slotPool.vegetarian || []), ...(slotPool.vegan || [])];
  }
  return meals;
}

function filterMeals(meals, { goal, dietType, allergies, preferences }) {
  let filtered = meals.filter(
    (m) =>
      mealMatchesDietType(m, dietType) &&
      mealMatchesGoal(m, goal) &&
      !mealConflictsAllergies(m, allergies)
  );

  if (preferences?.length) {
    const prefLower = preferences.map((p) => String(p).toLowerCase());
    const preferLowSpice = prefLower.some((p) => p.includes("mild") || p.includes("low_spice"));
    const preferHighProtein = prefLower.some((p) => p.includes("high_protein") || p.includes("protein"));
    if (preferLowSpice) {
      filtered = filtered.filter((m) => !/tikka|curry|spicy/i.test(m.name));
    }
    if (preferHighProtein) {
      filtered.sort((a, b) => b.protein - a.protein);
    }
  }

  return filtered.length ? filtered : meals.filter((m) => !mealConflictsAllergies(m, allergies));
}

function pickMeal(pool, dayIndex, slotIndex) {
  if (!pool.length) {
    return {
      name: "Custom light meal",
      items: ["Consult dietitian for personalized slot"],
      calories: 200,
      protein: 8,
      carbs: 25,
      fat: 6,
      fiber: 3,
      sodium: 200,
    };
  }
  const idx = (dayIndex * 3 + slotIndex) % pool.length;
  return pool[idx];
}

function formatMeal(slot, meal) {
  return {
    slot,
    slotLabel: SLOT_LABELS[slot] || slot,
    name: meal.name,
    items: meal.items || [],
    calories: meal.calories,
    nutrition: {
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      fiber: meal.fiber || 0,
      sodium: meal.sodium || 0,
    },
  };
}

function sumDayNutrition(meals) {
  return meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      protein: acc.protein + (m.nutrition?.protein || 0),
      carbs: acc.carbs + (m.nutrition?.carbs || 0),
      fat: acc.fat + (m.nutrition?.fat || 0),
      fiber: acc.fiber + (m.nutrition?.fiber || 0),
      sodium: acc.sodium + (m.nutrition?.sodium || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 }
  );
}

function roundNutrition(n) {
  return {
    calories: Math.round(n.calories),
    protein: Math.round(n.protein),
    carbs: Math.round(n.carbs),
    fat: Math.round(n.fat),
    fiber: Math.round(n.fiber),
    sodium: Math.round(n.sodium),
  };
}

function buildDayPlan(dayIndex, { goal, dietType, allergies, preferences, slots }) {
  const meals = [];
  slots.forEach((slot, slotIndex) => {
    const pool = filterMeals(getPoolForSlot(slot, dietType), {
      goal,
      dietType,
      allergies,
      preferences,
    });
    const picked = pickMeal(pool, dayIndex, slotIndex);
    meals.push(formatMeal(slot, picked));
  });
  const totals = roundNutrition(sumDayNutrition(meals));
  return {
    day: DAY_NAMES[dayIndex],
    dayIndex,
    meals,
    totals,
  };
}

function generateDietPlan(input = {}) {
  const goal = normalizeGoal(input.goal);
  const dietType = normalizeDietType(input.dietType);
  const age = Math.max(16, Math.min(100, Number(input.age) || 30));
  const weightKg = Math.max(35, Math.min(200, Number(input.weightKg) || 70));
  const heightCm = Math.max(130, Math.min(220, Number(input.heightCm) || 170));
  const gender = ["male", "female", "other"].includes(input.gender) ? input.gender : "male";
  const activityLevel = ACTIVITY_MULTIPLIERS[input.activityLevel]
    ? input.activityLevel
    : "moderate";

  const allergies = (Array.isArray(input.allergies) ? input.allergies : [])
    .map((a) => String(a).toLowerCase().trim())
    .filter(Boolean);

  const foodPreferences = Array.isArray(input.foodPreferences)
    ? input.foodPreferences
    : input.preferences
      ? String(input.preferences).split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  const bmr = calcBMR(weightKg, heightCm, age, gender);
  const tdee = calcTDEE(bmr, activityLevel);
  const adjust = GOAL_CALORIE_ADJUST[goal] ?? 0;
  let targetCalories = Math.max(1200, Math.min(4000, tdee + adjust));
  if (gender === "female" && targetCalories < 1400 && goal === "weight_loss") {
    targetCalories = 1400;
  }

  const macroSplit = GOAL_MACRO_SPLIT[goal] || GOAL_MACRO_SPLIT.weight_loss;
  const macroTargets = {
    protein: Math.round((targetCalories * macroSplit.protein) / 4),
    carbs: Math.round((targetCalories * macroSplit.carbs) / 4),
    fat: Math.round((targetCalories * macroSplit.fat) / 9),
  };

  const slots = ["breakfast", "morningSnack", "lunch", "eveningSnack", "dinner"];
  const opts = { goal, dietType, allergies, preferences: foodPreferences, slots };

  const weeklyMealPlan = DAY_NAMES.map((_, i) => buildDayPlan(i, opts));
  const dailyMealPlan = weeklyMealPlan[0];
  dailyMealPlan.label = "Day 1 (Today)";

  const weeklyAvg = roundNutrition(
    weeklyMealPlan.reduce(
      (acc, day) => ({
        calories: acc.calories + day.totals.calories,
        protein: acc.protein + day.totals.protein,
        carbs: acc.carbs + day.totals.carbs,
        fat: acc.fat + day.totals.fat,
        fiber: acc.fiber + day.totals.fiber,
        sodium: acc.sodium + day.totals.sodium,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 }
    )
  );
  Object.keys(weeklyAvg).forEach((k) => {
    weeklyAvg[k] = Math.round(weeklyAvg[k] / 7);
  });

  return {
    success: true,
    goal,
    goalLabel: GOAL_LABELS[goal],
    calorieGoals: {
      bmr,
      tdee,
      target: targetCalories,
      adjustment: adjust,
      description:
        adjust < 0
          ? `${Math.abs(adjust)} kcal deficit from maintenance`
          : adjust > 0
            ? `${adjust} kcal surplus for healthy gain`
            : "Maintenance calories tuned for health goal",
    },
    nutritionalBreakdown: {
      macroSplit: {
        proteinPercent: Math.round(macroSplit.protein * 100),
        carbsPercent: Math.round(macroSplit.carbs * 100),
        fatPercent: Math.round(macroSplit.fat * 100),
      },
      macroTargetsGrams: macroTargets,
      daily: dailyMealPlan.totals,
      weeklyAverage: weeklyAvg,
    },
    dailyMealPlan,
    weeklyMealPlan,
    preferences: {
      dietType,
      dietTypeLabel:
        dietType === "non_vegetarian"
          ? "Non-Vegetarian"
          : dietType === "vegan"
            ? "Vegan"
            : dietType === "eggetarian"
              ? "Eggetarian"
              : "Vegetarian",
      allergies,
      foodPreferences,
    },
    tips: GOAL_TIPS[goal] || [],
    disclaimer:
      "Educational meal suggestions only. Not medical nutrition therapy. Consult a registered dietitian or doctor for personalized plans, especially for diabetes or heart disease.",
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { generateDietPlan, calcBMR, calcTDEE };
