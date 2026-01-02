const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = 3000;

function normalizeRegnr(v) {
  return String(v || "").toUpperCase().replace(/\s+/g, "");
}

const REGNR_STANDARD = /^[A-Z]{3}\d{2}[A-Z0-9]$/; // ABC123 eller ABC12D
const REGNR_PERSONAL = /^[A-Z0-9]{2,7}$/;         // t.ex. MINBIL (2–7 tecken)


app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.send("Servern fungerar!");
});

app.get("/cars", (req, res) => {
  const sql = `
    SELECT cars.id,
           cars.brandId,
           brands.name AS brand,
           cars.regnr,
           cars.color,
           cars.year
    FROM cars
    JOIN brands ON cars.brandId = brands.id
    ORDER BY cars.id DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});



// Hämta alla bilmärken
app.get("/brands", (req, res) => {
  db.all("SELECT * FROM brands ORDER BY name ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Lägg till ett nytt bilmärke (valfritt men ni ville ha detta)
app.post("/brands", (req, res) => {
  const name = String(req.body.name || "").trim();

  if (name.length < 2) {
    return res.status(400).json({ error: "Märke är för kort." });
  }

  db.run("INSERT INTO brands (name) VALUES (?)", [name], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.status(201).json({ id: this.lastID, name });
  });
});




app.post("/cars", (req, res) => {
  const { brandId, regnr, color, year } = req.body;
  const cleanRegnr = String(regnr || "").trim().toUpperCase();


  if (!brandId || !regnr || !color) {
    return res.status(400).json({ error: "brandId, regnr och color är obligatoriska" });
  }

  if (year !== undefined && year !== null) {
    const y = Number(year);
    if (!Number.isInteger(y) || y < 1950 || y > 2026) {
      return res.status(400).json({ error: "Årtal måste vara ett heltal mellan 1950 och 2026." });
    }
  }

  db.run(
    "INSERT INTO cars (brandId, regnr, color, year) VALUES (?, ?, ?, ?)",
    [Number(brandId), cleanRegnr, color, year ?? null],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.status(201).json({ id: this.lastID, brandId: Number(brandId), regnr: cleanRegnr, color, year: year ?? null });
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
  const { id, brandId, regnr, color, year } = req.body;
  const cleanRegnr = String(regnr || "").trim().toUpperCase();


  if (!id || !brandId || !regnr || !color) {
    return res.status(400).json({ error: "id, brandId, regnr och color är obligatoriska" });
  }

  if (year !== undefined && year !== null) {
    const y = Number(year);
    if (!Number.isInteger(y) || y < 1950 || y > 2026) {
      return res.status(400).json({ error: "Årtal måste vara ett heltal mellan 1950 och 2026." });
    }
  }

  db.run(
    "UPDATE cars SET brandId = ?, regnr = ?, color = ?, year = ? WHERE id = ?",
    [Number(brandId), cleanRegnr, color, year ?? null, Number(id)],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "Ingen bil uppdaterades (fel id?)" });
      res.json({ id: Number(id), brandId: Number(brandId), regnr, color, year: year ?? null });
    }
  );
});



app.listen(PORT, () => {
  console.log(`Servern kör på http://localhost:${PORT}`);
});
