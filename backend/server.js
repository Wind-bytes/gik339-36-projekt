const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.send("Servern fungerar!");
});

app.get("/cars", (req, res) => {
  db.all("SELECT * FROM cars ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});



app.post("/cars", (req, res) => {
  const { brand, regnr, color, year } = req.body;

  if (!brand || !regnr || !color) {
    return res.status(400).json({ error: "brand, regnr och color är obligatoriska" });
  }

  db.run(
    "INSERT INTO cars (brand, regnr, color, year) VALUES (?, ?, ?, ?)",
    [brand, regnr, color, year ?? null],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.status(201).json({ id: this.lastID, brand, regnr, color, year: year ?? null });
    }
  );
});

app.delete("/cars/:id", (req, res) => {
  const id = Number(req.params.id);

  db.run("DELETE FROM cars WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Ingen bil med det id:t" });

    res.json({ message: "Bilen raderades", id });
  });
});

app.put("/cars", (req, res) => {
  const { id, brand, regnr, color, year } = req.body;

  if (!id || !brand || !regnr || !color) {
    return res.status(400).json({ error: "id, brand, regnr och color är obligatoriska" });
  }

  db.run(
    "UPDATE cars SET brand = ?, regnr = ?, color = ?, year = ? WHERE id = ?",
    [brand, regnr, color, year ?? null, id],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "Ingen bil uppdaterades (fel id?)" });

      res.json({ id, brand, regnr, color, year: year ?? null });
    }
  );
});


app.listen(PORT, () => {
  console.log(`Servern kör på http://localhost:${PORT}`);
});
