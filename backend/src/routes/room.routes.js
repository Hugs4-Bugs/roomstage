const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {
  getRoomsForJob,
  getRoomsForUnitType,
  createRoomForUnitType,
  createRoom,
  getRoom,
  updateRoom,
  deleteRoom,
} = require('../controllers/roomController');

router.use(authenticate);

router.get('/jobs/:jobId/rooms', getRoomsForJob);
router.post('/jobs/:jobId/rooms', createRoom);

router.get('/unit-types/:unitTypeId/rooms', getRoomsForUnitType);
router.post('/unit-types/:unitTypeId/rooms', createRoomForUnitType);

router.get('/rooms/:id', getRoom);
router.put('/rooms/:id', updateRoom);
router.delete('/rooms/:id', deleteRoom);

module.exports = router;
