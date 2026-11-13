-- =============================================================
-- MealMate Prototype 2 - Database Schema
-- Implements the Analyst's domain model from Specification 2.
-- Safe to re-run: drops and recreates all tables.
--
-- Run order: 01_schema.sql -> 02_seed.sql -> (optional) 03_policies.sql
-- =============================================================

BEGIN;

-- Drop in reverse dependency order so re-runs are clean.
DROP TABLE IF EXISTS recipe_ingredient CASCADE;
DROP TABLE IF EXISTS nutritional_data CASCADE;
DROP TABLE IF EXISTS grocery_list_item CASCADE;
DROP TABLE IF EXISTS pantry_ingredient CASCADE;
DROP TABLE IF EXISTS mock_deal CASCADE;
DROP TABLE IF EXISTS preset_recipe CASCADE;
DROP TABLE IF EXISTS local_profile CASCADE;

-- -------------------------------------------------------------
-- Local_Profile: per-session app settings (allergy filters,
-- equipment choices). No auth in Prototype 2; a profile row is
-- created client-side and referenced by pantry/grocery rows.
-- -------------------------------------------------------------
CREATE TABLE local_profile (
  profile_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_dietary_restrictions TEXT,          -- comma-separated, e.g. 'vegetarian,gluten-free'
  equipment_preferences      TEXT,          -- comma-separated, e.g. 'microwave,stove'
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- Preset_Recipe: master list of pre-loaded recipes.
-- required_appliances and dietary_tags are comma-separated text
-- to match the Analyst's "string" field types.
--
-- NOTE: estimated_cost and dietary_tags are additions to the
-- Analyst's schema needed by the budget-tier and dietary-filter
-- user stories (spec has no other field to support them).
-- -------------------------------------------------------------
CREATE TABLE preset_recipe (
  recipe_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_name         TEXT NOT NULL,
  step_instructions   TEXT NOT NULL,
  prep_time_minutes   INTEGER NOT NULL CHECK (prep_time_minutes >= 0),
  cook_time_minutes   INTEGER NOT NULL CHECK (cook_time_minutes >= 0),
  required_appliances TEXT NOT NULL,        -- comma-separated: 'microwave', 'air-fryer', 'stove'
  dietary_tags        TEXT,                 -- comma-separated: 'vegetarian', 'gluten-free', 'nut-free'
  estimated_cost      DECIMAL(6,2) CHECK (estimated_cost >= 0)
);

-- -------------------------------------------------------------
-- Nutritional_Data: exactly one macro/calorie block per recipe
-- (1:1 enforced by UNIQUE on recipe_id).
-- -------------------------------------------------------------
CREATE TABLE nutritional_data (
  nutrition_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id     UUID NOT NULL UNIQUE REFERENCES preset_recipe(recipe_id) ON DELETE CASCADE,
  calories      INTEGER NOT NULL CHECK (calories >= 0),
  protein_grams INTEGER NOT NULL DEFAULT 0 CHECK (protein_grams >= 0),
  carbs_grams   INTEGER NOT NULL DEFAULT 0 CHECK (carbs_grams >= 0),
  fat_grams     INTEGER NOT NULL DEFAULT 0 CHECK (fat_grams >= 0)
);

-- -------------------------------------------------------------
-- Pantry_Ingredient: plain-text ingredient names in a profile's
-- virtual fridge. quantity_status is free text (spec: no strict
-- numbers/units required).
--
-- Business rule "Combining Duplicates": enforced by a unique
-- index on (profile_id, lower(ingredient_name)) so 'Milk' and
-- 'milk' merge into one row. API should INSERT ... ON CONFLICT.
-- -------------------------------------------------------------
CREATE TABLE pantry_ingredient (
  pantry_item_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES local_profile(profile_id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  quantity_status TEXT,                     -- free text, e.g. 'plenty', 'low', 'half a carton'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX pantry_ingredient_unique_name_per_profile
  ON pantry_ingredient (profile_id, lower(ingredient_name));

CREATE INDEX pantry_ingredient_profile_idx
  ON pantry_ingredient (profile_id);

-- -------------------------------------------------------------
-- Grocery_List_Item: shopping checklist rows owned by a profile.
-- Business rule "Waiting on Checkout": is_checked only marks the
-- item; the API copies checked rows into pantry_ingredient when
-- the user hits Checkout/Done Shopping.
-- -------------------------------------------------------------
CREATE TABLE grocery_list_item (
  list_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   UUID NOT NULL REFERENCES local_profile(profile_id) ON DELETE CASCADE,
  item_name    TEXT NOT NULL,
  is_checked   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX grocery_list_item_unique_name_per_profile
  ON grocery_list_item (profile_id, lower(item_name));

CREATE INDEX grocery_list_item_profile_idx
  ON grocery_list_item (profile_id);

-- -------------------------------------------------------------
-- recipe_ingredient: physical join for the Preset_Recipe <->
-- Pantry_Ingredient M:N relationship. The Analyst's ERD links
-- the entities by ingredient name, so matching compares
-- lower(ingredient_name) against pantry rows.
--
-- is_staple implements the "Roommate Staple Bypass": staples
-- (salt, pepper, oil, butter, water, spices) are ignored by
-- recipe matching and never reported as missing.
-- -------------------------------------------------------------
CREATE TABLE recipe_ingredient (
  recipe_id       UUID NOT NULL REFERENCES preset_recipe(recipe_id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  is_staple       BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (recipe_id, ingredient_name)
);

CREATE INDEX recipe_ingredient_name_idx
  ON recipe_ingredient (lower(ingredient_name));

-- -------------------------------------------------------------
-- Mock_Deal: static campus-store deals. The Pantry_Ingredient <->
-- Mock_Deal M:N is resolved at query time by name matching
-- (lower(item_name) = lower(ingredient_name)); no join table is
-- needed since deals reference ingredients by name, not by id.
-- expiration_date_string stays TEXT per the Analyst's schema.
-- -------------------------------------------------------------
CREATE TABLE mock_deal (
  deal_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name             TEXT NOT NULL,
  item_name              TEXT NOT NULL,
  sale_price             DECIMAL(6,2) NOT NULL CHECK (sale_price >= 0),
  regular_price          DECIMAL(6,2) NOT NULL CHECK (regular_price >= sale_price),
  expiration_date_string TEXT             -- e.g. 'ends Sunday', per Analyst's string type
);

CREATE INDEX mock_deal_item_name_idx
  ON mock_deal (lower(item_name));

COMMIT;
