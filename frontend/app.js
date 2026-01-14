// Var backend-API:t finns
const API = "http://localhost:3000";

// Gör regnr “rent”: stora bokstäver och inga mellanslag
function normalizeRegnr(v) {
  return String(v || "").toUpperCase().replace(/\s+/g, "");
}

// Regler för vad som räknas som giltigt regnr
const REGNR_STANDARD = /^[A-Z]{3}\d{2}[A-Z0-9]$/; // ABC123 eller ABC12D
const REGNR_PERSONAL = /^[A-Z0-9]{2,7}$/;         // t.ex. MINBIL


// Hämtar knappar och fält från sidan
const reloadBtn = document.querySelector("#reload");

const brandSearchEl = document.querySelector("#brandSearch");
let brandQuery = "";

const form = document.querySelector("#carForm");
const idEl = document.querySelector("#id");
const brandEl = document.querySelector("#brand");
const regnrEl = document.querySelector("#regnr");
const colorEl = document.querySelector("#color");
const yearEl = document.querySelector("#year");
const cancelBtn = document.querySelector("#cancelBtn");

const formModeEl = document.querySelector("#formMode");
const saveBtn = document.querySelector("#saveBtn");

// Här byggs bil-listan upp dynamiskt
const listContainer = document.querySelector("#listContainer");
let listEl = null;
let editingId = null;


// Enkel “popup” för meddelanden (Bootstrap om den finns, annars alert)
const msgModalEl = document.querySelector("#msgModal");
const msgModalTitleEl = document.querySelector("#msgModalTitle");
const msgModalBodyEl = document.querySelector("#msgModalBody");
const msgModal = msgModalEl ? new bootstrap.Modal(msgModalEl) : null;

function showModal(title, body) {
  if (!msgModal) {
    alert(`${title}: ${body}`);
    return;
  }
  msgModalTitleEl.textContent = title;
  msgModalBodyEl.textContent = body;
  msgModal.show();
}


// Skapar list-elementet första gången vi behöver rendera
function ensureListEl() {
  if (!listEl) {
    listEl = document.createElement("div");
    listEl.id = "list";
    listEl.className = "vstack gap-2";
    listContainer.appendChild(listEl);
  }
  return listEl;
}


// Växlar formuläret till “skapa ny bil”
function setCreateMode() {
  idEl.value = "";
  editingId = null;
  updateEditingHighlight();

  formModeEl.textContent = "Skapar ny bil";
  saveBtn.textContent = "Spara";
  saveBtn.classList.remove("btn-success");
  saveBtn.classList.add("btn-primary");
  cancelBtn.classList.add("d-none");

  clearSelectedImage();
  removeImage = false;
}


// Växlar formuläret till “redigera befintlig bil”
function setEditMode(car) {
  idEl.value = car.id;
  brandEl.value = String(car.brandId);
  regnrEl.value = car.regnr;
  colorEl.value = String(car.color || "");
  yearEl.value = car.year ? String(car.year) : "";

  formModeEl.textContent = `Redigerar bil #${car.id}`;
  saveBtn.textContent = "Uppdatera";
  saveBtn.classList.remove("btn-primary");
  saveBtn.classList.add("btn-success");

  editingId = car.id;
  updateEditingHighlight();
  cancelBtn.classList.remove("d-none");

  // Nollställ bildval när vi går in i edit-läge
  clearSelectedImage();
  removeImage = false;

  // Om bilen har bild, visa den direkt
  if (car.image) {
    imagePreview.src = `${API}/uploads/${car.image}`;
    imagePreview.classList.remove("d-none");
    removeImageBtn.classList.remove("d-none");
  }
}


// Hämtar bilmärken och fyller dropdownen
async function loadBrands() {
  const res = await fetch(`${API}/brands`);
  const brands = await res.json();

  brandEl.innerHTML = `<option value="">Välj bilmärke...</option>`;

  brands.forEach((b) => {
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = b.name;
    brandEl.appendChild(opt);
  });
}


// Fyller år-dropdown med årtal
function fillYearSelect(from = 1950, to = 2026) {
  yearEl.innerHTML = `<option value="">Välj år...</option>`;
  for (let y = to; y >= from; y--) {
    const opt = document.createElement("option");
    opt.value = String(y);
    opt.textContent = String(y);
    yearEl.appendChild(opt);
  }
}


