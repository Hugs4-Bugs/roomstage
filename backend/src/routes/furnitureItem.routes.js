const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { getFurnitureItems, createFurnitureItem } = require('../controllers/furnitureItemController');

router.use(authenticate);

router.get('/furniture-items', getFurnitureItems);
router.post('/furniture-items', createFurnitureItem);

module.exports = router;
