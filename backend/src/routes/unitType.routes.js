const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {
  getUnitTypesForProject,
  createUnitType,
  getUnitType,
  updateUnitType,
  deleteUnitType,
} = require('../controllers/unitTypeController');

router.use(authenticate);

router.get('/projects/:projectId/unit-types', getUnitTypesForProject);
router.post('/projects/:projectId/unit-types', createUnitType);
router.get('/unit-types/:id', getUnitType);
router.put('/unit-types/:id', updateUnitType);
router.delete('/unit-types/:id', deleteUnitType);

module.exports = router;
