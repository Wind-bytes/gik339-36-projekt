const API_URL = "http://localhost:3000/cars";

const carList = document.getElementById("carList");
const form = document.getElementById("carForm");
const brand = document.getElementById("brand");
const model = document.getElementById("model");
const year = document.getElementById("year");
const searchInput = document.getElementById("searchInput");
const totalCarsDisplay = document.getElementById("totalCars");

let editingId = null; 
let allCars = [];

// LOAD LIST
function loadCars() {
    fetch(API_URL)
        .then(res => res.json())
        .then(cars => {
            allCars = cars;
            renderCars(cars);
        })
        .catch(err => console.error("Kunde inte ladda bilar:", err));
}

// RENDER FUNCTION
function renderCars(cars) {
    carList.innerHTML = "";
    cars.forEach(car => createCarCard(car));
    
    if (totalCarsDisplay) {
        totalCarsDisplay.innerText = cars.length;
    }
}

// CREATE CARD (Nu med fungerande bild-logik)
function createCarCard(car) {
    const div = document.createElement("div");
    div.className = "col-md-6 col-lg-4 mb-3"; // Gjorde dem lite mindre så fler får plats

    // Skapar en söksträng för bilden. Vi lägger till "car" för att få relevanta träffar.
    // Vi använder en tjänst som heter LoremFlickr som är mer stabil för enkla projekt.
    const imageUrl = `https://loremflickr.com/400/250/${car.brand},${car.model},car/all`;

    div.innerHTML = `
        <div class="card car-card border-0 shadow-sm h-100 overflow-hidden">
            <img src="${imageUrl}" class="card-img-top" alt="${car.brand}" 
                 style="height: 180px; object-fit: cover; background: #e9ecef;">
            <div class="card-body">
                <span class="badge bg-primary-subtle text-primary mb-2">${car.year}</span>
                <h5 class="card-title fw-bold text-dark mb-1">${car.brand}</h5>
                <p class="card-text text-muted mb-3">${car.model}</p>
                <div class="d-flex gap-2">
                    <button class="btn btn-outline-primary btn-sm edit-btn">
                        <i class="bi bi-pencil-square"></i> Edit
                    </button>
                    <button class="btn btn-outline-danger btn-sm delete-btn">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `;

    // DELETE LOGIK
    div.querySelector(".delete-btn").onclick = () => {
        if (confirm(`Are you sure you want to delete the ${car.brand}?`)) {
            fetch(`${API_URL}/${car.id}`, { method: "DELETE" })
                .then(() => {
                    showMessage("Success: Car removed.");
                    loadCars();
                });
        }
    };

    // EDIT LOGIK
    div.querySelector(".edit-btn").onclick = () => {
        brand.value = car.brand;
        model.value = car.model;
        year.value = car.year;
        editingId = car.id;
        
        form.querySelector("button").innerHTML = '<i class="bi bi-check-circle me-1"></i> Update Car';
        form.querySelector("button").classList.replace("btn-primary", "btn-warning");
        form.scrollIntoView({ behavior: 'smooth' });
    };

    carList.appendChild(div);
}

// FORM SUBMIT
form.addEventListener("submit", e => {
    e.preventDefault();

    const car = {
        brand: brand.value,
        model: model.value,
        year: year.value
    };

    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `${API_URL}/${editingId}` : API_URL;

    fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(car)
    }).then(() => {
        showMessage(editingId ? "Car updated!" : "Car added!");
        
        editingId = null;
        form.reset();
        form.querySelector("button").innerHTML = '<i class="bi bi-plus-circle me-1"></i> Save Car';
        form.querySelector("button").classList.replace("btn-warning", "btn-primary");
        
        loadCars();
    }).catch(err => showMessage("Error saving car."));
});

// SEARCH
if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allCars.filter(c => 
            c.brand.toLowerCase().includes(term) || c.model.toLowerCase().includes(term)
        );
        renderCars(filtered);
    });
}

// MODAL MESSAGE
function showMessage(text) {
    const modalElem = document.getElementById("feedbackModal");
    if(modalElem) {
        document.getElementById("modalMessage").innerText = text;
        const bsModal = new bootstrap.Modal(modalElem);
        bsModal.show();
    }
}

loadCars();