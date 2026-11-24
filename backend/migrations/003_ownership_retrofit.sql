-- 003: ownership retrofit
-- Adds user_id to every existing business table. Nullable first so it's safe
-- against existing rows, backfilled to the earliest user (fine for dev data
-- where you're the only owner so far), then locked to NOT NULL.

ALTER TABLE clients ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE jobs ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE photos ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE rooms ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE furniture_items ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE room_furniture ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

UPDATE clients SET user_id = (SELECT id FROM users ORDER BY id LIMIT 1) WHERE user_id IS NULL;
UPDATE jobs SET user_id = (SELECT id FROM users ORDER BY id LIMIT 1) WHERE user_id IS NULL;
UPDATE photos SET user_id = (SELECT id FROM users ORDER BY id LIMIT 1) WHERE user_id IS NULL;
UPDATE rooms SET user_id = (SELECT id FROM users ORDER BY id LIMIT 1) WHERE user_id IS NULL;

-- The furniture catalog was previously seeded as shared, ownerless reference
-- data (migration 002). Under the ownership model, each user gets their own
-- starter catalog, seeded lazily by the app the first time they open it
-- (see furnitureItemController.getFurnitureItems). The old ownerless rows
-- don't fit that model, so they're retired here rather than force-backfilled
-- onto whichever user happens to exist first.
DELETE FROM room_furniture WHERE user_id IS NULL;
DELETE FROM furniture_items WHERE user_id IS NULL;

ALTER TABLE clients ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE jobs ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE photos ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE rooms ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE furniture_items ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE room_furniture ALTER COLUMN user_id SET NOT NULL;

CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_rooms_user_id ON rooms(user_id);
CREATE INDEX idx_furniture_items_user_id ON furniture_items(user_id);
CREATE INDEX idx_room_furniture_user_id ON room_furniture(user_id);
