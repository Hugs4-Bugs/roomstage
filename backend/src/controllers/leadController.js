const pool = require('../config/db');

const VALID_STATUSES = ['new', 'contacted', 'viewing', 'won', 'lost'];

async function getLeadsForProject(req, res, next) {
  try {
    const { projectId } = req.params;
    const { status } = req.query;
    let query = 'SELECT * FROM leads WHERE project_id = $1 AND user_id = $2';
    const params = [projectId, req.user.id];
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

async function createLead(req, res, next) {
  try {
    const { projectId } = req.params;
    const { unit_type_id, name, phone, email, source, notes } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const result = await pool.query(
      `INSERT INTO leads (user_id, project_id, unit_type_id, name, phone, email, source, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.id, projectId, unit_type_id || null, name, phone || null, email || null, source || null, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function updateLead(req, res, next) {
  try {
    const { id } = req.params;
    const { name, phone, email, source, status, notes } = req.body;
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${VALID_STATUSES.join(', ')}` });
    }

    const result = await pool.query(
      `UPDATE leads SET
         name = COALESCE($1, name),
         phone = COALESCE($2, phone),
         email = COALESCE($3, email),
         source = COALESCE($4, source),
         status = COALESCE($5, status),
         notes = COALESCE($6, notes)
       WHERE id = $7 AND user_id = $8 RETURNING *`,
      [name, phone, email, source, status, notes, id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function deleteLead(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM leads WHERE id = $1 AND user_id = $2 RETURNING id', [
      id,
      req.user.id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// "Convert lead -> job with one action" -- brief section 6.1. Carries the
// lead's project/unit_type over onto the new job, then marks the lead won.
async function convertLeadToJob(req, res, next) {
  try {
    const { id } = req.params;
    const { client_id, title, price } = req.body;

    const leadResult = await pool.query('SELECT * FROM leads WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    if (!client_id || !title) {
      return res.status(400).json({ error: 'client_id and title are required to convert a lead to a job' });
    }

    const clientCheck = await pool.query('SELECT id FROM clients WHERE id = $1 AND user_id = $2', [
      client_id,
      req.user.id,
    ]);
    if (clientCheck.rows.length === 0) {
      return res.status(400).json({ error: 'client_id does not belong to you' });
    }

    const lead = leadResult.rows[0];
    const jobResult = await pool.query(
      `INSERT INTO jobs (user_id, client_id, title, price, project_id, unit_type_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, client_id, title, price || null, lead.project_id, lead.unit_type_id]
    );

    await pool.query('UPDATE leads SET status = $1 WHERE id = $2 AND user_id = $3', ['won', id, req.user.id]);

    res.status(201).json(jobResult.rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { getLeadsForProject, createLead, updateLead, deleteLead, convertLeadToJob };
