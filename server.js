const dotenv = require("dotenv");
const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
console.log("PORT: " + port);

app.use(cors());
app.use(express.json());

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
  app.get("/api/observations", requireSite, async (req, res) => {
    const { supervisorName, startDate, endDate, siteCode } = req.query;
    try {
      // Build where clause based on filters
      const where = {
        ...(supervisorName && { supervisorName: supervisorName }), // Exact match for supervisor name
        date: {
          gte: startDate ? new Date(startDate + "T00:00:00Z") : undefined,
          lte: endDate ? new Date(endDate + "T23:59:59.999Z") : undefined,
        },
      };

      // For admin users, only filter by site if siteCode is provided in query
      // For regular users, always filter by their assigned site
      if (req.isAdmin) {
        if (siteCode) {
          where.site = { code: siteCode };
        }
      } else {
        where.site = { code: req.userSite };
      }

      // console.log("Query where clause:", where); // Debug log

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
      res.status(500).json({ error: err.message });
    }
  });

  // POST route for observations
  app.post("/api/observations", requireSite, async (req, res) => {
    const {
      date,
      supervisorName,
      shift,
      associateName,
      topic,
      actionAddressed,
      siteCode, // Added for admin users to specify site
    } = req.body;
    try {
      const utcDate = new Date(date + "T00:00:00Z");

      // For admin users, use the specified site code, otherwise use their assigned site
      const targetSiteCode = req.isAdmin ? siteCode : req.userSite;

      // Verify the site exists
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
          associateName,
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
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/sites", requireSite, async (req, res) => {
    try {
      if (req.isAdmin) {
        // Admin can see all sites
        const sites = await prisma.site.findMany({
          orderBy: {
            code: "asc",
          },
        });
        res.json(sites);
      } else {
        // Regular users can only see their assigned site
        const site = await prisma.site.findUnique({
          where: {
            code: req.userSite,
          },
        });
        res.json(site ? [site] : []);
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // GET route for users
  app.get("/api/users", requireSite, async (req, res) => {
    const { isSupervisor } = req.query;
    try {
      // Build where clause based on filters
      const where = {
        isSupervisor:
          isSupervisor === "true"
            ? true
            : isSupervisor === "false"
            ? false
            : undefined,
      };

      // For admin users, only filter by site if userSite is provided
      // For regular users, always filter by their assigned site
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
          { site: { code: "asc" } }, // Secondary sort by site code
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
      res.status(500).json({ error: err.message });
    }
  });
}

function setupStaticServing() {
  const buildPath = path.join(__dirname, "build");
  const distPath = path.join(__dirname, "dist");

  if (fs.existsSync(buildPath)) {
    console.log("Serving static files from:", buildPath);
    app.use(express.static(buildPath));
    serveIndex(buildPath);
  } else if (fs.existsSync(distPath)) {
    console.log("Serving static files from:", distPath);
    app.use(express.static(distPath));
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
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
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
