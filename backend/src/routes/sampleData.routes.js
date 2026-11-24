const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { seedSampleData } = require('../controllers/sampleDataController');

router.use(authenticate);
router.post('/sample-data/seed', seedSampleData);

module.exports = router;
