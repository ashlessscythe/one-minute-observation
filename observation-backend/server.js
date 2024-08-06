const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const Database = require('better-sqlite3');
const { initDatabase } = require('./init-db');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let db;

// Initialize database before starting the server
initDatabase().then(() => {
  // Connect to SQLite database
  db = new Database('./observations.sqlite', { verbose: console.log });
  console.log('Connected to the observations database.');

  // GET route with filters for observations
  app.get('/api/observations', (req, res) => {
    const { supervisorName, startDate, endDate } = req.query;
    let query = 'SELECT * FROM observations WHERE 1=1';
    const params = [];

    if (supervisorName) {
      query += ' AND supervisorName LIKE ?';
      params.push(`%${supervisorName}%`);
    }

    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY date DESC';

    try {
      const stmt = db.prepare(query);
      const rows = stmt.all(...params);
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // POST route for observations
  app.post('/api/observations', (req, res) => {
    const { date, supervisorName, shift, associateName, topic, actionAddressed } = req.body;
    
    const sql = `INSERT INTO observations (date, supervisorName, shift, associateName, topic, actionAddressed)
                 VALUES (?, ?, ?, ?, ?, ?)`;
    
    const info = db.prepare(sql).run(date, supervisorName, shift, associateName, topic, actionAddressed);
    res.json({ id: info.lastInsertRowid });
  });

  // GET route for users
  app.get('/api/users', (req, res) => {
    const { isSupervisor } = req.query;
    
    let sql = 'SELECT * FROM users';
    const params = [];

    if (isSupervisor !== undefined) {
      sql += ' WHERE isSupervisor = ?';
      params.push(isSupervisor === 'true' ? 1 : 0);
    }

    sql += ' ORDER BY name ASC';

    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  });

  // Check if build directory exists
  const buildPath = path.join(__dirname, '..', 'build');
  if (fs.existsSync(buildPath)) {
    // Serve static files from the React app
    app.use(express.static(buildPath));

    // The "catchall" handler: for any request that doesn't
    // match one above, send back React's index.html file.
    app.get('*', (req, res) => {
      const indexPath = path.join(buildPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Frontend build not found. Please run npm run build');
      }
    });
  } else {
    console.warn('Build directory not found. Static file serving is disabled.');
  
    // Fallback route handler
    app.get('*', (req, res) => {
      res.status(404).send('Frontend build not found. Please run npm run build');
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
  });
}).catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});