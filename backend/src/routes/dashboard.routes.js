const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { getDashboard } = require('../controllers/dashboardController');

router.use(authenticate);
router.get('/dashboard', getDashboard);

module.exports = router;
