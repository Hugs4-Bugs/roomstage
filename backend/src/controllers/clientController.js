const pool = require('../config/db');

async function getClients(req, res, next) {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM clients WHERE user_id = $1';
    const params = [req.user.id];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR phone ILIKE $${params.length} OR location ILIKE $${params.length})`;
    }
    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

async function getClient(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM clients WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const jobs = await pool.query(
      'SELECT id, title, status, price, payment_status, created_at FROM jobs WHERE client_id = $1 AND user_id = $2 ORDER BY created_at DESC',
      [id, req.user.id]
    );

    res.json({ ...result.rows[0], jobs: jobs.rows });
  } catch (err) {
    next(err);
  }
}

async function createClient(req, res, next) {
  try {
    const { name, phone, email, location } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const result = await pool.query(
      'INSERT INTO clients (user_id, name, phone, email, location) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, name, phone || null, email || null, location || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function updateClient(req, res, next) {
  try {
    const { id } = req.params;
    const { name, phone, email, location } = req.body;

    const result = await pool.query(
      `UPDATE clients SET
         name = COALESCE($1, name),
         phone = COALESCE($2, phone),
         email = COALESCE($3, email),
         location = COALESCE($4, location)
       WHERE id = $5 AND user_id = $6 RETURNING *`,
      [name, phone, email, location, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function deleteClient(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM clients WHERE id = $1 AND user_id = $2 RETURNING id', [
      id,
      req.user.id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getClients, getClient, createClient, updateClient, deleteClient };
