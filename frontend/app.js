const API = "http://localhost:3000";

const reloadBtn = document.querySelector("#reload");

const form = document.querySelector("#carForm");
const idEl = document.querySelector("#id");
const brandEl = document.querySelector("#brand");
const regnrEl = document.querySelector("#regnr");
const colorEl = document.querySelector("#color");
const yearEl = document.querySelector("#year");

const formModeEl = document.querySelector("#formMode");
const saveBtn = document.querySelector("#saveBtn");

// Container där listan ska skapas dynamiskt
const listContainer = document.querySelector("#listContainer");
let listEl = null;

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
  formModeEl.textContent = "Skapar ny bil";
  saveBtn.textContent = "Spara";
  saveBtn.classList.remove("btn-success");
  saveBtn.classList.add("btn-primary");
}

function setEditMode(car) {
  idEl.value = car.id;
  brandEl.value = car.brand;
  regnrEl.value = car.regnr;
  colorEl.value = car.color;
  yearEl.value = car.year ?? "";

  formModeEl.textContent = `Redigerar bil #${car.id}`;
  saveBtn.textContent = "Uppdatera";
  saveBtn.classList.remove("btn-primary");
  saveBtn.classList.add("btn-success");
}

function borderColor(color) {
  return color || "#dee2e6";
}

async function loadCars() {
  const list = ensureListEl();
  list.innerHTML = `<div class="text-muted">Laddar...</div>`;

  try {
    const res = await fetch(`${API}/cars`);
    const cars = await res.json();

    if (!Array.isArray(cars) || cars.length === 0) {
      list.innerHTML = `<div class="alert alert-secondary mb-0">Inga bilar finns.</div>`;
      return;
    }

    list.innerHTML = "";

    cars.forEach((car) => {
      const card = document.createElement("div");
      card.className = "card shadow-sm";
      card.style.borderColor = borderColor(car.color);
      card.style.borderWidth = "2px";

      card.innerHTML = `
        <div class="card-body d-flex flex-column flex-md-row gap-3 align-items-start align-items-md-center">
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

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    id: idEl.value ? Number(idEl.value) : undefined,
    brand: brandEl.value.trim(),
    regnr: regnrEl.value.trim(),
    color: colorEl.value.trim(),
    year: yearEl.value ? Number(yearEl.value) : null,
  };

  const isEdit = Boolean(payload.id);

  const res = await fetch(`${API}/cars`, {
    method: isEdit ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
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

// start
setCreateMode();
loadCars();
