const express = require('express');
const router = express.Router();
const { getPublicUnitType } = require('../controllers/publicController');

// No authenticate middleware anywhere in this router -- intentional.
router.get('/unit-types/:slug', getPublicUnitType);

module.exports = router;
