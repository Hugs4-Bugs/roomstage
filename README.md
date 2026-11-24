# Roomstage

A CRM + room-layout planning tool for a staging/organizing side business — built on Node/Express, PostgreSQL, and React. "Roomstage" is a placeholder name; rename it whenever you like.

Each client job carries its own status, price, payment state, before/after photos, and (from Week 4 onward) room dimensions and a furniture layout — one system instead of WhatsApp + spreadsheets + Instagram.

## Tech stack

- **Backend:** Node.js + Express, PostgreSQL (`pg`, no ORM), JWT auth (`jsonwebtoken` + `bcryptjs`)
- **Frontend:** React + Vite, React Router, Tailwind CSS, Axios
- **Not wired yet (see Roadmap):** Cloudinary (photo upload), M-Pesa Daraja (deposits), the layout builder UI, the optimization/AI layers

## Folder structure

```
roomstage/
  backend/
    migrations/001_init_schema.sql   # run this once against your database
    src/
      config/db.js                   # Postgres connection pool
      middleware/auth.js             # JWT verification
      middleware/errorHandler.js     # centralized error responses
      controllers/                   # auth, clients, jobs, photos
      routes/                        # matching route files
      app.js
    server.js
    test_api.sh                      # end-to-end smoke test against a live server
    .env.example
  frontend/
    src/
      api/client.js                  # axios instance, attaches JWT, redirects to /login on 401
      context/AuthContext.jsx
      components/Layout.jsx          # sidebar nav + shell
      components/ProtectedRoute.jsx
      pages/Login.jsx
      pages/Dashboard.jsx            # stats + recent jobs
      pages/Clients.jsx              # search, create, list
      pages/Jobs.jsx                 # filter, create, inline status/payment updates
```

## Setup

### 1. Database

```bash
# create a database and user (adjust names/password as you like)
psql -U postgres -c "CREATE USER roomstage WITH PASSWORD 'yourpassword';"
psql -U postgres -c "CREATE DATABASE roomstage_dev OWNER roomstage;"

# load the schema
psql "postgresql://roomstage:yourpassword@localhost:5432/roomstage_dev" -f backend/migrations/001_init_schema.sql
```

If you'd rather use a managed Postgres (Railway, Render, Supabase), just run the same migration file against the connection string they give you.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set DATABASE_URL to match what you created above,
# and set JWT_SECRET to a random string, e.g.:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

npm run dev   # http://localhost:4000
```

Sanity check: `bash test_api.sh` spins up the server, runs through register/login/CRUD/validation/cascade-delete against your database, and prints every response. If all the "expect NNN" lines match, your setup is good.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

The frontend expects the API at `http://localhost:4000` by default. To point it elsewhere, create `frontend/.env` with `VITE_API_URL=https://your-api-url`.

### 4. First use

Open the frontend, register an account (this is you, the business owner — there's no public signup flow beyond this), then add a client and a job.

## API reference

All routes except `/health` and `/api/auth/*` require `Authorization: Bearer <token>`.

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create your account, returns `{ user, token }` |
| POST | `/api/auth/login` | Returns `{ user, token }` |
| GET | `/api/clients?search=` | List clients, optional search on name/phone/location |
| POST | `/api/clients` | Create client `{ name, phone?, email?, location? }` |
| GET/PUT/DELETE | `/api/clients/:id` | Get (with nested jobs), update, or delete |
| GET | `/api/jobs?client_id=&status=` | List jobs, filterable |
| POST | `/api/jobs` | Create job `{ client_id, title, price?, notes? }` |
| GET/PUT/DELETE | `/api/jobs/:id` | Get (with nested photos + rooms), update, or delete |
| GET/POST | `/api/jobs/:jobId/photos` | List or add a photo `{ url, type: 'before'\|'after' }` |
| DELETE | `/api/photos/:id` | Remove a photo |

Deleting a client cascades to their jobs, and deleting a job cascades to its photos/rooms — this is enforced at the database level (`ON DELETE CASCADE`), not just in application code.

## Roadmap

What's built (**Weeks 1–3** of the original plan) vs. what's next:

- [x] Schema for all 6 core tables + auth
- [x] Backend CRUD: auth, clients, jobs, photos
- [x] Frontend: login/register, dashboard, client + job management with inline status updates
- [x] **Week 4–5:** Canvas-based room layout builder (React + Konva.js). From a job's detail page: add rooms, drop furniture from a starter catalog, drag to move (snaps to a 10cm grid), rotate 90° at a time, remove pieces. Positions save immediately on each interaction — no separate "Save" step. Room/job pages nest the full layout on load (`GET /api/jobs/:id`), so reloading shows exactly what you left
- [ ] **Week 6:** Layout scoring algorithm (walkway clearance, overlap, door/window blocking)
- [ ] **Week 7–8:** Auto-suggestion layer (genetic algorithm / simulated annealing over the scoring function)
- [ ] Direct photo upload via Cloudinary (currently photos are stored by URL — paste a link, or wire up `multer` + the Cloudinary SDK using the credentials already stubbed in `.env.example`)
- [ ] M-Pesa Daraja integration for deposits (credentials stubbed in `.env.example`, not yet called anywhere)
- [ ] Optional Layer 3: photo-based furniture detection (YOLO), once the manual layout builder is validated

## Notes

- Passwords are hashed with bcrypt; never stored in plaintext.
- CORS is wide open (`cors()`) for local development — restrict it to your actual frontend origin before deploying.
- The `.env` file is gitignored on purpose — never commit real credentials. Only `.env.example` ships with placeholder keys.