// Markerar kortet i listan som just nu redigeras
function updateEditingHighlight() {
  if (!listEl) return;

  listEl.querySelectorAll(".car-card").forEach((el) => {
    const id = Number(el.dataset.id);
    el.classList.toggle("is-editing", id === Number(editingId));
  });
}


// Hämtar bilar från backend och renderar dem som kort
async function loadCars() {
  const list = ensureListEl();
  list.innerHTML = `<div class="text-muted">Laddar...</div>`;

  try {
    const res = await fetch(`${API}/cars`, { cache: "no-store" });
    const cars = await res.json();

    // Filtrerar på märke om du skrivit i sökfältet
    const filtered = brandQuery
      ? cars.filter((c) => String(c.brand || "").toLowerCase().includes(brandQuery))
      : cars;

    if (!Array.isArray(filtered) || filtered.length === 0) {
      list.innerHTML = `<div class="alert alert-secondary mb-0">Inga träffar.</div>`;
      return;
    }

    list.innerHTML = "";

    filtered.forEach((car) => {
      const card = document.createElement("div");

      // Bygger ett “kort” per bil och sparar id i dataset
      card.className = "card shadow-sm car-card";
      card.dataset.id = car.id;

      const colorKey = String(car.color || "").trim().toLowerCase();


const cssColorMap = {
  "röd": "red",
  "blå": "blue",
  "grön": "green",
  "svart": "black",
  "vit": "white",
  "grå": "gray",
  "silver": "silver",
};

const cssColor = cssColorMap[colorKey];
if (cssColor) {
  card.style.borderLeft = `10px solid ${cssColor}`;
}



      // Själva innehållet i kortet (inkl. bild om den finns)
      card.innerHTML = `
        <div class="card-body d-flex flex-column flex-md-row gap-3 align-items-start align-items-md-center">
          ${car.image ? `<img src="${API}/uploads/${car.image}" class="me-2" style="width:120px;height:80px;object-fit:cover;border-radius:6px;" />` : ""}
          <div class="flex-grow-1">
            <div class="d-flex align-items-center gap-2">
              <div class="fw-semibold">${car.brand}</div>
            </div>
            <div class="text-muted small">
              Regnr: <span class="text-dark">${car.regnr}</span> •
              Färg: <span class="text-dark">${car.color}</span> •
              År: <span class="text-dark">${car.year ?? "-"}</span>
            </div>
          </div>

          <div class="d-flex gap-2">
            <button class="btn btn-outline-primary btn-sm editBtn">Edit</button>
            <button class="btn btn-outline-danger btn-sm deleteBtn">Ta bort</button>
          </div>
        </div>
      `;

      // Edit-knapp: fyller formuläret och scrollar upp
      card.querySelector(".editBtn").addEventListener("click", () => {
        setEditMode(car);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      // Delete-knapp: tar bort i backend och uppdaterar listan
      card.querySelector(".deleteBtn").addEventListener("click", async () => {
        const ok = confirm(`Ta bort ${car.brand} (${car.regnr})?`);
        if (!ok) return;

        const res = await fetch(`${API}/cars/${car.id}`, { method: "DELETE" });
        const data = await res.json();

        if (!res.ok) {
          showModal("Fel", data.error || "Kunde inte radera");
          return;
        }

        // Ta bort kortet direkt så det känns snabbt
        card.remove();

        // Om vi råkade redigera samma bil, nollställ formuläret
        if (Number(idEl.value) === car.id) {
          form.reset();
          setCreateMode();
        }

        showModal("Klart", "Bilen raderades");
        loadCars();
      });

      list.appendChild(card);
    });
  } catch (err) {
    const list = ensureListEl();
    list.innerHTML = `<div class="alert alert-danger mb-0">Kunde inte hämta data: ${err.message}</div>`;
  }
}


// Knappar och input som triggar omladdning/filtrering
reloadBtn.addEventListener("click", loadCars);

brandSearchEl.addEventListener("input", () => {
  brandQuery = brandSearchEl.value.trim().toLowerCase();
  loadCars();
});

cancelBtn.addEventListener("click", () => {
  form.reset();
  setCreateMode();
});


// När du sparar: validera, bygg request och skicka till backend
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const yearValue = yearEl.value ? Number(yearEl.value) : null;

  if (yearValue !== null && (yearValue < 1950 || yearValue > 2026)) {
    showModal("Fel", "Årtal måste vara mellan 1950 och 2026.");
    return;
  }

  const reg = normalizeRegnr(regnrEl.value);

  if (!(REGNR_STANDARD.test(reg) || REGNR_PERSONAL.test(reg))) {
    showModal("Fel", "Regnr måste vara ABC123 / ABC12D eller personlig (2–7 tecken).");
    return;
  }

  const payload = {
    id: idEl.value ? Number(idEl.value) : undefined,
    brandId: Number(brandEl.value),
    regnr: reg,
    color: colorEl.value.trim(),
    year: yearValue,
  };

  if (!payload.brandId) {
    showModal("Fel", "Välj ett bilmärke i listan.");
    return;
  }

  // Avgör om det är skapa eller uppdatera
  const isEdit = Boolean(payload.id);

  // Om vi hanterar bild måste vi använda FormData, annars räcker JSON
  const needsFormData = Boolean(selectedImageFile) || (isEdit && removeImage);

  let res;

  if (!needsFormData) {
    res = await fetch(`${API}/cars`, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } else {
    const formData = new FormData();
    if (isEdit) formData.append("id", String(payload.id));
    formData.append("brandId", String(payload.brandId));
    formData.append("regnr", payload.regnr);
    formData.append("color", payload.color);
    if (payload.year !== null && payload.year !== undefined) {
      formData.append("year", String(payload.year));
    }
    if (selectedImageFile) {
      formData.append("image", selectedImageFile);
    }
    if (isEdit && removeImage) {
      formData.append("removeImage", "1");
    }

    res = await fetch(`${API}/cars`, {
      method: isEdit ? "PUT" : "POST",
      body: formData,
    });
  }

  const data = await res.json();

  if (!res.ok) {
    showModal("Fel", data.error || "Något gick fel");
    return;
  }

  form.reset();
  setCreateMode();
  showModal("Klart", isEdit ? "Bilen uppdaterades" : "Bilen skapades");
  loadCars();
});


//  Drag & drop + filval för bild 
const dropZone = document.getElementById("dropZone");
const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const removeImageBtn = document.getElementById("removeImageBtn");

let selectedImageFile = null;
let removeImage = false;

// Visar en preview av vald bild
function showPreview(file) {
  const reader = new FileReader();
  reader.onload = () => {
    imagePreview.src = reader.result;
    imagePreview.classList.remove("d-none");
  };
  reader.readAsDataURL(file);
}

// Rensar bilden du valt och gömmer preview
function clearSelectedImage() {
  selectedImageFile = null;
  imageInput.value = "";
  imagePreview.src = "";
  imagePreview.classList.add("d-none");
  removeImageBtn.classList.add("d-none");
}

// Klick på rutan öppnar filväljaren
dropZone.addEventListener("click", () => {
  imageInput.click();
});

// När du väljer fil via filväljaren
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) return;

  if (!["image/png", "image/jpeg"].includes(file.type)) {
    showModal("Fel", "Endast PNG eller JPG är tillåtet.");
    return;
  }

  removeImage = false;
  selectedImageFile = file;
  showPreview(file);
  removeImageBtn.classList.remove("d-none");
});


// Visuell effekt när du drar en fil över rutan
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

// När du släpper filen i rutan
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");

  const file = e.dataTransfer.files[0];
  if (!file) return;

  if (!["image/png", "image/jpeg"].includes(file.type)) {
    showModal("Fel", "Endast PNG eller JPG är tillåtet.");
    return;
  }

  removeImage = false;
  selectedImageFile = file;
  showPreview(file);
  removeImageBtn.classList.remove("d-none");
});

// Tar bort preview och markerar att bilden ska tas bort när du sparar
removeImageBtn.addEventListener("click", () => {
  clearSelectedImage();
  removeImage = true;
  showModal("Info", "Bilden kommer tas bort när du sparar.");
});


// Start: sätt standardläge och ladda data
setCreateMode();
fillYearSelect();
loadBrands().then(loadCars);
