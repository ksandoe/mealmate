-- =============================================================
-- MealMate Prototype 2 - Seed Data
-- Realistic test data (3-5 rows per table) honoring all FKs.
-- Uses fixed UUIDs so the file is readable and re-runnable.
-- Depends on: db/01_schema.sql
-- =============================================================

BEGIN;

-- -------------------------------------------------------------
-- Profiles (3 students with different diets/equipment)
-- -------------------------------------------------------------
INSERT INTO local_profile (profile_id, saved_dietary_restrictions, equipment_preferences) VALUES
  ('a1111111-1111-4111-8111-111111111111', 'vegetarian',          'microwave,stove'),
  ('a2222222-2222-4222-8222-222222222222', 'gluten-free,nut-free', 'air-fryer,stove'),
  ('a3333333-3333-4333-8333-333333333333', '',                     'microwave');

-- -------------------------------------------------------------
-- Recipes (5 cheap, dorm-friendly meals)
-- -------------------------------------------------------------
INSERT INTO preset_recipe
  (recipe_id, recipe_name, step_instructions, prep_time_minutes, cook_time_minutes,
   required_appliances, dietary_tags, estimated_cost) VALUES
  ('b1111111-1111-4111-8111-111111111111',
   'Microwave Scrambled Eggs',
   '1. Crack eggs into a microwave-safe mug and beat with a fork.
2. Stir in a splash of milk, salt, and pepper.
3. Microwave 60 seconds, stir, then microwave 30-45 more seconds until set.
4. Top with shredded cheese and let it melt.',
   2, 3, 'microwave', 'vegetarian,gluten-free,nut-free', 2.50),

  ('b2222222-2222-4222-8222-222222222222',
   'Stovetop Rice and Bean Bowl',
   '1. Cook rice according to package directions.
2. Heat oil in a pan, add drained black beans and a spoonful of salsa.
3. Simmer 5 minutes, season with salt.
4. Serve beans over rice, top with cheese and extra salsa.',
   5, 20, 'stove', 'vegetarian,gluten-free,nut-free', 3.50),

  ('b3333333-3333-4333-8333-333333333333',
   'Air Fryer Chicken Quesadilla',
   '1. Slice chicken breast into strips, season with salt and pepper.
2. Air fry chicken at 380F for 10-12 minutes until cooked through.
3. Layer chicken, cheese, and salsa between two tortillas.
4. Air fry 3-4 minutes until crispy and cheese melts. Slice and serve.',
   10, 14, 'air-fryer', 'nut-free', 5.50),

  ('b4444444-4444-4444-8444-444444444444',
   'Peanut Butter Banana Oatmeal',
   '1. Combine oats and milk in a microwave-safe bowl.
2. Microwave 2-3 minutes, stirring halfway.
3. Top with sliced banana, a spoonful of peanut butter, and a drizzle of honey.',
   3, 3, 'microwave', 'vegetarian,gluten-free', 1.75),

  ('b5555555-5555-4555-8555-555555555555',
   'Garlic Parmesan Pasta',
   '1. Boil spaghetti in salted water until al dente; reserve a cup of pasta water.
2. Melt butter in a pan, saute minced garlic 1 minute.
3. Toss pasta in the garlic butter with a splash of pasta water.
4. Finish with parmesan, salt, and pepper.',
   5, 15, 'stove', 'vegetarian,nut-free', 3.00);

-- -------------------------------------------------------------
-- Nutritional data (1 row per recipe, 1:1)
-- -------------------------------------------------------------
INSERT INTO nutritional_data
  (nutrition_id, recipe_id, calories, protein_grams, carbs_grams, fat_grams) VALUES
  ('c1111111-1111-4111-8111-111111111111', 'b1111111-1111-4111-8111-111111111111', 320, 20, 3, 24),
  ('c2222222-2222-4222-8222-222222222222', 'b2222222-2222-4222-8222-222222222222', 450, 15, 75, 9),
  ('c3333333-3333-4333-8333-333333333333', 'b3333333-3333-4333-8333-333333333333', 520, 35, 40, 22),
  ('c4444444-4444-4444-8444-444444444444', 'b4444444-4444-4444-8444-444444444444', 410, 14, 60, 15),
  ('c5555555-5555-4555-8555-555555555555', 'b5555555-5555-4555-8555-555555555555', 480, 14, 70, 16);

