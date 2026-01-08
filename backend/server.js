// Importer: bibliotek 
const multer = require("multer");         // Hanterar filuppladdningar 
const path = require("path");             // Hjälper till att bygga korrekta filvägar 

const express = require("express");       // Webbserver / API-ramverk
const cors = require("cors");             // Tillåter anrop från andra origin 
const db = require("./db");               // Databas-anslutning / wrapper 
const fs = require("fs");                 // Fil-systemet 


// Skapa server + grundinställningar 
const app = express();
const PORT = 3000;


//  Hjälpfunktioner / validering 
function normalizeRegnr(v) {
  // gör om till versaler och tar bort mellanslag
  return String(v || "").toUpperCase().replace(/\s+/g, "");
}

// Regex-mönster för att kunna validera regnr-format 
const REGNR_STANDARD = /^[A-Z]{3}\d{2}[A-Z0-9]$/; 
const REGNR_PERSONAL = /^[A-Z0-9]{2,7}$/;        


// Middleware: globalt för alla requests 
app.use(cors());                          // Tillåt CORS så frontenden kan anropa API:t
app.use(express.static('./frontend'));    // Servera statiska filer  från frontend-mappen
app.use(express.json());                  // Gör så att req.body kan läsa JSON 

// Gör uppladdade filer publikt tillgängliga på URL: /uploads/<filnamn>
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


//  Multer-konfiguration: var och hur bilder sparas 
const storage = multer.diskStorage({
  // Var filerna ska sparas 
  destination: (req, file, cb) => cb(null, path.join(__dirname, "uploads")),

  // Hur filnamnet ska se ut 
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase(); // behåll filändelsen
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  // tillåt endast PNG/JPG
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/png" || file.mimetype === "image/jpeg") cb(null, true);
    else cb(new Error("Endast PNG/JPG"), false);
  },
});


//  Hämta alla bilar 
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

  // Kör SQL och returnera resultat som JSON
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    // Förhindra att browsern cachear listan 
    res.set("Cache-Control", "no-store");
    res.json(rows);
  });
});


//  Hämta alla bilmärken 
app.get("/brands", (req, res) => {
  db.all("SELECT * FROM brands ORDER BY name ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});


// Skapa nytt bilmärke 
app.post("/brands", (req, res) => {
  const name = String(req.body.name || "").trim();

  // Enkel validering: minst 2 tecken
  if (name.length < 2) {
    return res.status(400).json({ error: "Märke är för kort." });
  }

  // Spara i databasen
  db.run("INSERT INTO brands (name) VALUES (?)", [name], function (err) {
    if (err) return res.status(400).json({ error: err.message });

    // Returnera skapad post (id från databasen)
    res.status(201).json({ id: this.lastID, name });
  });
});


//  ROUTE: Skapa ny bil (med ev. bild) 
app.post("/cars", upload.single("image"), (req, res) => {
  const { brandId, regnr, color, year } = req.body;

  // Rensa/standardisera regnr
  const cleanRegnr = String(regnr || "").trim().toUpperCase();

  // Om bild skickas: spara filnamnet i DB
  const image = req.file ? req.file.filename : null;

  // måste ha brandId, regnr och färg
  if (!brandId || !regnr || !color) {
    return res.status(400).json({ error: "brandId, regnr och color är obligatoriska" });
  }

  // Validera årtal om det finns
  if (year !== undefined && year !== null && year !== "") {
    const y = Number(year);
    if (!Number.isInteger(y) || y < 1950 || y > 2026) {
      return res.status(400).json({ error: "Årtal måste vara ett heltal mellan 1950 och 2026." });
    }
  }

  // Spara bilen i databasen
  db.run(
    "INSERT INTO cars (brandId, regnr, color, year, image) VALUES (?, ?, ?, ?, ?)",
    [Number(brandId), cleanRegnr, String(color).trim(), year ? Number(year) : null, image],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });

      // Skicka tillbaka den skapade bilen
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


//  ROUTE: Uppdatera bil (kan byta bild, behålla bild eller ta bort bild) 
app.put("/cars", upload.single("image"), (req, res) => {
  const { id, brandId, regnr, color, year, removeImage } = req.body;
  const cleanRegnr = String(regnr || "").trim().toUpperCase();

  // Grundkrav: id + fält som måste finnas
  if (!id || !brandId || !regnr || !color) {
    return res.status(400).json({ error: "id, brandId, regnr och color är obligatoriska" });
  }

  // Validera årtal om det finns
  if (year !== undefined && year !== null && year !== "") {
    const y = Number(year);
    if (!Number.isInteger(y) || y < 1950 || y > 2026) {
      return res.status(400).json({ error: "Årtal måste vara ett heltal mellan 1950 och 2026." });
    }
  }

  // Hämta befintlig bild från DB så vi kan:
  // - behålla den om ingen ny bild skickas
  // - ersätta den om ny bild skickas
  // - ta bort den om removeImage === "1"
  db.get("SELECT image FROM cars WHERE id = ?", [Number(id)], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Ingen bil med det id:t" });

    let newImage = row.image; // standard: behåll befintlig bild

    if (req.file) newImage = req.file.filename; // ny uppladdning -> ersätt
    if (removeImage === "1") newImage = null;   // användaren vill ta bort bilden

    // Uppdatera bilen i DB
    db.run(
      "UPDATE cars SET brandId = ?, regnr = ?, color = ?, year = ?, image = ? WHERE id = ?",
      [Number(brandId), cleanRegnr, String(color).trim(), year ? Number(year) : null, newImage, Number(id)],
      function (err2) {
        if (err2) return res.status(400).json({ error: err2.message });
        if (this.changes === 0) return res.status(404).json({ error: "Ingen bil uppdaterades (fel id?)" });

        // Skicka tillbaka uppdaterad bil
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


//  ROUTE: Ta bort bil (och radera bildfil om den finns) 
app.delete("/cars/:id", (req, res) => {
  const id = Number(req.params.id);

  // Validera att id är ett heltal
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Ogiltigt id" });

  // Hämta bilden först så vi kan radera filen efter att DB-raden tas bort
  db.get("SELECT image FROM cars WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Hittades inte" });

    // Ta bort bilen från DB
    db.run("DELETE FROM cars WHERE id = ?", [id], function (err2) {
      if (err2) return res.status(400).json({ error: err2.message });

      // Om det fanns en bild: försök radera filen från uploads (ignorera fel)
      if (row.image) {
        const p = path.join(__dirname, "uploads", row.image);
        fs.unlink(p, () => {}); // ignorera ev. fel
      }

      res.json({ ok: true, deletedId: id });
    });
  });
});


//  Starta servern console loggar "servern kör på (port) /frontend"
app.listen(PORT, () => {
  console.log(`Servern kör på http://localhost:${PORT}/frontend`);
});
