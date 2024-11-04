const prisma = require('../config/database');

// Get users with filters
const getUsers = async (req, res) => {
  const { isSupervisor } = req.query;
  try {
    const where = {
      isSupervisor:
        isSupervisor === "true"
          ? true
          : isSupervisor === "false"
          ? false
          : undefined,
    };

    if (req.isAdmin) {
      if (req.userSite) {
        where.site = { code: req.userSite };
      }
    } else {
      where.site = { code: req.userSite };
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: [
        { name: "asc" },
        { site: { code: "asc" } },
      ],
      include: {
        site: {
          select: {
            code: true,
            users: true,
          },
        },
      },
    });
    res.json(users);
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
  getUsers
};
