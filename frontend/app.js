const API = "http://localhost:3000";

function normalizeRegnr(v) {
  return String(v || "").toUpperCase().replace(/\s+/g, "");
}

const REGNR_STANDARD = /^[A-Z]{3}\d{2}[A-Z0-9]$/; // ABC123 eller ABC12D
const REGNR_PERSONAL = /^[A-Z0-9]{2,7}$/;         // t.ex. MINBIL (2–7 tecken)


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

// Container där listan ska skapas dynamiskt
const listContainer = document.querySelector("#listContainer");
let listEl = null;
let editingId = null;


// Modal
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

function ensureListEl() {
  // Skapa list-elementet först när vi har data / när vi ska rendera
  if (!listEl) {
    listEl = document.createElement("div");
    listEl.id = "list";
    listEl.className = "vstack gap-2";
    listContainer.appendChild(listEl);
  }
  return listEl;
}

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

// reset bild-state när vi går in i edit
clearSelectedImage();
removeImage = false;

// om backend skickar car.image (filnamn), visa preview direkt
if (car.image) {
  imagePreview.src = `${API}/uploads/${car.image}`;
  imagePreview.classList.remove("d-none");
  removeImageBtn.classList.remove("d-none");
}
}

function borderColor(color) {
  return color || "#dee2e6";
}

async function loadBrands() {
  const res= await fetch(`${API}/brands`);
  const brands = await res.json();

  brandEl.innerHTML = `<option value="">Välj bilmärke...</option>`;

  brands.forEach((b) => {
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = b.name;
    brandEl.appendChild(opt);
  });
}

function fillYearSelect(from = 1950, to = 2026) {
  yearEl.innerHTML = `<option value="">Välj år...</option>`;
  for (let y = to; y >= from; y--) {
    const opt = document.createElement("option");
    opt.value = String(y);
    opt.textContent = String(y);
    yearEl.appendChild(opt);
  }
}

function updateEditingHighlight() {
  if (!listEl) return;

  listEl.querySelectorAll(".car-card").forEach((el) => {
    const id = Number(el.dataset.id);
    el.classList.toggle("is-editing", id === Number(editingId));
  });
}


async function loadCars() {
  const list = ensureListEl();
  list.innerHTML = `<div class="text-muted">Laddar...</div>`;

  try {
    const res = await fetch(`${API}/cars`);
    const cars = await res.json();

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

  // ✅ viktiga rader för markering
  card.className = "card shadow-sm car-card";
  card.dataset.id = car.id;

  // behåll din border-färglogik
  card.style.borderColor = borderColor(car.color);
  card.style.borderWidth = "2px";

  // om denna bil är den som redigeras -> markera direkt vid render
  if (Number(editingId) === car.id) {
    card.classList.add("is-editing");
  }

      card.innerHTML = `
        <div class="card-body d-flex flex-column flex-md-row gap-3 align-items-start align-items-md-center">
        ${car.image ? `<img src="${API}/uploads/${car.image}" class="me-2" style="width:120px;height:80px;object-fit:cover;border-radius:6px;" />` : ""}
          <div class="flex-grow-1">
            <div class="d-flex align-items-center gap-2">
              <div class="fw-semibold">${car.brand}</div>
              <span class="badge text-bg-light">#${car.id}</span>
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

      card.querySelector(".editBtn").addEventListener("click", () => {
        setEditMode(car);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      card.querySelector(".deleteBtn").addEventListener("click", async () => {
        const ok = confirm(`Ta bort ${car.brand} (${car.regnr})?`);
        if (!ok) return;

        const res = await fetch(`${API}/cars/${car.id}`, { method: "DELETE" });
        const data = await res.json();

        if (!res.ok) {
          showModal("Fel", data.error || "Kunde inte radera");
          return;
        }

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

reloadBtn.addEventListener("click", loadCars);

brandSearchEl.addEventListener("input", () => {
  brandQuery = brandSearchEl.value.trim().toLowerCase();
  loadCars();
});


cancelBtn.addEventListener("click", () => {
  form.reset();
  setCreateMode();   // går tillbaka till "Skapar ny bil" + tar bort markering
});


form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const yearValue = yearEl.value ? Number(yearEl.value) : null;

  if (yearValue !== null && (yearValue < 1950 || yearValue > 2026)) {
    showModal("Fel", "Årtal måste vara mellan 1950 och 2026.");
    return;
  }

  const reg = normalizeRegnr(regnrEl.value);

  if (!(REGNR_STANDARD.test(reg) || REGNR_PERSONAL.test(reg))) {
    showModal(
      "Fel",
      "Regnr måste vara ABC123 / ABC12D eller personlig (2–7 tecken, A–Z/0–9)."
    );
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

  const isEdit = Boolean(payload.id);

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

const res = await fetch(`${API}/cars`, {
  method: isEdit ? "PUT" : "POST",
  body: formData,
});



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





// =======================
// Drag & Drop bild (Steg 1/2)
// =======================
const dropZone = document.getElementById("dropZone");
const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const removeImageBtn = document.getElementById("removeImageBtn");

let selectedImageFile = null;
let removeImage = false; // används vid edit: ta bort befintlig bild när du sparar

function showPreview(file) {
  const reader = new FileReader();
  reader.onload = () => {
    imagePreview.src = reader.result;
    imagePreview.classList.remove("d-none");
  };
  reader.readAsDataURL(file);
}

function clearSelectedImage() {
  selectedImageFile = null;
  imageInput.value = "";
  imagePreview.src = "";
  imagePreview.classList.add("d-none");
  removeImageBtn.classList.add("d-none");
}

// Klick på rutan -> öppna filväljare
dropZone.addEventListener("click", () => {
  imageInput.click();
});

// Välj fil via klick
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) return;

  if (!["image/png", "image/jpeg"].includes(file.type)) {
    showModal("Fel", "Endast PNG eller JPG är tillåtet.");
    return;
  }

  // Du valde en ny bild => det är INTE en "ta bort bild"-handling
  removeImage = false;

  selectedImageFile = file;
  showPreview(file);

  // Visa knapp för att kunna ta bort den valda/visade bilden
  removeImageBtn.classList.remove("d-none");
});

// Dra över
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

// Lämna rutan
dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

// Släpp fil
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");

  const file = e.dataTransfer.files[0];
  if (!file) return;

  if (!["image/png", "image/jpeg"].includes(file.type)) {
    showModal("Fel", "Endast PNG eller JPG är tillåtet.");
    return;
  }

  // Du släppte en ny bild => det är INTE en "ta bort bild"-handling
  removeImage = false;

  selectedImageFile = file;
  showPreview(file);

  // Visa knapp för att kunna ta bort den valda/visade bilden
  removeImageBtn.classList.remove("d-none");
});

// Ta bort bild (preview) – och markera att vi vill ta bort vid sparande (om vi editerar)
removeImageBtn.addEventListener("click", () => {
  clearSelectedImage();
  removeImage = true;
  showModal("Info", "Bilden kommer tas bort när du sparar.");
});

// start
setCreateMode();
fillYearSelect();
loadBrands().then(loadCars);


