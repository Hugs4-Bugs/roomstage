const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {
  getPhotosForJob,
  getPhotosForUnitType,
  addPhoto,
  addPhotoForUnitType,
  deletePhoto,
} = require('../controllers/photoController');

router.use(authenticate);
router.get('/jobs/:jobId/photos', getPhotosForJob);
router.post('/jobs/:jobId/photos', addPhoto);

router.get('/unit-types/:unitTypeId/photos', getPhotosForUnitType);
router.post('/unit-types/:unitTypeId/photos', addPhotoForUnitType);

router.delete('/photos/:id', deletePhoto);

module.exports = router;
