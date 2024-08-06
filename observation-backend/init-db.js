const Database = require('better-sqlite3');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

function initDatabase() {
  const db = new Database('observations.sqlite', { verbose: console.log });

  // Create observations table
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

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      isSupervisor BOOLEAN NOT NULL DEFAULT 0
    )
  `);

  // Prepare insert statements
  const insertUser = db.prepare('INSERT INTO users (name, isSupervisor) VALUES (?, ?)');
  const insertObservation = db.prepare('INSERT INTO observations (date, supervisorName, shift, associateName, topic, actionAddressed) VALUES (?, ?, ?, ?, ?, ?)');

  // Function to process CSV file
  function processCsv(filepath, insertStatement) {
    return new Promise((resolve, reject) => {
      fs.createReadStream(path.join(__dirname, filepath))
        .pipe(csv())
        .on('data', (row) => {
          if (filepath.includes('users.csv')) {
            insertStatement.run(row.name, row.isSupervisor === 'true' ? 1 : 0);
          } else { // observations CSV
            insertStatement.run(
              row.date,
              row.supervisorName,
              parseInt(row.shift),
              row.associateName,
              row.topic,
              row.actionAddressed
            );
          }
        })
        .on('end', () => {
          console.log(`${filepath} successfully processed`);
          resolve();
        })
        .on('error', reject);
    });
  }

  // Check if tables are empty and process CSVs if they are
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const observationCount = db.prepare('SELECT COUNT(*) as count FROM observations').get().count;

  const initPromises = [];

  if (userCount === 0) {
    initPromises.push(processCsv('users.csv', insertUser));
  }

  if (observationCount === 0) {
    initPromises.push(processCsv('u-obs.csv', insertObservation));
  }

  return Promise.all(initPromises)
    .then(() => {
      console.log('All data processed');
      db.close();
    })
    .catch((error) => {
      console.error('Error processing data:', error);
      db.close();
    });
}

module.exports = { initDatabase };