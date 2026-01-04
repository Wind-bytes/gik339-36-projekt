const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Database
const db = new sqlite3.Database("./database.db");

// Create table
db.run(`
    CREATE TABLE IF NOT EXISTS cars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brand TEXT,
        model TEXT,
        year INTEGER
    )
`);

// GET – list all cars
app.get("/cars", (req, res) => {
    db.all("SELECT * FROM cars", [], (err, rows) => {
        res.json(rows);
    });
});

// POST – add car
app.post("/cars", (req, res) => {
    const { brand, model, year } = req.body;
    db.run(
        "INSERT INTO cars (brand, model, year) VALUES (?, ?, ?)",
        [brand, model, year],
        function () {
            res.json({ id: this.lastID });
        }
    );
});

// PUT – update car (NYTT KRAV)
app.put("/cars/:id", (req, res) => {
    const { brand, model, year } = req.body;
    db.run(
        "UPDATE cars SET brand=?, model=?, year=? WHERE id=?",
        [brand, model, year, req.params.id],
        () => res.sendStatus(200)
    );
});

// DELETE – remove car
app.delete("/cars/:id", (req, res) => {
    db.run("DELETE FROM cars WHERE id=?", req.params.id, () => {
        res.sendStatus(200);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
