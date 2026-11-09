-- Migration: multi-currency POS with per-item currency snapshot + historical cost snapshot
-- Safe to run on an existing project_falcon database. Does not delete rows.
-- Run manually: mysql -u root -p project_falcon < server/src/migrations/002_pos_multicurrency.sql

USE project_falcon;

-- 1. Add new columns to sale_items (nullable-safe defaults; backfilled below)
ALTER TABLE sale_items
  ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'SDG' AFTER price,
  ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,4) DEFAULT 1 AFTER currency,
  ADD COLUMN IF NOT EXISTS unit_price DECIMAL(12,2) DEFAULT 0 AFTER exchange_rate,
  ADD COLUMN IF NOT EXISTS unit_price_sdg DECIMAL(12,2) DEFAULT 0 AFTER unit_price,
  ADD COLUMN IF NOT EXISTS unit_cost_sdg DECIMAL(12,2) DEFAULT 0 AFTER unit_price_sdg;

-- 2. Backfill existing rows: old `price` was always SDG (POS was SDG-only
--    before this change), so unit_price = unit_price_sdg = old price.
--    Cost snapshot backfilled from the CURRENT product cost as a best-effort
--    (pre-existing rows had no cost snapshot to recover).
UPDATE sale_items si
  JOIN products p ON p.id = si.product_id
  SET si.unit_price = si.price,
      si.unit_price_sdg = si.price,
      si.currency = 'SDG',
      si.exchange_rate = 1,
      si.unit_cost_sdg = p.purchase_price
  WHERE si.unit_price_sdg = 0;

-- 3. Drop obsolete sale-level payment/currency columns. Sales are cash-only
--    (no payment method to store) and currency now lives per item.
--    NOTE: this discards amount_paid/change_amount history since those
--    fields are no longer part of the spec; sale totals (subtotal/discount/
--    total) are preserved untouched.
ALTER TABLE sales
  DROP COLUMN IF EXISTS currency,
  DROP COLUMN IF EXISTS exchange_rate,
  DROP COLUMN IF EXISTS payment_method,
  DROP COLUMN IF EXISTS amount_paid,
  DROP COLUMN IF EXISTS change_amount;
