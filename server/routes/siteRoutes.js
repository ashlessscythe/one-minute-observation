const express = require('express');
const router = express.Router();
const { requireSite } = require('../middleware/auth');
const { getSites } = require('../controllers/siteController');

// GET route for sites
router.get('/', 
  requireSite, 
  getSites
);

module.exports = router;
