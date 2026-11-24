const pool = require('../config/db');

async function getFurnitureForRoom(req, res, next) {
  try {
    const { roomId } = req.params;
    const result = await pool.query(
      `SELECT room_furniture.*, furniture_items.name, furniture_items.width_cm,
              furniture_items.depth_cm, furniture_items.category
       FROM room_furniture
       JOIN furniture_items ON room_furniture.furniture_item_id = furniture_items.id
       WHERE room_furniture.room_id = $1 AND room_furniture.user_id = $2
       ORDER BY room_furniture.id`,
      [roomId, req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

async function placeFurniture(req, res, next) {
  try {
    const { roomId } = req.params;
    const { furniture_item_id, x_position, y_position, rotation } = req.body;

    if (!furniture_item_id || x_position === undefined || y_position === undefined) {
      return res.status(400).json({
        error: 'furniture_item_id, x_position, and y_position are required',
      });
    }

    const result = await pool.query(
      `INSERT INTO room_furniture (user_id, room_id, furniture_item_id, x_position, y_position, rotation)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, roomId, furniture_item_id, x_position, y_position, rotation || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function updatePlacedFurniture(req, res, next) {
  try {
    const { id } = req.params;
    const { x_position, y_position, rotation } = req.body;

    const result = await pool.query(
      `UPDATE room_furniture SET
         x_position = COALESCE($1, x_position),
         y_position = COALESCE($2, y_position),
         rotation = COALESCE($3, rotation)
       WHERE id = $4 AND user_id = $5 RETURNING *`,
      [x_position, y_position, rotation, id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Placed furniture not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function removePlacedFurniture(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM room_furniture WHERE id = $1 AND user_id = $2 RETURNING id', [
      id,
      req.user.id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Placed furniture not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getFurnitureForRoom,
  placeFurniture,
  updatePlacedFurniture,
  removePlacedFurniture,
};
