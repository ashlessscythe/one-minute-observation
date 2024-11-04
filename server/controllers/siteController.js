const prisma = require('../config/database');

// Get sites based on user permissions
const getSites = async (req, res) => {
  try {
    if (req.isAdmin) {
      const sites = await prisma.site.findMany({
        orderBy: {
          code: "asc",
        },
      });
      res.json(sites);
    } else {
      const site = await prisma.site.findUnique({
        where: {
          code: req.userSite,
        },
      });
      res.json(site ? [site] : []);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'production' ? 
        'An internal server error occurred' : 
        err.message 
    });
  }
};

module.exports = {
  getSites
};
