-- Fix for NULL country issue in leagues table
-- Run this in your phpMyAdmin to allow NULL countries

ALTER TABLE leagues MODIFY COLUMN country VARCHAR(100) NULL;

-- Optional: Update existing records with NULL countries
UPDATE leagues SET country = 'Unknown' WHERE country IS NULL;

-- Check the fix worked
SELECT COUNT(*) as total_leagues, 
       COUNT(country) as leagues_with_country,
       COUNT(*) - COUNT(country) as leagues_without_country
FROM leagues;