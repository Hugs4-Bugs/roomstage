const pool = require('../config/db');
const { seedStarterCatalog } = require('./furnitureItemController');

// Realistic Nairobi-flavoured demo data, matching the brief's own examples
// (Westlands client, Karen villa job, Ngong Road office unit type with a
// layout). Guarded against reseeding onto an account that already has data,
// so an accidental double-click doesn't duplicate everything.
async function seedSampleData(req, res, next) {
  try {
    const userId = req.user.id;

    const existing = await pool.query('SELECT id FROM clients WHERE user_id = $1 LIMIT 1', [userId]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Sample data is only available on an empty account.' });
    }

    let catalog = await pool.query('SELECT id, name FROM furniture_items WHERE user_id = $1', [userId]);
    if (catalog.rows.length === 0) {
      await seedStarterCatalog(userId);
      catalog = await pool.query('SELECT id, name FROM furniture_items WHERE user_id = $1', [userId]);
    }
    const findItem = (name) => catalog.rows.find((i) => i.name === name)?.id;

    const client = await pool.query(
      `INSERT INTO clients (user_id, name, phone, location) VALUES ($1, $2, $3, $4) RETURNING id`,
      [userId, 'Amina Otieno', '0722556781', 'Westlands, Nairobi']
    );
    const clientId = client.rows[0].id;

    const villaProject = await pool.query(
      `INSERT INTO projects (user_id, name, location, project_type, contact_phone, contact_email)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [userId, 'Karen Grove Villas', 'Karen, Nairobi', 'residential', '0733112233', 'sales@karengrove.co.ke']
    );
    const villaProjectId = villaProject.rows[0].id;

    const villaUnit = await pool.query(
      `INSERT INTO unit_types
         (user_id, project_id, name, category, bedrooms, size_sqm, price_kes, status, public_slug)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, public_slug`,
      [userId, villaProjectId, '3-bed Villa', 'residential', 3, 280, 45000000, 'available', 'karen-villa-sample']
    );
    const villaUnitId = villaUnit.rows[0].id;

    const villaRoom = await pool.query(
      `INSERT INTO rooms (user_id, unit_type_id, name, width_cm, length_cm)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, villaUnitId, 'Living room', 600, 450]
    );
    const villaRoomId = villaRoom.rows[0].id;

    const villaPlacements = [
      ['Sofa', 150, 100, 0],
      ['Coffee table', 150, 220, 0],
      ['Rug', 150, 200, 0],
      ['TV stand', 150, 400, 0],
    ];
    for (const [name, x, y, rot] of villaPlacements) {
      const itemId = findItem(name);
      if (itemId) {
        await pool.query(
          'INSERT INTO room_furniture (user_id, room_id, furniture_item_id, x_position, y_position, rotation) VALUES ($1, $2, $3, $4, $5, $6)',
          [userId, villaRoomId, itemId, x, y, rot]
        );
      }
    }

    await pool.query(
      'INSERT INTO photos (user_id, unit_type_id, url, kind, caption) VALUES ($1, $2, $3, $4, $5)',
      [
        userId,
        villaUnitId,
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
        'listing',
        'Living room, staged',
      ]
    );

    await pool.query(
      `INSERT INTO jobs (user_id, client_id, project_id, unit_type_id, title, status, price, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, clientId, villaProjectId, villaUnitId, 'Karen villa staging', 'in_progress', 25000, 'deposit_paid']
    );

    await pool.query(
      `INSERT INTO leads (user_id, project_id, unit_type_id, name, phone, source, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, villaProjectId, villaUnitId, 'Otieno family inquiry', '0711998877', 'Property24', 'new']
    );

    const officeProject = await pool.query(
      `INSERT INTO projects (user_id, name, location, project_type, contact_phone, contact_email)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [userId, 'Adams Arcade Offices', 'Ngong Road, Nairobi', 'commercial', '0700223344', 'letting@adamsarcade.co.ke']
    );
    const officeProjectId = officeProject.rows[0].id;

    const officeUnit = await pool.query(
      `INSERT INTO unit_types
         (user_id, project_id, name, category, size_sqft, price_kes, status, public_slug)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [userId, officeProjectId, 'Office Suite 12', 'office', 1200, 180000, 'available', 'office-suite-12-sample']
    );
    const officeUnitId = officeUnit.rows[0].id;

    const officeRoom = await pool.query(
      `INSERT INTO rooms (user_id, unit_type_id, name, width_cm, length_cm)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, officeUnitId, 'Open floor', 800, 600]
    );
    const officeRoomId = officeRoom.rows[0].id;

    const officePlacements = [
      ['Workstation desk', 100, 100, 0],
      ['Workstation desk', 300, 100, 0],
      ['Boardroom table', 500, 300, 0],
      ['Meeting chair', 500, 150, 0],
    ];
    for (const [name, x, y, rot] of officePlacements) {
      const itemId = findItem(name);
      if (itemId) {
        await pool.query(
          'INSERT INTO room_furniture (user_id, room_id, furniture_item_id, x_position, y_position, rotation) VALUES ($1, $2, $3, $4, $5, $6)',
          [userId, officeRoomId, itemId, x, y, rot]
        );
      }
    }

    res.status(201).json({ seeded: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { seedSampleData };