-- -------------------------------------------------------------
-- Recipe ingredients (join table). is_staple = TRUE marks items
-- the matching logic skips (Roommate Staple Bypass).
-- -------------------------------------------------------------
INSERT INTO recipe_ingredient (recipe_id, ingredient_name, is_staple) VALUES
  -- Microwave Scrambled Eggs
  ('b1111111-1111-4111-8111-111111111111', 'eggs',             FALSE),
  ('b1111111-1111-4111-8111-111111111111', 'milk',             FALSE),
  ('b1111111-1111-4111-8111-111111111111', 'shredded cheese',  FALSE),
  ('b1111111-1111-4111-8111-111111111111', 'butter',           TRUE),
  ('b1111111-1111-4111-8111-111111111111', 'salt',             TRUE),
  ('b1111111-1111-4111-8111-111111111111', 'pepper',           TRUE),
  -- Rice and Bean Bowl
  ('b2222222-2222-4222-8222-222222222222', 'rice',             FALSE),
  ('b2222222-2222-4222-8222-222222222222', 'black beans',      FALSE),
  ('b2222222-2222-4222-8222-222222222222', 'salsa',            FALSE),
  ('b2222222-2222-4222-8222-222222222222', 'shredded cheese',  FALSE),
  ('b2222222-2222-4222-8222-222222222222', 'oil',              TRUE),
  ('b2222222-2222-4222-8222-222222222222', 'salt',             TRUE),
  -- Chicken Quesadilla
  ('b3333333-3333-4333-8333-333333333333', 'chicken breast',   FALSE),
  ('b3333333-3333-4333-8333-333333333333', 'flour tortillas',  FALSE),
  ('b3333333-3333-4333-8333-333333333333', 'shredded cheese',  FALSE),
  ('b3333333-3333-4333-8333-333333333333', 'salsa',            FALSE),
  ('b3333333-3333-4333-8333-333333333333', 'oil',              TRUE),
  ('b3333333-3333-4333-8333-333333333333', 'salt',             TRUE),
  ('b3333333-3333-4333-8333-333333333333', 'pepper',           TRUE),
  -- Peanut Butter Banana Oatmeal
  ('b4444444-4444-4444-8444-444444444444', 'rolled oats',      FALSE),
  ('b4444444-4444-4444-8444-444444444444', 'milk',             FALSE),
  ('b4444444-4444-4444-8444-444444444444', 'peanut butter',    FALSE),
  ('b4444444-4444-4444-8444-444444444444', 'banana',           FALSE),
  ('b4444444-4444-4444-8444-444444444444', 'honey',            FALSE),
  -- Garlic Parmesan Pasta
  ('b5555555-5555-4555-8555-555555555555', 'spaghetti',        FALSE),
  ('b5555555-5555-4555-8555-555555555555', 'garlic',           FALSE),
  ('b5555555-5555-4555-8555-555555555555', 'parmesan cheese',  FALSE),
  ('b5555555-5555-4555-8555-555555555555', 'butter',           TRUE),
  ('b5555555-5555-4555-8555-555555555555', 'salt',             TRUE),
  ('b5555555-5555-4555-8555-555555555555', 'pepper',           TRUE);

-- -------------------------------------------------------------
-- Pantry contents (5 rows across two profiles)
-- -------------------------------------------------------------
INSERT INTO pantry_ingredient
  (pantry_item_id, profile_id, ingredient_name, quantity_status) VALUES
  ('d1111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111', 'eggs',         'plenty'),
  ('d2222222-2222-4222-8222-222222222222', 'a1111111-1111-4111-8111-111111111111', 'milk',         'running low'),
  ('d3333333-3333-4333-8333-333333333333', 'a1111111-1111-4111-8111-111111111111', 'rolled oats',  'half a canister'),
  ('d4444444-4444-4444-8444-444444444444', 'a2222222-2222-4222-8222-222222222222', 'chicken breast', 'two pieces'),
  ('d5555555-5555-4555-8555-555555555555', 'a2222222-2222-4222-8222-222222222222', 'salsa',         'almost empty');

-- -------------------------------------------------------------
-- Grocery lists (5 rows across two profiles, mixed check state)
-- -------------------------------------------------------------
INSERT INTO grocery_list_item
  (list_item_id, profile_id, item_name, is_checked) VALUES
  ('f1111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111', 'rice',            FALSE),
  ('f2222222-2222-4222-8222-222222222222', 'a1111111-1111-4111-8111-111111111111', 'salsa',           TRUE),
  ('f3333333-3333-4333-8333-333333333333', 'a1111111-1111-4111-8111-111111111111', 'black beans',     FALSE),
  ('f4444444-4444-4444-8444-444444444444', 'a2222222-2222-4222-8222-222222222222', 'flour tortillas', FALSE),
  ('f5555555-5555-4555-8555-555555555555', 'a2222222-2222-4222-8222-222222222222', 'shredded cheese', TRUE);

-- -------------------------------------------------------------
-- Mock deals (5 rows across Chico-area campus stores)
-- -------------------------------------------------------------
INSERT INTO mock_deal
  (deal_id, store_name, item_name, sale_price, regular_price, expiration_date_string) VALUES
  ('e1111111-1111-4111-8111-111111111111', 'WinCo',           'eggs',             2.49, 3.29, 'ends Sunday'),
  ('e2222222-2222-4222-8222-222222222222', 'Safeway',         'shredded cheese',  1.99, 2.99, 'ends Saturday'),
  ('e3333333-3333-4333-8333-333333333333', 'Grocery Outlet',  'black beans',      0.89, 1.29, 'while supplies last'),
  ('e4444444-4444-4444-8444-444444444444', 'Campus Market',   'flour tortillas',  2.19, 2.79, 'ends Friday'),
  ('e5555555-5555-4555-8555-555555555555', 'WinCo',           'rolled oats',      1.49, 1.99, 'ends Sunday');

COMMIT;
