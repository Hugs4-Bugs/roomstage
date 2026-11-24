const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {
  getFurnitureForRoom,
  placeFurniture,
  updatePlacedFurniture,
  removePlacedFurniture,
} = require('../controllers/roomFurnitureController');

router.use(authenticate);

router.get('/rooms/:roomId/furniture', getFurnitureForRoom);
router.post('/rooms/:roomId/furniture', placeFurniture);

router.put('/room-furniture/:id', updatePlacedFurniture);
router.delete('/room-furniture/:id', removePlacedFurniture);

module.exports = router;
