-- Roomstage database schema
-- Run with: psql "$DATABASE_URL" -f migrations/001_init_schema.sql

-- Users (you, the business owner — extensible to a team later)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  location VARCHAR(150),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Jobs (a piece of work for a client — staging, organizing, a room reset, etc.)
CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'inquiry' CHECK (status IN ('inquiry', 'in_progress', 'completed')),
  price DECIMAL(10,2),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'deposit_paid', 'paid')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Rooms (belongs to a job — the physical space being planned)
CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  name VARCHAR(100),
  width_cm INTEGER NOT NULL,
  length_cm INTEGER NOT NULL,
  door_position JSONB,
  window_positions JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Furniture catalog (reusable item definitions — bed, wardrobe, desk, etc.)
CREATE TABLE IF NOT EXISTS furniture_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  width_cm INTEGER NOT NULL,
  depth_cm INTEGER NOT NULL,
  category VARCHAR(50)
);

-- Furniture placed in a specific room layout (a saved arrangement)
CREATE TABLE IF NOT EXISTS room_furniture (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  furniture_item_id INTEGER REFERENCES furniture_items(id),
  x_position INTEGER NOT NULL,
  y_position INTEGER NOT NULL,
  rotation INTEGER NOT NULL DEFAULT 0,
  layout_version INTEGER NOT NULL DEFAULT 1
);

-- Before / after photos, tied to a job
CREATE TABLE IF NOT EXISTS photos (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('before', 'after')),
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for the foreign keys we'll actually query on
CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_rooms_job_id ON rooms(job_id);
CREATE INDEX IF NOT EXISTS idx_photos_job_id ON photos(job_id);
CREATE INDEX IF NOT EXISTS idx_room_furniture_room_id ON room_furniture(room_id);
