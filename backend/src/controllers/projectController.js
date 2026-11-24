const pool = require('../config/db');

const VALID_TYPES = ['residential', 'commercial', 'mixed'];

async function getProjects(req, res, next) {
  try {
    const result = await pool.query('SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC', [
      req.user.id,
    ]);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

async function getProject(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM projects WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const unitTypes = await pool.query(
      'SELECT id, name, category, status, price_kes FROM unit_types WHERE project_id = $1 AND user_id = $2 ORDER BY created_at',
      [id, req.user.id]
    );
    const leads = await pool.query(
      'SELECT id, name, phone, email, status, source, created_at FROM leads WHERE project_id = $1 AND user_id = $2 ORDER BY created_at DESC',
      [id, req.user.id]
    );
    const jobs = await pool.query(
      'SELECT id, title, status, price, payment_status FROM jobs WHERE project_id = $1 AND user_id = $2 ORDER BY created_at DESC',
      [id, req.user.id]
    );

    res.json({ ...result.rows[0], unitTypes: unitTypes.rows, leads: leads.rows, jobs: jobs.rows });
  } catch (err) {
    next(err);
  }
}

async function createProject(req, res, next) {
  try {
    const { name, location, project_type, notes, contact_phone, contact_email } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (project_type && !VALID_TYPES.includes(project_type)) {
      return res.status(400).json({ error: `project_type must be one of ${VALID_TYPES.join(', ')}` });
    }

    const result = await pool.query(
      `INSERT INTO projects (user_id, name, location, project_type, notes, contact_phone, contact_email)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        req.user.id,
        name,
        location || null,
        project_type || 'residential',
        notes || null,
        contact_phone || null,
        contact_email || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function updateProject(req, res, next) {
  try {
    const { id } = req.params;
    const { name, location, project_type, notes, contact_phone, contact_email } = req.body;

    if (project_type && !VALID_TYPES.includes(project_type)) {
      return res.status(400).json({ error: `project_type must be one of ${VALID_TYPES.join(', ')}` });
    }

    const result = await pool.query(
      `UPDATE projects SET
         name = COALESCE($1, name),
         location = COALESCE($2, location),
         project_type = COALESCE($3, project_type),
         notes = COALESCE($4, notes),
         contact_phone = COALESCE($5, contact_phone),
         contact_email = COALESCE($6, contact_email)
       WHERE id = $7 AND user_id = $8 RETURNING *`,
      [name, location, project_type, notes, contact_phone, contact_email, id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function deleteProject(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id', [
      id,
      req.user.id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject };
