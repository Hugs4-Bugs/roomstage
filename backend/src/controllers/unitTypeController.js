const pool = require('../config/db');
const crypto = require('crypto');

const CATEGORIES = ['residential', 'office'];
const STATUSES = ['draft', 'available', 'reserved', 'sold', 'let', 'off_market'];

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function generateUniqueSlug(name) {
  const base = slugify(name) || 'unit';
  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = crypto.randomBytes(3).toString('hex');
    const slug = `${base}-${suffix}`;
    const existing = await pool.query('SELECT id FROM unit_types WHERE public_slug = $1', [slug]);
    if (existing.rows.length === 0) return slug;
  }
  return `${base}-${Date.now()}`;
}

async function getUnitTypesForProject(req, res, next) {
  try {
    const { projectId } = req.params;
    const result = await pool.query(
      'SELECT * FROM unit_types WHERE project_id = $1 AND user_id = $2 ORDER BY created_at',
      [projectId, req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

async function createUnitType(req, res, next) {
  try {
    const { projectId } = req.params;
    const { name, category, bedrooms, size_sqm, size_sqft, price_kes, status, notes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (category && !CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `category must be one of ${CATEGORIES.join(', ')}` });
    }
    if (status && !STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${STATUSES.join(', ')}` });
    }

    const projectCheck = await pool.query('SELECT id FROM projects WHERE id = $1 AND user_id = $2', [
      projectId,
      req.user.id,
    ]);
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const slug = await generateUniqueSlug(name);

    const result = await pool.query(
      `INSERT INTO unit_types
         (user_id, project_id, name, category, bedrooms, size_sqm, size_sqft, price_kes, status, notes, public_slug)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        req.user.id,
        projectId,
        name,
        category || 'residential',
        bedrooms || null,
        size_sqm || null,
        size_sqft || null,
        price_kes || null,
        status || 'draft',
        notes || null,
        slug,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function getUnitType(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT unit_types.*, projects.name AS project_name, projects.location AS project_location,
              projects.contact_phone AS project_contact_phone, projects.contact_email AS project_contact_email
       FROM unit_types
       JOIN projects ON unit_types.project_id = projects.id
       WHERE unit_types.id = $1 AND unit_types.user_id = $2`,
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Unit type not found' });
    }

    const photos = await pool.query(
      'SELECT id, url, kind, caption, uploaded_at FROM photos WHERE unit_type_id = $1 AND user_id = $2 ORDER BY uploaded_at',
      [id, req.user.id]
    );
    const rooms = await pool.query(
      'SELECT id, name, width_cm, length_cm, notes FROM rooms WHERE unit_type_id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    const roomIds = rooms.rows.map((r) => r.id);
    let furnitureByRoom = {};
    if (roomIds.length > 0) {
      const placed = await pool.query(
        `SELECT room_furniture.*, furniture_items.name, furniture_items.width_cm,
                furniture_items.depth_cm, furniture_items.category
         FROM room_furniture
         JOIN furniture_items ON room_furniture.furniture_item_id = furniture_items.id
         WHERE room_furniture.room_id = ANY($1::int[]) AND room_furniture.user_id = $2`,
        [roomIds, req.user.id]
      );
      furnitureByRoom = placed.rows.reduce((acc, piece) => {
        (acc[piece.room_id] ||= []).push(piece);
        return acc;
      }, {});
    }
    const roomsWithFurniture = rooms.rows.map((r) => ({ ...r, furniture: furnitureByRoom[r.id] || [] }));

    res.json({ ...result.rows[0], photos: photos.rows, rooms: roomsWithFurniture });
  } catch (err) {
    next(err);
  }
}

async function updateUnitType(req, res, next) {
  try {
    const { id } = req.params;
    const { name, category, bedrooms, size_sqm, size_sqft, price_kes, status, notes } = req.body;

    if (category && !CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `category must be one of ${CATEGORIES.join(', ')}` });
    }
    if (status && !STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${STATUSES.join(', ')}` });
    }

    const result = await pool.query(
      `UPDATE unit_types SET
         name = COALESCE($1, name),
         category = COALESCE($2, category),
         bedrooms = COALESCE($3, bedrooms),
         size_sqm = COALESCE($4, size_sqm),
         size_sqft = COALESCE($5, size_sqft),
         price_kes = COALESCE($6, price_kes),
         status = COALESCE($7, status),
         notes = COALESCE($8, notes)
       WHERE id = $9 AND user_id = $10 RETURNING *`,
      [name, category, bedrooms, size_sqm, size_sqft, price_kes, status, notes, id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Unit type not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function deleteUnitType(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM unit_types WHERE id = $1 AND user_id = $2 RETURNING id', [
      id,
      req.user.id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Unit type not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getUnitTypesForProject, createUnitType, getUnitType, updateUnitType, deleteUnitType };
