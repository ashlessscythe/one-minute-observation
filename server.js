require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const app = express();
const port = process.env.PORT || 3001;
console.log("PORT: " + port);

app.use(cors());
app.use(express.json());

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
  // GET route with filters for observations
  app.get("/api/observations", async (req, res) => {
    const { supervisorName, startDate, endDate } = req.query;
    try {
      const observations = await prisma.observation.findMany({
        where: {
          supervisorName: supervisorName
            ? { contains: supervisorName, mode: "insensitive" }
            : undefined,
          date: {
            gte: startDate ? new Date(startDate) : undefined,
            lte: endDate ? new Date(endDate) : undefined,
          },
        },
        orderBy: {
          date: "desc",
        },
      });
      res.json(observations);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // POST route for observations
  app.post("/api/observations", async (req, res) => {
    const {
      date,
      supervisorName,
      shift,
      associateName,
      topic,
      actionAddressed,
    } = req.body;
    try {
      const newObservation = await prisma.observation.create({
        data: {
          date: new Date(date),
          supervisorName,
          shift: parseInt(shift, 10), // ensure int
          associateName,
          topic,
          actionAddressed,
        },
      });
      res.json(newObservation);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // GET route for users
  app.get("/api/users", async (req, res) => {
    const { isSupervisor } = req.query;
    try {
      const users = await prisma.user.findMany({
        where: {
          isSupervisor:
            isSupervisor === "true"
              ? true
              : isSupervisor === "false"
              ? false
              : undefined,
        },
        orderBy: {
          name: "asc",
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
