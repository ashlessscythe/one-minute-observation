const express = require('express');
const router = express.Router();
const { requireSite } = require('../middleware/auth');
const { getObservations, createObservation } = require('../controllers/observationController');
const { observationValidation } = require('../utils/validationSchemas');

// GET route with filters for observations
router.get('/', 
  requireSite, 
  observationValidation.query, 
  getObservations
);

// POST route for observations
router.post('/', 
  requireSite, 
  observationValidation.create, 
  createObservation
);

module.exports = router;
