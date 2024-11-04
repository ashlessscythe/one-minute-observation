const dotenv = require("dotenv");
const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { body, query, validationResult } = require("express-validator");

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
console.log("PORT: " + port);

// Security Headers with CSP adjusted for Authorizer
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", process.env.REACT_APP_AUTHORIZER_URL],
      frameSrc: ["'self'", process.env.REACT_APP_AUTHORIZER_URL],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", process.env.REACT_APP_AUTHORIZER_URL],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});

// Apply rate limiting to all API routes
app.use("/api/", apiLimiter);

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'];
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin === process.env.REACT_APP_AUTHORIZER_URL) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-site', 'x-user-site-admin'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10kb' })); // Limit body payload size

// Request Logging Middleware
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url} from ${req.ip}`);
  next();
};

app.use(requestLogger);

// caching
app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

const prisma = new PrismaClient();

// Input Validation Middleware
const validateObservation = [
  body('date').isISO8601().withMessage('Invalid date format'),
  body('supervisorName').trim().isLength({ min: 1 }).escape().withMessage('Supervisor name is required'),
  body('shift').isInt({ min: 1, max: 3 }).withMessage('Shift must be between 1 and 3'),
  body('topic').trim().isLength({ min: 1 }).escape().withMessage('Topic is required'),
  // Make associateName conditional based on topic
  body('associateName').custom((value, { req }) => {
    if (req.body.topic !== 'Unsafe Condition' && (!value || value.trim().length === 0)) {
      throw new Error('Associate name is required for non-Unsafe Condition topics');
    }
    return true;
  }),
  body('actionAddressed').trim().isLength({ min: 1 }).escape().withMessage('Action addressed is required'),
  body('siteCode').optional().trim().isLength({ min: 1 }).escape()
];

const validateObservationQuery = [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  query('supervisorName').optional().trim().escape(),
  query('siteCode').optional().trim().escape()
];

async function main() {
  try {
    await prisma.$connect();
    console.log("Connected to the database.");

    setupRoutes();
    setupStaticServing();
    startServer();
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    process.exit(1);
  }
}

function setupRoutes() {
  // Middleware to get site from request headers
  const getSiteFromHeaders = (req, res, next) => {
    req.userSite = req.headers["x-user-site"];
    req.isAdmin = req.headers["x-user-site-admin"] === "true";
    next();
  };

  app.use(getSiteFromHeaders);

  // Middleware to check if site is required for a route
  const requireSite = (req, res, next) => {
    if (!req.userSite) {
      return res.status(403).json({ error: "User not associated with a site" });
    }
    next();
  };

  // Public routes (no site required)
  app.get("/api/public", (req, res) => {
    res.json({ message: "This is a public route" });
  });

  // GET route with filters for observations
  app.get("/api/observations", requireSite, validateObservationQuery, async (req, res) => {
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
  });

  // POST route for observations
  app.post("/api/observations", requireSite, validateObservation, async (req, res) => {
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
  });

  app.get("/api/sites", requireSite, async (req, res) => {
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
  });

  // GET route for users
  app.get("/api/users", requireSite, async (req, res) => {
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
  });
}

function setupStaticServing() {
  const buildPath = path.join(__dirname, "build");
  const distPath = path.join(__dirname, "dist");

  // Serve static files with security headers
  const staticOptions = {
    setHeaders: (res, path) => {
      res.set('X-Content-Type-Options', 'nosniff');
      res.set('X-Frame-Options', 'DENY');
      res.set('X-XSS-Protection', '1; mode=block');
    }
  };

  if (fs.existsSync(buildPath)) {
    console.log("Serving static files from:", buildPath);
    app.use(express.static(buildPath, staticOptions));
    serveIndex(buildPath);
  } else if (fs.existsSync(distPath)) {
    console.log("Serving static files from:", distPath);
    app.use(express.static(distPath, staticOptions));
    serveIndex(distPath);
  } else {
    console.log("No build or dist directory found. Running in API-only mode.");
    app.get("*", (req, res) => {
      res
        .status(404)
        .send(
          "Frontend not built. Please run npm run build or use npm run dev for development."
        );
    });
  }
}

function serveIndex(staticPath) {
  app.get("*", (req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
}

function startServer() {
  // Global error handling middleware
  app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Error:`, err);
    
    // Don't expose stack traces in production
    const error = process.env.NODE_ENV === 'production' ?
      'An internal server error occurred' :
      err.message;
    
    res.status(err.status || 500).json({ error });
  });

  app
    .listen(port, "0.0.0.0", () => {
      console.log(`Server running on port ${port}`);
    })
    .on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log(`Port ${port} is busy, trying ${port + 1}`);
        startServer(port + 1);
      } else {
        console.error(err);
      }
    });
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit();
});
