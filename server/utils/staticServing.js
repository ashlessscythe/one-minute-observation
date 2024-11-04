const path = require('path');
const express = require('express');
const fs = require('fs');
const { staticOptions } = require('../config/security');

function setupStaticServing(app) {
  const buildPath = path.join(__dirname, '../../build');
  const distPath = path.join(__dirname, '../../dist');

  if (fs.existsSync(buildPath)) {
    console.log("Serving static files from:", buildPath);
    app.use(express.static(buildPath, staticOptions));
    serveIndex(app, buildPath);
  } else if (fs.existsSync(distPath)) {
    console.log("Serving static files from:", distPath);
    app.use(express.static(distPath, staticOptions));
    serveIndex(app, distPath);
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

function serveIndex(app, staticPath) {
  app.get("*", (req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
}

module.exports = setupStaticServing;
