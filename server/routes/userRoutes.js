const express = require('express');
const router = express.Router();
const { requireSite } = require('../middleware/auth');
const { getUsers } = require('../controllers/userController');

// GET route for users with filters
router.get('/', 
  requireSite, 
  getUsers
);

module.exports = router;
