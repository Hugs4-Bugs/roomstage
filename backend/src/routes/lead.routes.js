const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {
  getLeadsForProject,
  createLead,
  updateLead,
  deleteLead,
  convertLeadToJob,
} = require('../controllers/leadController');

router.use(authenticate);

router.get('/projects/:projectId/leads', getLeadsForProject);
router.post('/projects/:projectId/leads', createLead);
router.put('/leads/:id', updateLead);
router.delete('/leads/:id', deleteLead);
router.post('/leads/:id/convert', convertLeadToJob);

module.exports = router;
