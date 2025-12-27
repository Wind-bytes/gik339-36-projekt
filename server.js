const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

const path = require('path');
const db = new sqlite3.Database('tables.db');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

db.run(`
  CREATE TABLE IF NOT EXISTS cars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand TEXT,
    model TEXT,
    color TEXT,
    year INTEGER
  )
`);

app.get('/cars', (req, res) => {
    const sql = "SELECT * FROM cars";
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("DB Error:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows || []);
    });
});

app.post('/cars', (req, res) => {
    const { brand, model, color, year } = req.body;
    const sql = "INSERT INTO cars (brand, model, color, year) VALUES (?, ?, ?, ?)";
    db.run(sql, [brand, model, color, year],function (err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({ id: this.lastID, message: "Car created successfully" });
    });
});

app.put('/cars/:id', (req, res) => {
    const id = req.params.id;
    const { brand, model, color, year } = req.body;
    const sql = "UPDATE cars SET brand = ?, model = ?, color = ?, year = ? WHERE id = ?";
    db.run(sql, [brand, model, color, year, id], function (err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({ message: "Car updated successfully" });
    });
});

app.delete('/cars/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM cars WHERE id = ?";
    db.run(sql, id, function (err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({ message: "Car deleted successfully" });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
})