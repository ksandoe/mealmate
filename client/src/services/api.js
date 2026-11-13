// MealMate API service layer.
// All data access goes through the local Express API (/api is proxied
// to http://localhost:3001 by Vite). The client never talks to Supabase.

const BASE = '/api';

const request = async (path, options = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Request failed (HTTP ${res.status})`);
  }
  return body;
};

// ---- field mappers (snake_case DB rows -> camelCase client models) ----

const mapProfile = (row) => ({
  profileId: row.profile_id,
  savedDietaryRestrictions: row.saved_dietary_restrictions || '',
  equipmentPreferences: row.equipment_preferences || ''
});

const mapPantryItem = (row) => ({
  pantryItemId: row.pantry_item_id,
  ingredientName: row.ingredient_name,
  quantityStatus: row.quantity_status
});

const mapGroceryItem = (row) => ({
  listItemId: row.list_item_id,
  itemName: row.item_name,
  isChecked: row.is_checked
});

const mapDeal = (row) => ({
  dealId: row.deal_id,
  storeName: row.store_name,
  itemName: row.item_name,
  salePrice: Number(row.sale_price),
  regularPrice: Number(row.regular_price),
  expirationDateString: row.expiration_date_string || ''
});

const mapRecipe = (row) => {
  // nutritional_data can come back as an object (1:1) or a 1-element array.
  const n = Array.isArray(row.nutritional_data)
    ? row.nutritional_data[0]
    : row.nutritional_data;
  return {
    recipeId: row.recipe_id,
    recipeName: row.recipe_name,
    stepInstructions: row.step_instructions,
    prepTimeMinutes: row.prep_time_minutes,
    cookTimeMinutes: row.cook_time_minutes,
    requiredAppliances: (row.required_appliances || '').split(',').map(s => s.trim()).filter(Boolean),
    dietaryTags: (row.dietary_tags || '').split(',').map(s => s.trim()).filter(Boolean),
    estimatedCost: Number(row.estimated_cost),
    nutrition: n
      ? { calories: n.calories, proteinGrams: n.protein_grams, carbsGrams: n.carbs_grams, fatGrams: n.fat_grams }
      : null,
    ingredients: (row.recipe_ingredient || []).map(ing => ({
      name: ing.ingredient_name,
      isStaple: ing.is_staple
    }))
  };
};

// ---- profile ----

export const getProfile = async () => {
  const { profile } = await request('/profile');
  return mapProfile(profile);
};

export const saveProfileSettings = (profileId, { savedDietaryRestrictions, equipmentPreferences }) =>
  request(`/profile/${profileId}`, {
    method: 'PUT',
    body: JSON.stringify({ savedDietaryRestrictions, equipmentPreferences })
  });

// ---- recipes ----

const filterQuery = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.maxBudget) params.set('maxCost', filters.maxBudget);
  if (filters.maxCookTime) params.set('maxCookTime', filters.maxCookTime);
  if (filters.dietary?.length) params.set('dietary', filters.dietary.join(','));
  if (filters.equipment?.length) params.set('equipment', filters.equipment.join(','));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

export const getRecipes = async (filters = {}) => {
  const { recipes } = await request(`/recipes${filterQuery(filters)}`);
  return recipes.map(mapRecipe);
};

export const getRecipe = async (recipeId) => {
  const { recipe } = await request(`/recipes/${recipeId}`);
  return mapRecipe(recipe);
};

// ingredients: array of names, or null to use the profile's pantry.
export const searchRecipes = async ({ ingredients, profileId, filters = {} }) => {
  const params = new URLSearchParams();
  if (ingredients && ingredients.length > 0) {
    params.set('ingredients', ingredients.join(','));
  } else if (profileId) {
    params.set('profileId', profileId);
  }
  const qs = filterQuery(filters);
  const joiner = params.toString() && qs ? `?${params}&${qs.slice(1)}` : (params.toString() ? `?${params}` : qs);
  const { results } = await request(`/recipes/search${joiner}`);
  return results.map(r => ({
    recipe: mapRecipe(r.recipe),
    matchPercent: r.matchPercent,
    missing: r.missing || []
  }));
};

// ---- pantry ----

export const getPantry = async (profileId) => {
  const { pantry } = await request(`/pantry?profileId=${profileId}`);
  return pantry.map(mapPantryItem);
};

export const addPantryItem = async (profileId, ingredientName, quantityStatus = null) => {
  const { item } = await request('/pantry', {
    method: 'POST',
    body: JSON.stringify({ profileId, ingredientName, quantityStatus })
  });
  return mapPantryItem(item);
};

export const deletePantryItem = (pantryItemId) =>
  request(`/pantry/${pantryItemId}`, { method: 'DELETE' });

export const clearPantry = (profileId) =>
  request(`/pantry?profileId=${profileId}`, { method: 'DELETE' });

// ---- grocery list ----

export const getGroceryList = async (profileId) => {
  const { items } = await request(`/grocery-list?profileId=${profileId}`);
  return items.map(mapGroceryItem);
};

export const addGroceryItem = async (profileId, itemName) => {
  const { item } = await request('/grocery-list', {
    method: 'POST',
    body: JSON.stringify({ profileId, itemName })
  });
  return mapGroceryItem(item);
};

export const setGroceryChecked = async (listItemId, isChecked) => {
  const { item } = await request(`/grocery-list/${listItemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ isChecked })
  });
  return mapGroceryItem(item);
};

export const deleteGroceryItem = (listItemId) =>
  request(`/grocery-list/${listItemId}`, { method: 'DELETE' });

export const checkout = async (profileId) =>
  request('/grocery-list/checkout', {
    method: 'POST',
    body: JSON.stringify({ profileId })
  });

// ---- deals ----

export const getDeals = async () => {
  const { deals } = await request('/deals');
  return deals.map(mapDeal);
};
