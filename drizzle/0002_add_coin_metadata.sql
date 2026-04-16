-- Add coin metadata columns to existing favorites table
-- These columns are optional for backwards compatibility

ALTER TABLE favorites ADD COLUMN coin_name TEXT;
ALTER TABLE favorites ADD COLUMN coin_symbol TEXT;
ALTER TABLE favorites ADD COLUMN coin_image TEXT;
