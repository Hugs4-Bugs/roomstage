const pool = require('../config/db');

const STARTER_CATALOG = [
  { name: 'Sofa', width_cm: 180, depth_cm: 85, category: 'seating' },
  { name: 'Bed', width_cm: 100, depth_cm: 200, category: 'bed' },
  { name: 'Nightstand', width_cm: 45, depth_cm: 40, category: 'storage' },
  { name: 'Dining table', width_cm: 150, depth_cm: 90, category: 'table' },
  { name: 'Dining chair', width_cm: 45, depth_cm: 50, category: 'seating' },
  { name: 'Rug', width_cm: 200, depth_cm: 140, category: 'decor' },
  { name: 'Plant', width_cm: 40, depth_cm: 40, category: 'decor' },
  { name: 'Floor lamp', width_cm: 35, depth_cm: 35, category: 'lighting' },
  { name: 'TV stand', width_cm: 120, depth_cm: 40, category: 'storage' },
  { name: 'Bookshelf', width_cm: 80, depth_cm: 30, category: 'storage' },
  { name: 'Desk', width_cm: 120, depth_cm: 60, category: 'table' },
  { name: 'Coffee table', width_cm: 100, depth_cm: 50, category: 'table' },
  { name: 'Workstation desk', width_cm: 140, depth_cm: 70, category: 'office' },
  { name: 'Boardroom table', width_cm: 300, depth_cm: 120, category: 'office' },
  { name: 'Reception desk', width_cm: 180, depth_cm: 70, category: 'office' },
  { name: 'Meeting chair', width_cm: 45, depth_cm: 45, category: 'office' },
  { name: 'Filing cabinet', width_cm: 45, depth_cm: 60, category: 'office' },
];

async function seedStarterCatalog(userId) {
  for (const item of STARTER_CATALOG) {
    await pool.query(
      'INSERT INTO furniture_items (user_id, name, width_cm, depth_cm, category) VALUES ($1, $2, $3, $4, $5)',
      [userId, item.name, item.width_cm, item.depth_cm, item.category]
    );
  }
}

async function getFurnitureItems(req, res, next) {
  try {
    let result = await pool.query('SELECT * FROM furniture_items WHERE user_id = $1 ORDER BY category, name', [
      req.user.id,
    ]);
    if (result.rows.length === 0) {
      await seedStarterCatalog(req.user.id);
      result = await pool.query('SELECT * FROM furniture_items WHERE user_id = $1 ORDER BY category, name', [
        req.user.id,
      ]);
    }
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

async function createFurnitureItem(req, res, next) {
  try {
    const { name, width_cm, depth_cm, category } = req.body;

    if (!name || !width_cm || !depth_cm) {
      return res.status(400).json({ error: 'name, width_cm, and depth_cm are required' });
    }
    if (width_cm <= 0 || depth_cm <= 0) {
      return res.status(400).json({ error: 'width_cm and depth_cm must be positive numbers' });
    }

    const result = await pool.query(
      'INSERT INTO furniture_items (user_id, name, width_cm, depth_cm, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, name, width_cm, depth_cm, category || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { getFurnitureItems, createFurnitureItem, seedStarterCatalog };
