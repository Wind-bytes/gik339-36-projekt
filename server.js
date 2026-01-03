require('dotenv').config();

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { getUnsplashImage } = require('./unsplash.js');

const server = express();
const port = 3000;

const db = new sqlite3.Database('tables.db');

server.use(express.static(path.join(__dirname, 'public')));
server.use(express.json());

db.run(`
  CREATE TABLE IF NOT EXISTS cars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand TEXT,
    model TEXT,
    color TEXT,
    year INTEGER
  )
`);

// Proxy endpoint for Unsplash images
server.get('/api/car-image', async (req, res) => {
    const { brand, model, year } = req.query;
    
    if (!brand || !model) {
        return res.status(400).json({ error: 'Brand and model required' });
    }
    
    try {
        const query = `${brand} ${model} ${year || ''}`.trim();
        const imageUrl = await getUnsplashImage(query);
        
        if (imageUrl) {
            res.json({ imageUrl });
        } else {
            res.status(404).json({ error: 'No image found' });
        }
    } catch (error) {
        console.error('Image fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch image' });
    }
});

server.get('/cars', (req, res) => {
    const sql = "SELECT * FROM cars";
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("DB Error:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows || []);
    });
});

server.post('/cars', (req, res) => {
    const { brand, model, color, year } = req.body;
    
    // Input validation
    if (!brand || !model) {
        return res.status(400).json({ error: 'Brand and model are required' });
    }
    
    const sql = "INSERT INTO cars (brand, model, color, year) VALUES (?, ?, ?, ?)";
    db.run(sql, [brand, model, color, year], function (err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({ id: this.lastID, message: "Car created successfully" });
    });
});

server.put('/cars/:id', (req, res) => {
    const id = req.params.id;
    const { brand, model, color, year } = req.body;
    
    if (!brand || !model) {
        return res.status(400).json({ error: 'Brand and model are required' });
    }
    
    const sql = "UPDATE cars SET brand = ?, model = ?, color = ?, year = ? WHERE id = ?";
    db.run(sql, [brand, model, color, year, id], function (err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({ message: "Car updated successfully" });
    });
});

server.delete('/cars/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM cars WHERE id = ?";
    db.run(sql, id, function (err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({ message: "Car deleted successfully" });
    });
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});