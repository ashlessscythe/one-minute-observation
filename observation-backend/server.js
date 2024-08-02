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

// Create table if not exists
db.run(`CREATE TABLE IF NOT EXISTS observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT,
  supervisorName TEXT,
  shift INTEGER,
  associateName TEXT,
  topic TEXT,
  actionAddressed TEXT
)`);

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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});