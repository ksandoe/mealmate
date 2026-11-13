// Mock deal routes: static campus-store pricing.

const express = require('express');
const supabase = require('../db');
const { asyncHandler, throwSupabase } = require('../helpers');

const router = express.Router();

// GET /api/deals?itemName=<name> - all deals, or deals matching an item
router.get('/', asyncHandler(async (req, res) => {
  let query = supabase.from('mock_deal').select('*').order('item_name');
  if (req.query.itemName) {
    query = query.ilike('item_name', req.query.itemName.trim());
  }
  const { data, error } = await query;
  if (error) throw throwSupabase(error);
  res.json({ deals: data });
}));

module.exports = router;
