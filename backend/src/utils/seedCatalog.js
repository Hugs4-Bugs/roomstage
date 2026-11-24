const pool = require('../config/db');

const PRESETS = [
  ['Sofa', 180, 85, 'seating'],
  ['Bed', 100, 200, 'sleep'],
  ['Nightstand', 45, 40, 'storage'],
  ['Dining table', 150, 90, 'table'],
  ['Dining chair', 45, 50, 'seating'],
  ['Rug', 200, 140, 'decor'],
  ['Plant', 40, 40, 'decor'],
  ['Floor lamp', 35, 35, 'lighting'],
  ['TV stand', 120, 40, 'storage'],
  ['Bookshelf', 80, 30, 'storage'],
  ['Desk', 120, 60, 'table'],
  ['Coffee table', 100, 50, 'table'],
  ['Workstation', 140, 70, 'office'],
  ['Boardroom table', 240, 120, 'office'],
  ['Reception desk', 180, 60, 'office'],
  ['Meeting chair', 55, 55, 'office'],
  ['Filing cabinet', 45, 60, 'office'],
  ['Office plant', 40, 40, 'office'],
  ['Lounge sofa', 180, 85, 'office'],
];

async function seedFurnitureCatalog(userId) {
  const existing = await pool.query(
    'SELECT id FROM furniture_items WHERE user_id = $1 LIMIT 1',
    [userId]
  );
  if (existing.rows.length > 0) return;

  for (const [name, width_cm, depth_cm, category] of PRESETS) {
    await pool.query(
      'INSERT INTO furniture_items (user_id, name, width_cm, depth_cm, category) VALUES ($1, $2, $3, $4, $5)',
      [userId, name, width_cm, depth_cm, category]
    );
  }
}

module.exports = { seedFurnitureCatalog, PRESETS };
