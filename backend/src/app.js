const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const clientRoutes = require('./routes/client.routes');
const jobRoutes = require('./routes/job.routes');
const photoRoutes = require('./routes/photo.routes');
const roomRoutes = require('./routes/room.routes');
const furnitureItemRoutes = require('./routes/furnitureItem.routes');
const roomFurnitureRoutes = require('./routes/roomFurniture.routes');
const projectRoutes = require('./routes/project.routes');
const leadRoutes = require('./routes/lead.routes');
const unitTypeRoutes = require('./routes/unitType.routes');
const publicRoutes = require('./routes/public.routes');
const sampleDataRoutes = require('./routes/sampleData.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mounted first and deliberately: this is the only unauthenticated part of
// /api. Every router below this uses `router.use(authenticate)` internally,
// which runs for ANY request reaching that router regardless of whether a
// specific route matches -- so a public route mounted AFTER them would get
// rejected by the first one's auth check before ever reaching its own
// handler. Registering this first means /api/public/* never enters them.
app.use('/api/public', publicRoutes); // /api/public/unit-types/:slug -- no auth

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api', photoRoutes); // /api/jobs/:jobId/photos, /api/photos/:id
app.use('/api', roomRoutes); // /api/jobs/:jobId/rooms, /api/rooms/:id
app.use('/api', furnitureItemRoutes); // /api/furniture-items
app.use('/api', roomFurnitureRoutes); // /api/rooms/:roomId/furniture, /api/room-furniture/:id
app.use('/api/projects', projectRoutes);
app.use('/api', leadRoutes); // /api/projects/:projectId/leads, /api/leads/:id, /api/leads/:id/convert
app.use('/api', unitTypeRoutes); // /api/projects/:projectId/unit-types, /api/unit-types/:id
app.use('/api', sampleDataRoutes); // /api/sample-data/seed
app.use('/api', dashboardRoutes); // /api/dashboard

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;
