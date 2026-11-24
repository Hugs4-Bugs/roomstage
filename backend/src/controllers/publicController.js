const pool = require('../config/db');

// Intentionally no user_id scoping anywhere in this file -- a public
// show-suite link is meant to be viewable by anyone who has the slug,
// signed in or not. This is the one place in the API that's deliberately
// public, and it's mounted without the `authenticate` middleware.
async function getPublicUnitType(req, res, next) {
  try {
    const { slug } = req.params;
    const result = await pool.query('SELECT * FROM unit_types WHERE public_slug = $1', [slug]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    const unit = result.rows[0];

    const project = await pool.query(
      'SELECT name, location, contact_phone, contact_email FROM projects WHERE id = $1',
      [unit.project_id]
    );

    const photos = await pool.query(
      'SELECT url, kind, caption FROM photos WHERE unit_type_id = $1 ORDER BY uploaded_at',
      [unit.id]
    );
    const rooms = await pool.query('SELECT id, name, width_cm, length_cm FROM rooms WHERE unit_type_id = $1', [
      unit.id,
    ]);

    const roomIds = rooms.rows.map((r) => r.id);
    let furnitureByRoom = {};
    if (roomIds.length > 0) {
      const placed = await pool.query(
        `SELECT room_furniture.room_id, room_furniture.x_position, room_furniture.y_position,
                room_furniture.rotation, furniture_items.name, furniture_items.width_cm, furniture_items.depth_cm
         FROM room_furniture
         JOIN furniture_items ON room_furniture.furniture_item_id = furniture_items.id
         WHERE room_furniture.room_id = ANY($1::int[])`,
        [roomIds]
      );
      furnitureByRoom = placed.rows.reduce((acc, piece) => {
        (acc[piece.room_id] ||= []).push(piece);
        return acc;
      }, {});
    }
    const roomsWithFurniture = rooms.rows.map((r) => ({ ...r, furniture: furnitureByRoom[r.id] || [] }));

    res.json({
      name: unit.name,
      category: unit.category,
      bedrooms: unit.bedrooms,
      size_sqm: unit.size_sqm,
      size_sqft: unit.size_sqft,
      price_kes: unit.price_kes,
      status: unit.status,
      project: project.rows[0] || null,
      rooms: roomsWithFurniture,
      photos: photos.rows,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getPublicUnitType };
