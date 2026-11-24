-- 004: projects / unit types / leads -- the Sales Velocity OS layer
-- Legacy client -> job -> room still works untouched. This adds a second,
-- optional hierarchy: project -> unit_type, which jobs/photos/rooms can
-- attach to instead.

CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  location VARCHAR(150),
  project_type VARCHAR(20) NOT NULL DEFAULT 'residential'
    CHECK (project_type IN ('residential', 'commercial', 'mixed')),
  notes TEXT,
  contact_phone VARCHAR(20),
  contact_email VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE unit_types (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(20) NOT NULL DEFAULT 'residential' CHECK (category IN ('residential', 'office')),
  bedrooms INTEGER,
  size_sqm DECIMAL(8, 2),
  size_sqft DECIMAL(8, 2),
  price_kes INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'available', 'reserved', 'sold', 'let', 'off_market')),
  notes TEXT,
  public_slug VARCHAR(60) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  unit_type_id INTEGER REFERENCES unit_types(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  source VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'viewing', 'won', 'lost')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Jobs: optionally also tied to a project / unit type. client_id stays
-- required -- every job still belongs to a client either way.
ALTER TABLE jobs ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE jobs ADD COLUMN unit_type_id INTEGER REFERENCES unit_types(id) ON DELETE CASCADE;
ALTER TABLE jobs ADD COLUMN scheduled_on DATE;

-- Photos: kind replaces the old before/after-only "type", plus a caption,
-- plus the option to hang off a unit_type instead of a job. Exactly one
-- parent, enforced by the DB, not application code.
ALTER TABLE photos RENAME COLUMN type TO kind;
ALTER TABLE photos DROP CONSTRAINT photos_type_check;
ALTER TABLE photos ADD CONSTRAINT photos_kind_check CHECK (kind IN ('before', 'after', 'listing', 'plan'));
ALTER TABLE photos ADD COLUMN caption TEXT;
ALTER TABLE photos ALTER COLUMN job_id DROP NOT NULL;
ALTER TABLE photos ADD COLUMN unit_type_id INTEGER REFERENCES unit_types(id) ON DELETE CASCADE;
ALTER TABLE photos ADD CONSTRAINT photos_exactly_one_parent
  CHECK (num_nonnulls(job_id, unit_type_id) = 1);

-- Rooms: same "exactly one parent" pattern, plus notes.
ALTER TABLE rooms ADD COLUMN notes TEXT;
ALTER TABLE rooms ALTER COLUMN job_id DROP NOT NULL;
ALTER TABLE rooms ADD COLUMN unit_type_id INTEGER REFERENCES unit_types(id) ON DELETE CASCADE;
ALTER TABLE rooms ADD CONSTRAINT rooms_exactly_one_parent
  CHECK (num_nonnulls(job_id, unit_type_id) = 1);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_unit_types_project_id ON unit_types(project_id);
CREATE INDEX idx_unit_types_user_id ON unit_types(user_id);
CREATE INDEX idx_leads_project_id ON leads(project_id);
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_jobs_project_id ON jobs(project_id);
CREATE INDEX idx_jobs_unit_type_id ON jobs(unit_type_id);
CREATE INDEX idx_photos_unit_type_id ON photos(unit_type_id);
CREATE INDEX idx_rooms_unit_type_id ON rooms(unit_type_id);
