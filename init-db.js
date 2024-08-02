const Database = require('better-sqlite3');

const db = new Database('observations.sqlite', { verbose: console.log });

db.exec(`
  CREATE TABLE IF NOT EXISTS observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    supervisorName TEXT,
    shift INTEGER,
    associateName TEXT,
    topic TEXT,
    actionAddressed TEXT
  )
`);

db.close();