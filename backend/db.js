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

db.serialize(() => {
  // ✅ Aktivera foreign keys i SQLite (måste köras varje gång)
  db.run("PRAGMA foreign_keys = ON");

  // 1) Tabell för märken
  db.run(`
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);


  // 2) Tabell för bilar (brandId istället för brand-text)
  db.run(`
    CREATE TABLE IF NOT EXISTS cars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brandId INTEGER NOT NULL,
      regnr TEXT NOT NULL,
      color TEXT NOT NULL,
      year INTEGER,
      image TEXT,
      FOREIGN KEY (brandId) REFERENCES brands(id)
    )
  `);

  // regnr unik (om ni vill behålla den regeln)
  db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_cars_regnr ON cars(regnr)`);

  // 3) Seed: vanliga märken (lägg till/ta bort här)
  const commonBrands = [
    "Volvo","Saab","BMW","Audi","Mercedes-Benz","Volkswagen","Toyota","Honda",
    "Ford","Kia","Hyundai","Mazda","Nissan","Peugeot","Renault","Skoda","Opel",
    "Tesla","Porsche","Subaru","Suzuki"
  ];

  const stmt = db.prepare(`INSERT OR IGNORE INTO brands (name) VALUES (?)`);
  commonBrands.forEach((b) => stmt.run(b));
  stmt.finalize();
});


module.exports = db;
