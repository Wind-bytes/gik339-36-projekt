const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

const db = new sqlite3.Database('tables.db');

app.use(express.static('./'));

const show_cars = `SELECT * FROM cars`;

app.get('/cars', (req, res) => {
    db.all(show_cars, [], (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
})