const API_URL = "http://localhost:3000/cars";

const carList = document.getElementById("carList");
const form = document.getElementById("carForm");
const brand = document.getElementById("brand");
const model = document.getElementById("model");
const year = document.getElementById("year");
const searchInput = document.getElementById("searchInput"); // För sökfunktionen
const totalCarsDisplay = document.getElementById("totalCars"); // För statistiken

let editingId = null; 
let allCars = []; // Sparar bilar här för att kunna filtrera i sökningen

// LOAD LIST
function loadCars() {
    fetch(API_URL)
        .then(res => res.json())
        .then(cars => {
            allCars = cars; // Spara ner bilar för sökfunktionen
            renderCars(cars);
        });
}

// RENDER FUNCTION (Skapar listan)
function renderCars(cars) {
    carList.innerHTML = "";
    cars.forEach(createCarCard);
    
    // Uppdatera dashboard-räknaren
    if (totalCarsDisplay) {
        totalCarsDisplay.innerText = cars.length;
    }
}

// CREATE CARD (Anpassad till den nya designen)
function createCarCard(car) {
    const div = document.createElement("div");
    div.className = "col-md-6 mb-3";

    div.innerHTML = `
        <div class="card car-card border-0 shadow-sm h-100">
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

    // DELETE WITH PROMPT
    div.querySelector(".delete-btn").onclick = () => {
        const confirmed = confirm(`Are you sure you want to delete the ${car.brand}?`);
        
        if (confirmed) {
            fetch(`${API_URL}/${car.id}`, { method: "DELETE" })
                .then(() => {
                    showMessage("Success: Car removed from garage.");
                    loadCars();
                })
                .catch(err => showMessage("Error: Could not delete car."));
        }
    };

    // EDIT
    div.querySelector(".edit-btn").onclick = () => {
        brand.value = car.brand;
        model.value = car.model;
        year.value = car.year;
        editingId = car.id;
        
        // Byt text på knappen så man ser att man editerar
        form.querySelector("button").innerHTML = '<i class="bi bi-check-circle me-1"></i> Update Car';
        form.querySelector("button").classList.replace("btn-primary", "btn-warning");

        form.scrollIntoView({ behavior: 'smooth' });
    };

    carList.appendChild(div);
}

// FORM SUBMIT (CREATE + UPDATE)
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
        const message = editingId ? "Car successfully updated!" : "New car added to garage!";
        showMessage(message);
        
        // Återställ formuläret
        editingId = null;
        form.reset();
        form.querySelector("button").innerHTML = '<i class="bi bi-plus-circle me-1"></i> Save Car';
        form.querySelector("button").classList.replace("btn-warning", "btn-primary");
        
        loadCars();
    }).catch(err => {
        showMessage("Something went wrong saving the data.");
    });
});


if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredCars = allCars.filter(car => 
            car.brand.toLowerCase().includes(searchTerm) || 
            car.model.toLowerCase().includes(searchTerm)
        );
        renderCars(filteredCars);
    });
}

// FEEDBACK MODAL (Uppdaterad för att använda Bootstrap-modaler)
function showMessage(text) {
    const modalElem = document.getElementById("feedbackModal");
    if(modalElem) {
        document.getElementById("modalMessage").innerText = text;
        const bsModal = new bootstrap.Modal(modalElem);
        bsModal.show();
    } else {
        alert(text); // Fallback om modalen saknas
    }
}

// INITIAL LOAD
loadCars();
