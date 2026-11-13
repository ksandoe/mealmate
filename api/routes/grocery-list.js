// Grocery list routes: checklist rows per profile plus the
// "Done Shopping" checkout. Per the spec's "Waiting on Checkout"
// rule, checking a box only flips is_checked; items move into the
// pantry only when POST /checkout is called.

const express = require('express');
const supabase = require('../db');
const { asyncHandler, badRequest, throwSupabase } = require('../helpers');
const { normalizeName } = require('../services/matching');

const router = express.Router();

const requireProfileId = (req) => {
  const profileId = req.query.profileId || req.body?.profileId;
  if (!profileId) throw badRequest('profileId is required');
  return profileId;
};

// POST /api/grocery-list/checkout { profileId }
// Registered before /:id so 'checkout' isn't read as an id.
router.post('/checkout', asyncHandler(async (req, res) => {
  const profileId = requireProfileId(req);

  const { data: checked, error: listError } = await supabase
    .from('grocery_list_item')
    .select('*')
    .eq('profile_id', profileId)
    .eq('is_checked', true);
  if (listError) throw throwSupabase(listError);

  if (checked.length === 0) {
    return res.json({ moved: 0, message: 'No checked items to move' });
  }

  // Skip items already in the pantry (duplicate-merge rule).
  const { data: pantry, error: pantryError } = await supabase
    .from('pantry_ingredient')
    .select('ingredient_name')
    .eq('profile_id', profileId);
  if (pantryError) throw throwSupabase(pantryError);
  const pantryNames = new Set(pantry.map(p => normalizeName(p.ingredient_name)));

  const newRows = checked
    .filter(item => !pantryNames.has(normalizeName(item.item_name)))
    .map(item => ({
      profile_id: profileId,
      ingredient_name: item.item_name,
      quantity_status: null
    }));

  if (newRows.length > 0) {
    const { error: insertError } = await supabase
      .from('pantry_ingredient')
      .insert(newRows);
    if (insertError) throw throwSupabase(insertError);
  }

  const { error: deleteError } = await supabase
    .from('grocery_list_item')
    .delete()
    .eq('profile_id', profileId)
    .eq('is_checked', true);
  if (deleteError) throw throwSupabase(deleteError);

  res.json({ moved: checked.length, addedToPantry: newRows.length });
}));

// GET /api/grocery-list?profileId=<uuid>
router.get('/', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('grocery_list_item')
    .select('*')
    .eq('profile_id', requireProfileId(req))
    .order('item_name');
  if (error) throw throwSupabase(error);
  res.json({ items: data });
}));

// POST /api/grocery-list { profileId, itemName }
router.post('/', asyncHandler(async (req, res) => {
  const profileId = requireProfileId(req);
  const itemName = String(req.body.itemName || '').trim();
  if (!itemName) throw badRequest('itemName is required');

  // Merge duplicates by case-insensitive name.
  const { data: existing, error: findError } = await supabase
    .from('grocery_list_item')
    .select('*')
    .eq('profile_id', profileId)
    .ilike('item_name', normalizeName(itemName))
    .maybeSingle();
  if (findError) throw throwSupabase(findError);
  if (existing) return res.status(200).json({ item: existing, merged: true });

  const { data, error } = await supabase
    .from('grocery_list_item')
    .insert({ profile_id: profileId, item_name: itemName, is_checked: false })
    .select()
    .single();
  if (error) throw throwSupabase(error);
  res.status(201).json({ item: data, merged: false });
}));

// PATCH /api/grocery-list/:id { isChecked }
router.patch('/:id', asyncHandler(async (req, res) => {
  if (typeof req.body.isChecked !== 'boolean') {
    throw badRequest('isChecked (boolean) is required');
  }
  const { data, error } = await supabase
    .from('grocery_list_item')
    .update({ is_checked: req.body.isChecked })
    .eq('list_item_id', req.params.id)
    .select()
    .single();
  if (error) throw throwSupabase(error);
  res.json({ item: data });
}));

// DELETE /api/grocery-list/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('grocery_list_item')
    .delete()
    .eq('list_item_id', req.params.id);
  if (error) throw throwSupabase(error);
  res.json({ message: 'Item removed from shopping list' });
}));

module.exports = router;
