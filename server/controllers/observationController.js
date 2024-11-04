const prisma = require('../config/database');
const { validationResult } = require('express-validator');

// Get observations with filters
const getObservations = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { supervisorName, startDate, endDate, siteCode } = req.query;
  try {
    const where = {
      ...(supervisorName && { supervisorName: supervisorName }),
      date: {
        gte: startDate ? new Date(startDate + "T00:00:00Z") : undefined,
        lte: endDate ? new Date(endDate + "T23:59:59.999Z") : undefined,
      },
    };

    if (req.isAdmin) {
      if (siteCode) {
        where.site = { code: siteCode };
      }
    } else {
      where.site = { code: req.userSite };
    }

    const observations = await prisma.observation.findMany({
      where,
      orderBy: [{ date: "desc" }, { site: { code: "asc" } }],
      include: {
        site: {
          select: {
            code: true,
          },
        },
      },
    });
    res.json(observations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'production' ? 
        'An internal server error occurred' : 
        err.message 
    });
  }
};

// Create new observation
const createObservation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    date,
    supervisorName,
    shift,
    associateName,
    topic,
    actionAddressed,
    siteCode,
  } = req.body;
  
  try {
    const utcDate = new Date(date + "T00:00:00Z");
    const targetSiteCode = req.isAdmin ? siteCode : req.userSite;

    const site = await prisma.site.findUnique({
      where: { code: targetSiteCode },
    });

    if (!site) {
      return res.status(400).json({ error: "Invalid site code" });
    }

    const newObservation = await prisma.observation.create({
      data: {
        date: utcDate,
        supervisorName,
        shift: parseInt(shift, 10),
        associateName: topic === 'Unsafe Condition' && !associateName ? 'N/A' : associateName,
        topic,
        actionAddressed,
        site: { connect: { code: targetSiteCode } },
      },
      include: {
        site: {
          select: {
            code: true,
          },
        },
      },
    });
    res.json(newObservation);
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
  getObservations,
  createObservation
};
