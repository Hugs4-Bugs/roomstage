function errorHandler(err, req, res, next) {
  console.error(err.stack);

  // Postgres unique violation
  if (err.code === '23505') {
    return res.status(409).json({ error: 'That record already exists' });
  }
  // Postgres foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced record does not exist' });
  }

  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
}

module.exports = errorHandler;
