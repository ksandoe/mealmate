// Pantry routes: per-profile ingredient inventory.
// Implements the "Combining Duplicates" rule: adding a name that
// already exists (case-insensitive) updates the row instead of
// creating a duplicate.

const express = require('express');
const supabase = require('../db');
const { asyncHandler, badRequest, notFound, throwSupabase } = require('../helpers');
const { normalizeName } = require('../services/matching');

const router = express.Router();

const requireProfileId = (req) => {
  const profileId = req.query.profileId || req.body?.profileId;
  if (!profileId) throw badRequest('profileId is required');
  return profileId;
};

// GET /api/pantry?profileId=<uuid>
router.get('/', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('pantry_ingredient')
    .select('*')
    .eq('profile_id', requireProfileId(req))
    .order('ingredient_name');
  if (error) throw throwSupabase(error);
  res.json({ pantry: data });
}));

// POST /api/pantry { profileId, ingredientName, quantityStatus? }
router.post('/', asyncHandler(async (req, res) => {
  const profileId = requireProfileId(req);
  const ingredientName = String(req.body.ingredientName || '').trim();
  const quantityStatus = req.body.quantityStatus ?? null;
  if (!ingredientName) throw badRequest('ingredientName is required');

  // Duplicate merge: case-insensitive name lookup, then update or insert.
  const { data: existing, error: findError } = await supabase
    .from('pantry_ingredient')
    .select('*')
    .eq('profile_id', profileId)
    .ilike('ingredient_name', normalizeName(ingredientName))
    .maybeSingle();
  if (findError) throw throwSupabase(findError);

  if (existing) {
    const { data, error } = await supabase
      .from('pantry_ingredient')
      .update({ quantity_status: quantityStatus ?? existing.quantity_status })
      .eq('pantry_item_id', existing.pantry_item_id)
      .select()
      .single();
    if (error) throw throwSupabase(error);
    return res.status(200).json({ item: data, merged: true });
  }

  const { data, error } = await supabase
    .from('pantry_ingredient')
    .insert({ profile_id: profileId, ingredient_name: ingredientName, quantity_status: quantityStatus })
    .select()
    .single();
  if (error) throw throwSupabase(error);
  res.status(201).json({ item: data, merged: false });
}));

// DELETE /api/pantry/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('pantry_ingredient')
    .delete()
    .eq('pantry_item_id', req.params.id);
  if (error) throw throwSupabase(error);
  res.json({ message: 'Ingredient removed' });
}));

// DELETE /api/pantry?profileId=<uuid> - "Clear All"
router.delete('/', asyncHandler(async (req, res) => {
  const profileId = requireProfileId(req);
  const { error } = await supabase
    .from('pantry_ingredient')
    .delete()
    .eq('profile_id', profileId);
  if (error) throw throwSupabase(error);
  res.json({ message: 'Pantry cleared' });
}));

module.exports = router;
