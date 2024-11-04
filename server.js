const dotenv = require("dotenv");
const express = require("express");
const cookieParser = require("cookie-parser");
const prisma = require("./server/config/database");
const {
  configureHelmet,
  configureCors,
  apiLimiter,
} = require("./server/config/security");
const { requestLogger, cacheControl } = require("./server/middleware/logging");
const {
  validateJWT,
  getSiteFromJWT,
  requireSite,
} = require("./server/middleware/auth");
const errorHandler = require("./server/middleware/errorHandler");
const setupStaticServing = require("./server/utils/staticServing");

// Import routes
const observationRoutes = require("./server/routes/observationRoutes");
const userRoutes = require("./server/routes/userRoutes");
const siteRoutes = require("./server/routes/siteRoutes");

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Security middleware
app.use(configureHelmet());
app.use(configureCors());
app.use("/api/", apiLimiter);

// Body parsing middleware
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser()); // Add cookie parsing

// Logging and cache control
app.use(requestLogger);
app.use(cacheControl);

// Public route for health check
app.get("/api/public", (req, res) => {
  res.json({ message: "Server is running" });
});

// JWT validation for all protected routes
app.use("/api/observations", validateJWT, getSiteFromJWT, observationRoutes);
app.use("/api/users", validateJWT, getSiteFromJWT, userRoutes);
app.use("/api/sites", validateJWT, getSiteFromJWT, siteRoutes);

// Static file serving
setupStaticServing(app);

// Error handling
app.use(errorHandler);

async function startServer() {
  try {
    // Connect to database
    await prisma.$connect();
    console.log("Connected to the database.");

    // Start server
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
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start server
startServer().catch(console.error);

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit();
});
