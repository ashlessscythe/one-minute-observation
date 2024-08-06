const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Connect to SQLite database
const db = new sqlite3.Database('./observations.sqlite', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the observations database.');
});

// Create tables if not exists
db.run(`CREATE TABLE IF NOT EXISTS observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT,
  supervisorName TEXT,
  shift INTEGER,
  associateName TEXT,
  topic TEXT,
  actionAddressed TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  isSupervisor BOOLEAN NOT NULL DEFAULT 0
)`);

// GET route for observations
app.get('/api/observations', (req, res) => {
  const { startDate, endDate, sortBy = 'date', order = 'DESC' } = req.query;
  
  let sql = 'SELECT * FROM observations';
  const params = [];
  if (startDate && endDate) {
    sql += ' WHERE date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }
  sql += ` ORDER BY ${sortBy} ${order}`;
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// POST route for observations
app.post('/api/observations', (req, res) => {
  const { date, supervisorName, shift, associateName, topic, actionAddressed } = req.body;
  
  const sql = `INSERT INTO observations (date, supervisorName, shift, associateName, topic, actionAddressed)
               VALUES (?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [date, supervisorName, shift, associateName, topic, actionAddressed], function(err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID });
  });
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

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});