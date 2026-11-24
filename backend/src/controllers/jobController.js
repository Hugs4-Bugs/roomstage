const pool = require('../config/db');

async function getJobs(req, res, next) {
  try {
    const { client_id, status } = req.query;
    let query = `
      SELECT jobs.*, clients.name AS client_name
      FROM jobs
      JOIN clients ON jobs.client_id = clients.id
      WHERE jobs.user_id = $1`;
    const params = [req.user.id];

    if (client_id) {
      params.push(client_id);
      query += ` AND jobs.client_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND jobs.status = $${params.length}`;
    }
    query += ' ORDER BY jobs.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

async function getJob(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT jobs.*, clients.name AS client_name, clients.phone AS client_phone
       FROM jobs
       JOIN clients ON jobs.client_id = clients.id
       WHERE jobs.id = $1 AND jobs.user_id = $2`,
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const photos = await pool.query(
      'SELECT id, url, kind, caption, uploaded_at FROM photos WHERE job_id = $1 AND user_id = $2 ORDER BY uploaded_at',
      [id, req.user.id]
    );
    const rooms = await pool.query(
      'SELECT id, name, width_cm, length_cm, notes FROM rooms WHERE job_id = $1 AND user_id = $2',
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

async function createJob(req, res, next) {
  try {
    const { client_id, title, price, notes, project_id, unit_type_id, scheduled_on } = req.body;
    if (!client_id || !title) {
      return res.status(400).json({ error: 'client_id and title are required' });
    }

    if (project_id) {
      const projectCheck = await pool.query('SELECT id FROM projects WHERE id = $1 AND user_id = $2', [
        project_id,
        req.user.id,
      ]);
      if (projectCheck.rows.length === 0) {
        return res.status(400).json({ error: 'project_id does not belong to you' });
      }
    }

    const result = await pool.query(
      `INSERT INTO jobs (user_id, client_id, title, price, notes, project_id, unit_type_id, scheduled_on)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        req.user.id,
        client_id,
        title,
        price || null,
        notes || null,
        project_id || null,
        unit_type_id || null,
        scheduled_on || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function updateJob(req, res, next) {
  try {
    const { id } = req.params;
    const { title, status, price, payment_status, notes, scheduled_on } = req.body;

    const result = await pool.query(
      `UPDATE jobs SET
         title = COALESCE($1, title),
         status = COALESCE($2, status),
         price = COALESCE($3, price),
         payment_status = COALESCE($4, payment_status),
         notes = COALESCE($5, notes),
         scheduled_on = COALESCE($6, scheduled_on),
         completed_at = CASE WHEN $2 = 'completed' AND completed_at IS NULL THEN NOW() ELSE completed_at END
       WHERE id = $7 AND user_id = $8 RETURNING *`,
      [title, status, price, payment_status, notes, scheduled_on, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function deleteJob(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM jobs WHERE id = $1 AND user_id = $2 RETURNING id', [
      id,
      req.user.id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getJobs, getJob, createJob, updateJob, deleteJob };
