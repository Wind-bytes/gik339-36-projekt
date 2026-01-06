const multer = require("multer");
const path = require("path");

const express = require("express");
const cors = require("cors");
const db = require("./db");
const fs = require("fs"); // <-- lägg till denna


const app = express();
const PORT = 3000;

function normalizeRegnr(v) {
  return String(v || "").toUpperCase().replace(/\s+/g, "");
}

const REGNR_STANDARD = /^[A-Z]{3}\d{2}[A-Z0-9]$/; // ABC123 eller ABC12D
const REGNR_PERSONAL = /^[A-Z0-9]{2,7}$/;         // t.ex. MINBIL (2–7 tecken)


app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "uploads")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/png" || file.mimetype === "image/jpeg") cb(null, true);
    else cb(new Error("Endast PNG/JPG"), false);
  },
});



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
           cars.year,
           cars.image
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




app.post("/cars", upload.single("image"), (req, res) => {
  const { brandId, regnr, color, year } = req.body;
  const cleanRegnr = String(regnr || "").trim().toUpperCase();
  const image = req.file ? req.file.filename : null;

  if (!brandId || !regnr || !color) {
    return res.status(400).json({ error: "brandId, regnr och color är obligatoriska" });
  }

  if (year !== undefined && year !== null && year !== "") {
    const y = Number(year);
    if (!Number.isInteger(y) || y < 1950 || y > 2026) {
      return res.status(400).json({ error: "Årtal måste vara ett heltal mellan 1950 och 2026." });
    }
  }

  db.run(
    "INSERT INTO cars (brandId, regnr, color, year, image) VALUES (?, ?, ?, ?, ?)",
    [Number(brandId), cleanRegnr, String(color).trim(), year ? Number(year) : null, image],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });

      res.status(201).json({
        id: this.lastID,
        brandId: Number(brandId),
        regnr: cleanRegnr,
        color: String(color).trim(),
        year: year ? Number(year) : null,
        image,
      });
    }
  );
});



app.put("/cars", upload.single("image"), (req, res) => {
  const { id, brandId, regnr, color, year, removeImage } = req.body;
  const cleanRegnr = String(regnr || "").trim().toUpperCase();

  if (!id || !brandId || !regnr || !color) {
    return res.status(400).json({ error: "id, brandId, regnr och color är obligatoriska" });
  }

  if (year !== undefined && year !== null && year !== "") {
    const y = Number(year);
    if (!Number.isInteger(y) || y < 1950 || y > 2026) {
      return res.status(400).json({ error: "Årtal måste vara ett heltal mellan 1950 och 2026." });
    }
  }

  // Hämta befintlig bild så vi kan behålla den om ingen ny skickas
  db.get("SELECT image FROM cars WHERE id = ?", [Number(id)], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Ingen bil med det id:t" });

    let newImage = row.image; // default: behåll befintlig

    // om ny fil skickas -> ersätt
    if (req.file) newImage = req.file.filename;

    // om användaren valt "Ta bort bild" -> ta bort
    if (removeImage === "1") newImage = null;

    db.run(
      "UPDATE cars SET brandId = ?, regnr = ?, color = ?, year = ?, image = ? WHERE id = ?",
      [Number(brandId), cleanRegnr, String(color).trim(), year ? Number(year) : null, newImage, Number(id)],
      function (err2) {
        if (err2) return res.status(400).json({ error: err2.message });
        if (this.changes === 0) return res.status(404).json({ error: "Ingen bil uppdaterades (fel id?)" });

        res.json({
          id: Number(id),
          brandId: Number(brandId),
          regnr: cleanRegnr,
          color: String(color).trim(),
          year: year ? Number(year) : null,
          image: newImage,
        });
      }
    );
  });
});

// --- klistra in under app.put("/cars", ...) och före app.listen ---
app.delete("/cars/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Ogiltigt id" });

  db.get("SELECT image FROM cars WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Hittades inte" });

    db.run("DELETE FROM cars WHERE id = ?", [id], function (err2) {
      if (err2) return res.status(400).json({ error: err2.message });

      if (row.image) {
        const p = path.join(__dirname, "uploads", row.image);
        fs.unlink(p, () => {}); // ignorera ev. fel
      }
      res.json({ ok: true, deletedId: id });
    });
  });
});




app.listen(PORT, () => {
  console.log(`Servern kör på http://localhost:${PORT}`);
});
