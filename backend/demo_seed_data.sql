-- NourishLink demo seed data
-- Purpose: project demonstration only. All names, emails, and records below are synthetic.
-- Run this in Supabase SQL Editor after creating the project tables.

-- ---------------------------------------------------------
-- 1. Partner organisations
-- ---------------------------------------------------------
INSERT INTO partner_organizations
  (organization_name, organization_type, contact_email, service_area, verified_status)
VALUES
  ('FoodBridge Community Network', 'Food Charity', 'ops@foodbridge.example', 'Central Singapore', 'Verified'),
  ('CarePlate Relief Kitchen', 'Community Kitchen', 'dispatch@careplate.example', 'North-East Singapore', 'Verified'),
  ('Harvest Hope Alliance', 'Food Bank', 'partners@harvesthope.example', 'West Singapore', 'Verified'),
  ('Silver Meals Collective', 'Elderly Care Partner', 'logistics@silvermeals.example', 'East Singapore', 'Verified')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------
-- 2. Restaurants
-- ---------------------------------------------------------
INSERT INTO restaurants
  (business_name, address, postal_code, contact_email)
VALUES
  ('Tiong Bahru Curry House', '56 Eng Hoon Street, Singapore', '160056', 'ops@tiongbahrucurry.example'),
  ('Marina Bento Lab', '8 Marina Boulevard, Singapore', '018981', 'manager@marinabento.example'),
  ('Serangoon Bakery Collective', '23 Serangoon Central, Singapore', '556083', 'daily@serangoonbakery.example'),
  ('Jurong Green Kitchen', '2 Jurong East Central 1, Singapore', '609731', 'surplus@juronggreen.example'),
  ('Katong Noodle Works', '112 East Coast Road, Singapore', '428802', 'closing@katongnoodle.example'),
  ('Queenstown Soup Studio', '39 Margaret Drive, Singapore', '141039', 'ops@queenstownsoup.example')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------
-- 3. Volunteers
-- Replace telegram_chat_id values with real Telegram from.id values for live bot tests.
-- ---------------------------------------------------------
INSERT INTO volunteers
  (volunteer_name, telegram_chat_id, organization_id)
VALUES
  ('Aisha Rahman', 'demo-telegram-1001', 1),
  ('Jeky Tan', 'demo-telegram-1002', 1),
  ('Denas Lim', 'demo-telegram-1003', 2),
  ('Denna Joy', 'demo-telegram-1004', 3),
  ('Zheng Chengchao', 'demo-telegram-1005', 4)
ON CONFLICT (telegram_chat_id) DO NOTHING;

-- ---------------------------------------------------------
-- 4. Daily inventory
-- Safe consume-by times use CURRENT_TIMESTAMP so the demo stays fresh.
-- ---------------------------------------------------------
INSERT INTO daily_inventory
  (restaurant_id, item_name, units_produced, units_sold, surplus_quantity, safe_consume_by, status)
VALUES
  (1, 'Curry chicken meal packs', 90, 62, 28, CURRENT_TIMESTAMP + INTERVAL '4 hours', 'Available'),
  (2, 'Salmon bento boxes', 80, 68, 12, CURRENT_TIMESTAMP + INTERVAL '3 hours', 'Available'),
  (3, 'Wholegrain bread loaves', 120, 84, 36, CURRENT_TIMESTAMP + INTERVAL '14 hours', 'Available'),
  (4, 'Vegetarian rice bowls', 75, 58, 17, CURRENT_TIMESTAMP + INTERVAL '5 hours', 'Available'),
  (5, 'Chicken noodle soup portions', 65, 50, 15, CURRENT_TIMESTAMP + INTERVAL '2 hours', 'Available'),
  (6, 'Pumpkin soup cups', 70, 60, 10, CURRENT_TIMESTAMP + INTERVAL '6 hours', 'Available'),
  (2, 'Teriyaki chicken bentos', 100, 90, 10, CURRENT_TIMESTAMP - INTERVAL '1 hour', 'Claimed'),
  (4, 'Tofu vegetable packs', 60, 45, 15, CURRENT_TIMESTAMP - INTERVAL '2 hours', 'Claimed'),
  (1, 'Dhal and rice sets', 80, 72, 8, CURRENT_TIMESTAMP - INTERVAL '3 hours', 'Claimed');

-- ---------------------------------------------------------
-- 5. Rescue pickups
-- These rows create demo history for the receipt/completed metrics.
-- The inventory_id values are found by item_name to avoid assuming exact serial IDs.
-- ---------------------------------------------------------
INSERT INTO rescue_pickups
  (inventory_id, volunteer_id, pickup_status, assigned_at, completed_at)
SELECT
  i.inventory_id,
  v.volunteer_id,
  'Completed',
  CURRENT_TIMESTAMP - INTERVAL '2 hours',
  CURRENT_TIMESTAMP - INTERVAL '1 hour'
FROM daily_inventory i
JOIN volunteers v ON v.telegram_chat_id = 'demo-telegram-1001'
WHERE i.item_name = 'Teriyaki chicken bentos'
ORDER BY i.inventory_id DESC
LIMIT 1;

INSERT INTO rescue_pickups
  (inventory_id, volunteer_id, pickup_status, assigned_at, completed_at)
SELECT
  i.inventory_id,
  v.volunteer_id,
  'Completed',
  CURRENT_TIMESTAMP - INTERVAL '3 hours',
  CURRENT_TIMESTAMP - INTERVAL '2 hours'
FROM daily_inventory i
JOIN volunteers v ON v.telegram_chat_id = 'demo-telegram-1003'
WHERE i.item_name = 'Tofu vegetable packs'
ORDER BY i.inventory_id DESC
LIMIT 1;

INSERT INTO rescue_pickups
  (inventory_id, volunteer_id, pickup_status, assigned_at)
SELECT
  i.inventory_id,
  v.volunteer_id,
  'Dispatched',
  CURRENT_TIMESTAMP - INTERVAL '40 minutes'
FROM daily_inventory i
JOIN volunteers v ON v.telegram_chat_id = 'demo-telegram-1005'
WHERE i.item_name = 'Dhal and rice sets'
ORDER BY i.inventory_id DESC
LIMIT 1;

-- ---------------------------------------------------------
-- 6. Useful demo check queries
-- ---------------------------------------------------------
-- Available units:
-- SELECT SUM(surplus_quantity) AS available_units
-- FROM daily_inventory
-- WHERE status = 'Available' AND surplus_quantity > 0;

-- Claimed units:
-- SELECT SUM(surplus_quantity) AS claimed_units
-- FROM daily_inventory
-- WHERE status = 'Claimed';

-- Completed receipts:
-- SELECT COUNT(*) AS receipts_locked
-- FROM rescue_pickups
-- WHERE pickup_status = 'Completed';

-- Partner organisation performance:
-- SELECT
--   po.organization_name,
--   COUNT(rp.pickup_id) AS completed_pickups,
--   COALESCE(SUM(di.surplus_quantity), 0) AS units_rescued
-- FROM partner_organizations po
-- LEFT JOIN volunteers v ON v.organization_id = po.organization_id
-- LEFT JOIN rescue_pickups rp ON rp.volunteer_id = v.volunteer_id AND rp.pickup_status = 'Completed'
-- LEFT JOIN daily_inventory di ON di.inventory_id = rp.inventory_id
-- GROUP BY po.organization_name
-- ORDER BY units_rescued DESC;
