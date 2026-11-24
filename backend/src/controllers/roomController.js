const pool = require('../config/db');

async function getRoomsForJob(req, res, next) {
  try {
    const { jobId } = req.params;
    const result = await pool.query('SELECT * FROM rooms WHERE job_id = $1 AND user_id = $2 ORDER BY created_at', [
      jobId,
      req.user.id,
    ]);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

async function getRoomsForUnitType(req, res, next) {
  try {
    const { unitTypeId } = req.params;
    const result = await pool.query(
      'SELECT * FROM rooms WHERE unit_type_id = $1 AND user_id = $2 ORDER BY created_at',
      [unitTypeId, req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

async function createRoomForUnitType(req, res, next) {
  try {
    const { unitTypeId } = req.params;
    const { name, width_cm, length_cm, notes } = req.body;

    if (!width_cm || !length_cm) {
      return res.status(400).json({ error: 'width_cm and length_cm are required' });
    }
    if (width_cm <= 0 || length_cm <= 0) {
      return res.status(400).json({ error: 'width_cm and length_cm must be positive numbers' });
    }

    const unitCheck = await pool.query('SELECT id FROM unit_types WHERE id = $1 AND user_id = $2', [
      unitTypeId,
      req.user.id,
    ]);
    if (unitCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Unit type not found' });
    }

    const result = await pool.query(
      'INSERT INTO rooms (user_id, unit_type_id, name, width_cm, length_cm, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, unitTypeId, name || null, width_cm, length_cm, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function createRoom(req, res, next) {
  try {
    const { jobId } = req.params;
    const { name, width_cm, length_cm, notes } = req.body;

    if (!width_cm || !length_cm) {
      return res.status(400).json({ error: 'width_cm and length_cm are required' });
    }
    if (width_cm <= 0 || length_cm <= 0) {
      return res.status(400).json({ error: 'width_cm and length_cm must be positive numbers' });
    }

    const result = await pool.query(
      'INSERT INTO rooms (user_id, job_id, name, width_cm, length_cm, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, jobId, name || null, width_cm, length_cm, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function getRoom(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM rooms WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function updateRoom(req, res, next) {
  try {
    const { id } = req.params;
    const { name, width_cm, length_cm, notes } = req.body;

    if (width_cm !== undefined && width_cm <= 0) {
      return res.status(400).json({ error: 'width_cm must be a positive number' });
    }
    if (length_cm !== undefined && length_cm <= 0) {
      return res.status(400).json({ error: 'length_cm must be a positive number' });
    }

    const result = await pool.query(
      `UPDATE rooms SET
         name = COALESCE($1, name),
         width_cm = COALESCE($2, width_cm),
         length_cm = COALESCE($3, length_cm),
         notes = COALESCE($4, notes)
       WHERE id = $5 AND user_id = $6 RETURNING *`,
      [name, width_cm, length_cm, notes, id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function deleteRoom(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM rooms WHERE id = $1 AND user_id = $2 RETURNING id', [
      id,
      req.user.id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getRoomsForJob,
  getRoomsForUnitType,
  createRoomForUnitType,
  createRoom,
  getRoom,
  updateRoom,
  deleteRoom,
};
