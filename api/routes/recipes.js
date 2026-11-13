// Recipe routes: list/search/detail, all backed by Supabase.

const express = require('express');
const supabase = require('../db');
const { asyncHandler, notFound, throwSupabase } = require('../helpers');
const { matchRecipe, passesFilters, parseFilters } = require('../services/matching');

const router = express.Router();

const RECIPE_SELECT = '*, nutritional_data(*), recipe_ingredient(*)';

// GET /api/recipes/search?ingredients=a,b&profileId=<uuid>
//   &maxCost=&maxCookTime=&dietary=&equipment=
// IMPORTANT: registered before /:id so 'search' isn't read as an id.
router.get('/search', asyncHandler(async (req, res) => {
  let available = [];
  if (req.query.ingredients) {
    available = req.query.ingredients.split(',').map(s => s.trim()).filter(Boolean);
  } else if (req.query.profileId) {
    // Fall back to the profile's pantry when no ingredients are given.
    const { data, error } = await supabase
      .from('pantry_ingredient')
      .select('ingredient_name')
      .eq('profile_id', req.query.profileId);
    if (error) throw throwSupabase(error);
    available = data.map(row => row.ingredient_name);
  }

  const filters = parseFilters(req.query);
  const { data: recipes, error } = await supabase
    .from('preset_recipe')
    .select(RECIPE_SELECT);
  if (error) throw throwSupabase(error);

  const results = recipes
    .filter(recipe => passesFilters(recipe, filters))
    .map(recipe => matchRecipe(recipe, available))
    .sort((a, b) => b.matchPercent - a.matchPercent);

  res.json({ results });
}));

// GET /api/recipes/:id - single recipe with nutrition + ingredients
router.get('/:id', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('preset_recipe')
    .select(RECIPE_SELECT)
    .eq('recipe_id', req.params.id)
    .maybeSingle();
  if (error) throw throwSupabase(error);
  if (!data) throw notFound(`Recipe ${req.params.id} not found`);
  res.json({ recipe: data });
}));

// GET /api/recipes?maxCost=&maxCookTime=&dietary=&equipment=
router.get('/', asyncHandler(async (req, res) => {
  const filters = parseFilters(req.query);
  const { data, error } = await supabase
    .from('preset_recipe')
    .select(RECIPE_SELECT)
    .order('recipe_name');
  if (error) throw throwSupabase(error);

  res.json({ recipes: data.filter(recipe => passesFilters(recipe, filters)) });
}));

module.exports = router;
