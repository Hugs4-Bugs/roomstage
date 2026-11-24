const pool = require('../config/db');

async function getDashboard(req, res, next) {
  try {
    const userId = req.user.id;

    const jobStats = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status != 'completed') AS active_jobs,
         COUNT(*) FILTER (WHERE status = 'completed') AS completed_jobs,
         COALESCE(SUM(price) FILTER (WHERE payment_status != 'paid'), 0) AS owed_kes
       FROM jobs WHERE user_id = $1`,
      [userId]
    );
    const leadStats = await pool.query(
      `SELECT COUNT(*) AS open_leads FROM leads WHERE user_id = $1 AND status NOT IN ('won', 'lost')`,
      [userId]
    );
    const unitStats = await pool.query(
      `SELECT COUNT(*) AS available_unit_types FROM unit_types WHERE user_id = $1 AND status = 'available'`,
      [userId]
    );

    const recentJobs = await pool.query(
      `SELECT jobs.id, jobs.title, jobs.status, jobs.price, clients.name AS client_name
       FROM jobs JOIN clients ON jobs.client_id = clients.id
       WHERE jobs.user_id = $1 ORDER BY jobs.created_at DESC LIMIT 5`,
      [userId]
    );
    const recentLeads = await pool.query(
      `SELECT leads.id, leads.name, leads.status, projects.name AS project_name
       FROM leads JOIN projects ON leads.project_id = projects.id
       WHERE leads.user_id = $1 ORDER BY leads.created_at DESC LIMIT 5`,
      [userId]
    );

    res.json({
      stats: {
        activeJobs: Number(jobStats.rows[0].active_jobs),
        completedJobs: Number(jobStats.rows[0].completed_jobs),
        owedKes: Number(jobStats.rows[0].owed_kes),
        openLeads: Number(leadStats.rows[0].open_leads),
        availableUnitTypes: Number(unitStats.rows[0].available_unit_types),
      },
      recentJobs: recentJobs.rows,
      recentLeads: recentLeads.rows,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard };
