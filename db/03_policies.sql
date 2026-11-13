-- =============================================================
-- MealMate Prototype 2 - Row Level Security (optional)
--
-- Design note: the Express API connects with the service role
-- key, which BYPASSES RLS entirely. Enabling RLS here simply
-- guarantees the anon key cannot read or write app tables
-- directly — matching the rule that the client must only ever
-- talk to our own API, never to Supabase.
--
-- No permissive policies are defined on purpose: default deny.
-- =============================================================

BEGIN;

ALTER TABLE local_profile       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_ingredient   ENABLE ROW LEVEL SECURITY;
ALTER TABLE preset_recipe       ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredient   ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutritional_data    ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_list_item   ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_deal           ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- Reference templates (leave commented unless needed later):
--
-- Read-only public access to recipes and deals, if the client
-- is ever allowed to query them with the anon key:
--
-- CREATE POLICY "public read recipes" ON preset_recipe
--   FOR SELECT USING (true);
--
-- CREATE POLICY "public read recipe ingredients" ON recipe_ingredient
--   FOR SELECT USING (true);
--
-- CREATE POLICY "public read nutrition" ON nutritional_data
--   FOR SELECT USING (true);
--
-- CREATE POLICY "public read deals" ON mock_deal
--   FOR SELECT USING (true);
--
-- Per-profile access once auth exists (Prototype 3+):
--
-- CREATE POLICY "own pantry rows" ON pantry_ingredient
--   FOR ALL USING (profile_id = auth.uid());
-- -------------------------------------------------------------

COMMIT;
