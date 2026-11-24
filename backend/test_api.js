// test_api.js — cross-platform smoke test (Windows/Mac/Linux)
// Run with: node test_api.js

const { spawn } = require('child_process');

const BASE = 'http://localhost:4000';
const TEST_EMAIL = 'james@roomstage.test';
const TEST_PASSWORD = 'testpass123';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, maxAttempts = 30, delayMs = 500) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch (err) {
      // not up yet — keep trying
    }
    await wait(delayMs);
  }
  throw new Error(`Server never responded at ${url} after ${maxAttempts * delayMs}ms.`);
}

async function main() {
  const server = spawn('node', ['server.js'], { stdio: 'inherit' });
  await waitForServer(BASE + '/health');

  try {
    console.log('=== HEALTH ===');
    let res = await fetch(`${BASE}/health`);
    console.log(res.status, await res.json());

    console.log('=== REGISTER ===');
    let token;
    res = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'James Kanyago', email: TEST_EMAIL, password: TEST_PASSWORD }),
    });

    if (res.status === 201) {
      const body = await res.json();
      console.log(res.status, body);
      token = body.token;

      console.log('=== DUPLICATE REGISTER (expect 409) ===');
      res = await fetch(`${BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'James Kanyago', email: TEST_EMAIL, password: TEST_PASSWORD }),
      });
      console.log(res.status);
    } else {
      console.log(`${res.status} — account already exists from a previous run, logging in instead`);
      res = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
      });
      const body = await res.json();
      token = body.token;
    }

    const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    console.log('=== LOGIN WRONG PASSWORD (expect 401) ===');
    res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: 'wrongpass' }),
    });
    console.log(res.status);

    console.log('=== UNAUTHENTICATED /api/clients (expect 401) ===');
    res = await fetch(`${BASE}/api/clients`);
    console.log(res.status);

    console.log('=== CREATE CLIENT ===');
    res = await fetch(`${BASE}/api/clients`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Wanjiru Kariuki', phone: '0722123456', location: 'Kilimani, Nairobi' }),
    });
    const clientRow = await res.json();
    console.log(res.status, clientRow);
    const clientId = clientRow.id;

    console.log('=== CREATE CLIENT MISSING NAME (expect 400) ===');
    res = await fetch(`${BASE}/api/clients`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ phone: '0722000000' }),
    });
    console.log(res.status);

    console.log('=== LIST CLIENTS ===');
    res = await fetch(`${BASE}/api/clients`, { headers: authHeaders });
    console.log(res.status, await res.json());

    console.log('=== CREATE JOB ===');
    res = await fetch(`${BASE}/api/jobs`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        client_id: clientId,
        title: 'Bedsitter room reset',
        price: 2000,
        notes: 'Small space, needs better flow',
      }),
    });
    const job = await res.json();
    console.log(res.status, job);
    const jobId = job.id;

    console.log('=== UPDATE JOB STATUS ===');
    res = await fetch(`${BASE}/api/jobs/${jobId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ status: 'completed', payment_status: 'paid' }),
    });
    console.log(res.status, await res.json());

    console.log('=== ADD PHOTO ===');
    res = await fetch(`${BASE}/api/jobs/${jobId}/photos`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ url: 'https://example.com/before.jpg', kind: 'before' }),
    });
    console.log(res.status, await res.json());

    console.log('=== ADD PHOTO BAD KIND (expect 400) ===');
    res = await fetch(`${BASE}/api/jobs/${jobId}/photos`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ url: 'https://example.com/x.jpg', kind: 'sideways' }),
    });
    console.log(res.status);

    console.log('=== GET CLIENT WITH JOBS ===');
    res = await fetch(`${BASE}/api/clients/${clientId}`, { headers: authHeaders });
    console.log(res.status, await res.json());

    console.log('=== GET JOB WITH PHOTOS + ROOMS ===');
    res = await fetch(`${BASE}/api/jobs/${jobId}`, { headers: authHeaders });
    console.log(res.status, await res.json());

    console.log('=== GET NONEXISTENT CLIENT (expect 404) ===');
    res = await fetch(`${BASE}/api/clients/99999`, { headers: authHeaders });
    console.log(res.status);

    console.log('=== CREATE ROOM ===');
    res = await fetch(`${BASE}/api/jobs/${jobId}/rooms`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Main bedsitter', width_cm: 320, length_cm: 410 }),
    });
    const room = await res.json();
    console.log(res.status, room);
    const roomId = room.id;

    console.log('=== CREATE ROOM MISSING DIMENSIONS (expect 400) ===');
    res = await fetch(`${BASE}/api/jobs/${jobId}/rooms`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Bad room' }),
    });
    console.log(res.status);

    console.log('=== UPDATE ROOM WIDTH ===');
    res = await fetch(`${BASE}/api/rooms/${roomId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ width_cm: 350 }),
    });
    console.log(res.status, await res.json());

    console.log('=== PLACE FURNITURE IN ROOM (3 pieces) ===');
    res = await fetch(`${BASE}/api/furniture-items`, { headers: authHeaders });
    const items = await res.json();
    const sofa = items.find((i) => i.name === 'Sofa');
    const bed = items.find((i) => i.name === 'Bed');
    const rug = items.find((i) => i.name === 'Rug');

    res = await fetch(`${BASE}/api/rooms/${roomId}/furniture`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ furniture_item_id: sofa.id, x_position: 20, y_position: 30, rotation: 0 }),
    });
    const placedSofa = await res.json();
    console.log(res.status, placedSofa);

    res = await fetch(`${BASE}/api/rooms/${roomId}/furniture`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ furniture_item_id: bed.id, x_position: 100, y_position: 50, rotation: 90 }),
    });
    console.log(res.status, await res.json());

    res = await fetch(`${BASE}/api/rooms/${roomId}/furniture`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ furniture_item_id: rug.id, x_position: 150, y_position: 200, rotation: 0 }),
    });
    console.log(res.status, await res.json());

    console.log('=== PLACE FURNITURE MISSING POSITION (expect 400) ===');
    res = await fetch(`${BASE}/api/rooms/${roomId}/furniture`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ furniture_item_id: sofa.id }),
    });
    console.log(res.status);

    console.log('=== MOVE THE SOFA ===');
    res = await fetch(`${BASE}/api/room-furniture/${placedSofa.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ x_position: 60, rotation: 90 }),
    });
    console.log(res.status, await res.json());

    console.log('=== "REFRESH" -- LIST FURNITURE FOR ROOM (expect 3 pieces still there) ===');
    res = await fetch(`${BASE}/api/rooms/${roomId}/furniture`, { headers: authHeaders });
    const placedList = await res.json();
    console.log(res.status, `${placedList.length} pieces`);

    console.log('=== GET JOB -- ROOM SHOULD NEST ITS 3 PLACED PIECES ===');
    res = await fetch(`${BASE}/api/jobs/${jobId}`, { headers: authHeaders });
    const jobWithRoom = await res.json();
    console.log(res.status, `room furniture count: ${jobWithRoom.rooms[0].furniture.length}`);

    console.log('=== REMOVE ONE PLACED PIECE ===');
    res = await fetch(`${BASE}/api/room-furniture/${placedSofa.id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    console.log(res.status);

    console.log('=== LIST FURNITURE CATALOG (expect 17 seeded items -- 12 residential + 5 office) ===');
    res = await fetch(`${BASE}/api/furniture-items`, { headers: authHeaders });
    const catalog = await res.json();
    console.log(res.status, `${catalog.length} items`);

    console.log('=== CREATE CUSTOM FURNITURE ITEM ===');
    res = await fetch(`${BASE}/api/furniture-items`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Shoe rack', width_cm: 60, depth_cm: 30, category: 'storage' }),
    });
    console.log(res.status, await res.json());

    console.log('=== CREATE FURNITURE ITEM MISSING DIMENSIONS (expect 400) ===');
    res = await fetch(`${BASE}/api/furniture-items`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Bad item' }),
    });
    console.log(res.status);

    console.log('=== MULTI-USER ISOLATION: create a second user ===');
    let res2 = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Second Owner', email: 'second-owner@roomstage.test', password: 'testpass123' }),
    });
    let user2Token;
    if (res2.status === 201) {
      user2Token = (await res2.json()).token;
    } else {
      res2 = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'second-owner@roomstage.test', password: 'testpass123' }),
      });
      user2Token = (await res2.json()).token;
    }
    const user2Headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${user2Token}` };

    console.log('=== USER 2 CREATES THEIR OWN CLIENT ===');
    res = await fetch(`${BASE}/api/clients`, {
      method: 'POST',
      headers: user2Headers,
      body: JSON.stringify({ name: 'Second Owner Client' }),
    });
    const user2Client = await res.json();
    console.log(res.status, user2Client);

    console.log('=== USER 2 LISTS CLIENTS (expect only their own, not user 1s) ===');
    res = await fetch(`${BASE}/api/clients`, { headers: user2Headers });
    const user2ClientList = await res.json();
    const leaked = user2ClientList.some((c) => c.name !== 'Second Owner Client');
    console.log(res.status, `${user2ClientList.length} client(s), leaked another user's data: ${leaked}`);

    console.log('=== USER 2 TRIES TO ACCESS USER 1s CLIENT DIRECTLY BY ID (expect 404, not their data) ===');
    res = await fetch(`${BASE}/api/clients/${clientId}`, { headers: user2Headers });
    console.log(res.status);

    console.log('=== USER 2 CATALOG IS SEPARATE (own lazy-seeded 17, not user 1s custom item) ===');
    res = await fetch(`${BASE}/api/furniture-items`, { headers: user2Headers });
    const user2Catalog = await res.json();
    const sawUser1CustomItem = user2Catalog.some((i) => i.name === 'Shoe rack');
    console.log(res.status, `${user2Catalog.length} items, saw user 1's custom item: ${sawUser1CustomItem}`);

    console.log('=== USER 2 TRIES TO DELETE USER 2S OWN CLIENT (should work, expect 204) ===');
    res = await fetch(`${BASE}/api/clients/${user2Client.id}`, { method: 'DELETE', headers: user2Headers });
    console.log(res.status);

    console.log('=== CREATE PROJECT ===');
    res = await fetch(`${BASE}/api/projects`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Taraji Heights Phase 2', location: 'Ngong Road', project_type: 'residential' }),
    });
    const project = await res.json();
    console.log(res.status, project);
    const projectId = project.id;

    console.log('=== CREATE PROJECT MISSING NAME (expect 400) ===');
    res = await fetch(`${BASE}/api/projects`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ location: 'Nowhere' }),
    });
    console.log(res.status);

    console.log('=== CREATE PROJECT BAD TYPE (expect 400) ===');
    res = await fetch(`${BASE}/api/projects`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Bad', project_type: 'not-a-type' }),
    });
    console.log(res.status);

    console.log('=== LIST PROJECTS ===');
    res = await fetch(`${BASE}/api/projects`, { headers: authHeaders });
    console.log(res.status, `${(await res.json()).length} project(s)`);

    console.log('=== CREATE UNIT TYPE UNDER PROJECT ===');
    res = await fetch(`${BASE}/api/projects/${projectId}/unit-types`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: '2-bed Type B',
        category: 'residential',
        bedrooms: 2,
        size_sqm: 108,
        price_kes: 12500000,
        status: 'available',
      }),
    });
    const unitType = await res.json();
    console.log(res.status, unitType);
    const unitTypeId = unitType.id;

    console.log('=== UNIT TYPE GOT A UNIQUE PUBLIC SLUG ===');
    console.log(`public_slug: ${unitType.public_slug}`);

    console.log('=== CREATE UNIT TYPE MISSING NAME (expect 400) ===');
    res = await fetch(`${BASE}/api/projects/${projectId}/unit-types`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ category: 'residential' }),
    });
    console.log(res.status);

    console.log('=== CREATE UNIT TYPE BAD CATEGORY (expect 400) ===');
    res = await fetch(`${BASE}/api/projects/${projectId}/unit-types`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Bad', category: 'not-a-category' }),
    });
    console.log(res.status);

    console.log('=== CREATE UNIT TYPE BAD STATUS (expect 400) ===');
    res = await fetch(`${BASE}/api/projects/${projectId}/unit-types`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Bad', status: 'not-a-status' }),
    });
    console.log(res.status);

    console.log('=== CREATE OFFICE UNIT TYPE (second one, checking slug still unique) ===');
    res = await fetch(`${BASE}/api/projects/${projectId}/unit-types`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: '2-bed Type B', category: 'office', size_sqft: 1260, status: 'draft' }),
    });
    const secondUnitType = await res.json();
    console.log(
      res.status,
      `slug: ${secondUnitType.public_slug} (same name as first, slug must differ: ${secondUnitType.public_slug !== unitType.public_slug})`
    );

    console.log('=== LIST UNIT TYPES FOR PROJECT (expect 2) ===');
    res = await fetch(`${BASE}/api/projects/${projectId}/unit-types`, { headers: authHeaders });
    console.log(res.status, `${(await res.json()).length} unit type(s)`);

    console.log('=== UPDATE UNIT TYPE STATUS ===');
    res = await fetch(`${BASE}/api/unit-types/${unitTypeId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ status: 'reserved' }),
    });
    console.log(res.status, await res.json());

    console.log('=== GET UNIT TYPE DIRECTLY ===');
    res = await fetch(`${BASE}/api/unit-types/${unitTypeId}`, { headers: authHeaders });
    console.log(res.status, await res.json());

    console.log('=== CREATE ROOM UNDER UNIT TYPE (Plans) ===');
    res = await fetch(`${BASE}/api/unit-types/${unitTypeId}/rooms`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Living room', width_cm: 520, length_cm: 420 }),
    });
    const planRoom = await res.json();
    console.log(res.status, planRoom);
    const planRoomId = planRoom.id;

    console.log('=== CREATE ROOM UNDER UNIT TYPE MISSING DIMENSIONS (expect 400) ===');
    res = await fetch(`${BASE}/api/unit-types/${unitTypeId}/rooms`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Bad room' }),
    });
    console.log(res.status);

    console.log('=== LIST ROOMS FOR UNIT TYPE (expect 1) ===');
    res = await fetch(`${BASE}/api/unit-types/${unitTypeId}/rooms`, { headers: authHeaders });
    console.log(res.status, `${(await res.json()).length} room(s)`);

    console.log('=== PLACE FURNITURE IN THE PLAN ROOM (same endpoint as job rooms) ===');
    res = await fetch(`${BASE}/api/rooms/${planRoomId}/furniture`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ furniture_item_id: sofa.id, x_position: 100, y_position: 100, rotation: 0 }),
    });
    console.log(res.status, await res.json());

    console.log('=== ADD PHOTO UNDER UNIT TYPE ===');
    res = await fetch(`${BASE}/api/unit-types/${unitTypeId}/photos`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ url: 'https://example.com/floorplan.jpg', kind: 'plan' }),
    });
    console.log(res.status, await res.json());

    console.log('=== ADD PHOTO UNDER UNIT TYPE BAD KIND (expect 400) ===');
    res = await fetch(`${BASE}/api/unit-types/${unitTypeId}/photos`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ url: 'https://example.com/x.jpg', kind: 'sideways' }),
    });
    console.log(res.status);

    console.log('=== LIST PHOTOS FOR UNIT TYPE (expect 1) ===');
    res = await fetch(`${BASE}/api/unit-types/${unitTypeId}/photos`, { headers: authHeaders });
    console.log(res.status, `${(await res.json()).length} photo(s)`);

    console.log('=== GET UNIT TYPE -- SHOULD NEST THE ROOM (with its furniture) AND THE PHOTO ===');
    res = await fetch(`${BASE}/api/unit-types/${unitTypeId}`, { headers: authHeaders });
    const unitTypeWithPlan = await res.json();
    console.log(
      res.status,
      `${unitTypeWithPlan.rooms.length} room(s), first room furniture: ${unitTypeWithPlan.rooms[0]?.furniture.length}, ${unitTypeWithPlan.photos.length} photo(s)`
    );
    console.log(`unit type also carries project context: ${unitTypeWithPlan.project_name}`);

    console.log('=== PUBLIC SHOW SUITE -- NO AUTH HEADER AT ALL (expect 200) ===');
    res = await fetch(`${BASE}/api/public/unit-types/${unitType.public_slug}`);
    const publicUnit = await res.json();
    console.log(
      res.status,
      `${publicUnit.name}, project: ${publicUnit.project?.name}, ${publicUnit.rooms.length} room(s), ${publicUnit.photos.length} photo(s)`
    );

    console.log('=== PUBLIC SHOW SUITE -- ROOM FURNITURE IS VISIBLE WITHOUT AUTH ===');
    console.log(`first room furniture count: ${publicUnit.rooms[0]?.furniture.length}`);

    console.log('=== PUBLIC SHOW SUITE -- BAD SLUG (expect 404) ===');
    res = await fetch(`${BASE}/api/public/unit-types/not-a-real-slug`);
    console.log(res.status);

    console.log('=== GET UNIT TYPE FOR NONEXISTENT ID (expect 404) ===');
    res = await fetch(`${BASE}/api/unit-types/999999`, { headers: authHeaders });
    console.log(res.status);

    console.log('=== USER 2 CANNOT SEE USER 1s UNIT TYPE (expect 404) ===');
    res = await fetch(`${BASE}/api/unit-types/${unitTypeId}`, { headers: user2Headers });
    console.log(res.status);

    console.log('=== GET PROJECT -- SHOULD NEST BOTH UNIT TYPES ===');
    res = await fetch(`${BASE}/api/projects/${projectId}`, { headers: authHeaders });
    const projectWithUnits = await res.json();
    console.log(res.status, `${projectWithUnits.unitTypes.length} unit type(s) nested`);

    console.log('=== DELETE ONE UNIT TYPE ===');
    res = await fetch(`${BASE}/api/unit-types/${secondUnitType.id}`, { method: 'DELETE', headers: authHeaders });
    console.log(res.status);

    console.log('=== CREATE JOB LINKED TO PROJECT ===');
    res = await fetch(`${BASE}/api/jobs`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ client_id: clientId, title: 'Show suite staging', price: 15000, project_id: projectId }),
    });
    const projectJob = await res.json();
    console.log(res.status, projectJob);

    console.log('=== CREATE JOB WITH SOMEONE ELSES PROJECT_ID (expect 400) ===');
    res = await fetch(`${BASE}/api/jobs`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ client_id: clientId, title: 'Bad link', project_id: 999999 }),
    });
    console.log(res.status);

    console.log('=== CREATE LEAD UNDER PROJECT ===');
    res = await fetch(`${BASE}/api/projects/${projectId}/leads`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Otieno Buyer', phone: '0733555111', source: 'Property24' }),
    });
    const lead = await res.json();
    console.log(res.status, lead);

    console.log('=== CREATE LEAD MISSING NAME (expect 400) ===');
    res = await fetch(`${BASE}/api/projects/${projectId}/leads`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ phone: '0700000000' }),
    });
    console.log(res.status);

    console.log('=== UPDATE LEAD STATUS ===');
    res = await fetch(`${BASE}/api/leads/${lead.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ status: 'viewing' }),
    });
    console.log(res.status, await res.json());

    console.log('=== UPDATE LEAD BAD STATUS (expect 400) ===');
    res = await fetch(`${BASE}/api/leads/${lead.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ status: 'not-a-status' }),
    });
    console.log(res.status);

    console.log('=== LIST LEADS FOR PROJECT ===');
    res = await fetch(`${BASE}/api/projects/${projectId}/leads`, { headers: authHeaders });
    console.log(res.status, `${(await res.json()).length} lead(s)`);

    console.log('=== CONVERT LEAD TO JOB (one action) ===');
    res = await fetch(`${BASE}/api/leads/${lead.id}/convert`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ client_id: clientId, title: 'Otieno unit staging', price: 8000 }),
    });
    const convertedJob = await res.json();
    console.log(res.status, convertedJob);

    console.log('=== GET PROJECT -- SHOULD NEST LEADS AND JOBS ===');
    res = await fetch(`${BASE}/api/projects/${projectId}`, { headers: authHeaders });
    const projectDetail = await res.json();
    console.log(
      res.status,
      `${projectDetail.leads.length} lead(s), ${projectDetail.jobs.length} job(s), ${projectDetail.unitTypes.length} unit type(s)`
    );

    console.log('=== DELETE PROJECT (should cascade to its jobs and unit types, not the client) ===');
    res = await fetch(`${BASE}/api/projects/${projectId}`, { method: 'DELETE', headers: authHeaders });
    console.log(res.status);

    console.log('=== VERIFY PROJECT-LINKED JOB GONE (expect 404 -- cascade worked) ===');
    res = await fetch(`${BASE}/api/jobs/${projectJob.id}`, { headers: authHeaders });
    console.log(res.status);

    console.log('=== VERIFY UNIT TYPE GONE (expect 404 -- cascade worked) ===');
    res = await fetch(`${BASE}/api/unit-types/${unitTypeId}`, { headers: authHeaders });
    console.log(res.status);

    console.log('=== VERIFY PLAN ROOM ALSO GONE (expect 404 -- cascade reached through unit_type) ===');
    res = await fetch(`${BASE}/api/rooms/${planRoomId}`, { headers: authHeaders });
    console.log(res.status);

    console.log('=== VERIFY CLIENT STILL EXISTS (project cascade should not touch it) ===');
    res = await fetch(`${BASE}/api/clients/${clientId}`, { headers: authHeaders });
    console.log(res.status);

    console.log('=== DASHBOARD (fresh, should be all zeros) ===');
    res = await fetch(`${BASE}/api/dashboard`, { headers: authHeaders });
    console.log(res.status, await res.json());

    console.log('=== SEED SAMPLE DATA (expect 409 -- account already has clients from earlier tests) ===');
    res = await fetch(`${BASE}/api/sample-data/seed`, { method: 'POST', headers: authHeaders });
    console.log(res.status);

    console.log('=== SEED SAMPLE DATA ON A CLEAN SECOND USER (expect 201) ===');
    res = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Sample Owner', email: 'sample-owner@roomstage.test', password: 'testpass123' }),
    });
    let sampleToken;
    if (res.status === 201) {
      sampleToken = (await res.json()).token;
    } else {
      res = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'sample-owner@roomstage.test', password: 'testpass123' }),
      });
      sampleToken = (await res.json()).token;
    }
    const sampleHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${sampleToken}` };

    res = await fetch(`${BASE}/api/sample-data/seed`, { method: 'POST', headers: sampleHeaders });
    console.log(res.status, await res.json());

    console.log('=== SEED AGAIN ON SAME USER (expect 409 -- guarded against duplicate seeding) ===');
    res = await fetch(`${BASE}/api/sample-data/seed`, { method: 'POST', headers: sampleHeaders });
    console.log(res.status);

    console.log('=== DASHBOARD AFTER SEEDING (expect real numbers) ===');
    res = await fetch(`${BASE}/api/dashboard`, { headers: sampleHeaders });
    console.log(res.status, await res.json());

    console.log('=== SEEDED VILLA UNIT PUBLIC PAGE WORKS (expect 200, no auth) ===');
    res = await fetch(`${BASE}/api/public/unit-types/karen-villa-sample`);
    const sampleVilla = await res.json();
    console.log(res.status, `${sampleVilla.name}, ${sampleVilla.rooms[0]?.furniture.length} pieces placed`);

    console.log('=== DELETE CLIENT (should cascade to job + photo + room) ===');
    res = await fetch(`${BASE}/api/clients/${clientId}`, { method: 'DELETE', headers: authHeaders });
    console.log(res.status);

    console.log('=== VERIFY JOB GONE (expect 404 -- cascade worked) ===');
    res = await fetch(`${BASE}/api/jobs/${jobId}`, { headers: authHeaders });
    console.log(res.status);

    console.log('=== VERIFY ROOM GONE (expect 404 -- cascade worked) ===');
    res = await fetch(`${BASE}/api/rooms/${roomId}`, { headers: authHeaders });
    console.log(res.status);

    console.log('=== ALL TESTS DONE ===');
  } catch (err) {
    console.error('TEST SCRIPT ERROR:', err);
  } finally {
    server.kill();
    process.exit(0);
  }
}

main();
