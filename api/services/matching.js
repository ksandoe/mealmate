// Recipe matching + filtering logic.
// Business rules implemented here:
//  - "Roommate Staple Bypass": rows with is_staple=TRUE are ignored
//    when computing matches and never reported as missing.
//  - Filters: budget tier, cook time, dietary tags (recipe must carry
//    ALL requested tags), equipment (recipe appliances must be a
//    subset of the user's equipment).

const normalizeName = (name) => String(name).trim().toLowerCase();
const splitCsv = (value) => (value || '').split(',').map(s => s.trim()).filter(Boolean);

// recipe must include its recipe_ingredient rows (embedded select).
const matchRecipe = (recipe, availableNames) => {
  const available = new Set(availableNames.map(normalizeName));
  const required = (recipe.recipe_ingredient || []).filter(ing => !ing.is_staple);
  const missing = required
    .filter(ing => !available.has(normalizeName(ing.ingredient_name)))
    .map(ing => ing.ingredient_name);
  const matchPercent = required.length === 0
    ? 100
    : Math.round(((required.length - missing.length) / required.length) * 100);
  return { recipe, matchPercent, missing };
};

const passesFilters = (recipe, filters) => {
  const { maxCost, maxCookTime, dietary, equipment } = filters;
  if (maxCost != null && recipe.estimated_cost > maxCost) return false;
  if (maxCookTime != null && recipe.cook_time_minutes > maxCookTime) return false;

  const recipeTags = splitCsv(recipe.dietary_tags);
  if (dietary.length > 0 && !dietary.every(tag => recipeTags.includes(tag))) {
    return false;
  }

  const recipeAppliances = splitCsv(recipe.required_appliances);
  if (equipment.length > 0 &&
      !recipeAppliances.every(app => equipment.includes(app))) {
    return false;
  }
  return true;
};

// Parse the shared filter query params used by /api/recipes and /api/recipes/search.
const parseFilters = (query) => ({
  maxCost: query.maxCost ? Number(query.maxCost) : null,
  maxCookTime: query.maxCookTime ? Number(query.maxCookTime) : null,
  dietary: splitCsv(query.dietary),
  equipment: splitCsv(query.equipment)
});

module.exports = { matchRecipe, passesFilters, parseFilters, normalizeName };
