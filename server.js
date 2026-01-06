const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path"); // Added for file paths

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// This tells Express to look for index.html, script.js, etc. in a folder named 'public'
app.use(express.static(path.join(__dirname, "public")));

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
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// POST – add car
app.post("/cars", (req, res) => {
    const { brand, model, year } = req.body;
    db.run(
        "INSERT INTO cars (brand, model, year) VALUES (?, ?, ?)",
        [brand, model, year],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

// PUT – update car
app.put("/cars/:id", (req, res) => {
    const { brand, model, year } = req.body;
    db.run(
        "UPDATE cars SET brand=?, model=?, year=? WHERE id=?",
        [brand, model, year, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.sendStatus(200);
        }
    );
});

// DELETE – remove car
app.delete("/cars/:id", (req, res) => {
    db.run("DELETE FROM cars WHERE id=?", req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.sendStatus(200);
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Open your browser to http://localhost:${PORT} to see your website`);
});