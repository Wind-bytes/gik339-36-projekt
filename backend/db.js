const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Databasfilen (skapas automatiskt)
const dbPath = path.join(__dirname, "cars.db");

// Öppna eller skapa databasen
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Kunde inte öppna databasen:", err.message);
  } else {
    console.log("SQLite ansluten:", dbPath);
  }
});

// Skapa tabell om den inte finns
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS cars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand TEXT NOT NULL,
      regnr TEXT NOT NULL,
      color TEXT NOT NULL,
      year INTEGER
    )
  `);
});

module.exports = db;
