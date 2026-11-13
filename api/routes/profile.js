// Profile routes: local app settings (dietary filters, equipment).
// No auth in Prototype 2: GET /api/profile returns the seeded
// default profile, creating one if the table is empty.

const express = require('express');
const supabase = require('../db');
const { asyncHandler, notFound, throwSupabase } = require('../helpers');

const router = express.Router();

// GET /api/profile - the default (first) local profile
router.get('/', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('local_profile')
    .select('*')
    .order('created_at')
    .limit(1);
  if (error) throw throwSupabase(error);

  if (data.length === 0) {
    const { data: created, error: insertError } = await supabase
      .from('local_profile')
      .insert({ saved_dietary_restrictions: '', equipment_preferences: '' })
      .select()
      .single();
    if (insertError) throw throwSupabase(insertError);
    return res.status(201).json({ profile: created });
  }
  res.json({ profile: data[0] });
}));

// PUT /api/profile/:id { savedDietaryRestrictions?, equipmentPreferences? }
router.put('/:id', asyncHandler(async (req, res) => {
  const updates = {};
  if (req.body.savedDietaryRestrictions !== undefined) {
    updates.saved_dietary_restrictions = String(req.body.savedDietaryRestrictions);
  }
  if (req.body.equipmentPreferences !== undefined) {
    updates.equipment_preferences = String(req.body.equipmentPreferences);
  }
  if (Object.keys(updates).length === 0) {
    const err = new Error('No updatable fields provided');
    err.status = 400;
    throw err;
  }

  const { data, error } = await supabase
    .from('local_profile')
    .update(updates)
    .eq('profile_id', req.params.id)
    .select()
    .maybeSingle();
  if (error) throw throwSupabase(error);
  if (!data) throw notFound(`Profile ${req.params.id} not found`);
  res.json({ profile: data });
}));

module.exports = router;
