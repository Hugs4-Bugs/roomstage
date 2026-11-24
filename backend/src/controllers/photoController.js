const pool = require('../config/db');

const VALID_KINDS = ['before', 'after', 'listing', 'plan'];

async function getPhotosForJob(req, res, next) {
  try {
    const { jobId } = req.params;
    const result = await pool.query(
      'SELECT * FROM photos WHERE job_id = $1 AND user_id = $2 ORDER BY uploaded_at',
      [jobId, req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

async function getPhotosForUnitType(req, res, next) {
  try {
    const { unitTypeId } = req.params;
    const result = await pool.query(
      'SELECT * FROM photos WHERE unit_type_id = $1 AND user_id = $2 ORDER BY uploaded_at',
      [unitTypeId, req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

async function addPhotoForUnitType(req, res, next) {
  try {
    const { unitTypeId } = req.params;
    const { url, kind, caption } = req.body;

    if (!url || !VALID_KINDS.includes(kind)) {
      return res.status(400).json({ error: `url is required and kind must be one of ${VALID_KINDS.join(', ')}` });
    }

    const unitCheck = await pool.query('SELECT id FROM unit_types WHERE id = $1 AND user_id = $2', [
      unitTypeId,
      req.user.id,
    ]);
    if (unitCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Unit type not found' });
    }

    const result = await pool.query(
      'INSERT INTO photos (user_id, unit_type_id, url, kind, caption) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, unitTypeId, url, kind, caption || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function addPhoto(req, res, next) {
  try {
    const { jobId } = req.params;
    const { url, kind, caption } = req.body;

    if (!url || !VALID_KINDS.includes(kind)) {
      return res.status(400).json({ error: `url is required and kind must be one of ${VALID_KINDS.join(', ')}` });
    }

    const result = await pool.query(
      'INSERT INTO photos (user_id, job_id, url, kind, caption) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, jobId, url, kind, caption || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function deletePhoto(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM photos WHERE id = $1 AND user_id = $2 RETURNING id', [
      id,
      req.user.id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getPhotosForJob, getPhotosForUnitType, addPhoto, addPhotoForUnitType, deletePhoto };
