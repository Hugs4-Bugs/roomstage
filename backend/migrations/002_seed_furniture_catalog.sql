-- 002: seed a starter furniture catalog
-- Safe to run more than once — only inserts if the table is currently empty,
-- so it won't duplicate rows if you accidentally run it twice.

INSERT INTO furniture_items (name, width_cm, depth_cm, category)
SELECT * FROM (VALUES
  ('Sofa',          180, 85, 'seating'),
  ('Bed',           100, 200, 'bed'),
  ('Nightstand',    45, 40, 'storage'),
  ('Dining table',  150, 90, 'table'),
  ('Dining chair',  45, 50, 'seating'),
  ('Rug',           200, 140, 'decor'),
  ('Plant',         40, 40, 'decor'),
  ('Floor lamp',    35, 35, 'lighting'),
  ('TV stand',      120, 40, 'storage'),
  ('Bookshelf',     80, 30, 'storage'),
  ('Desk',          120, 60, 'table'),
  ('Coffee table',  100, 50, 'table')
) AS seed(name, width_cm, depth_cm, category)
WHERE NOT EXISTS (SELECT 1 FROM furniture_items);
