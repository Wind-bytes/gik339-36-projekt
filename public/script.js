const API_URL = "http://localhost:3000/cars";

const carList = document.getElementById("carList");
const form = document.getElementById("carForm");

const brand = document.getElementById("brand");
const model = document.getElementById("model");
const year = document.getElementById("year");

let editingId = null; //  track edit state

// LOAD LIST (KRAV: alltid aktuell data)
function loadCars() {
    fetch(API_URL)
        .then(res => res.json())
        .then(cars => {
            carList.innerHTML = "";
            cars.forEach(createCarCard);
        });
}

// CREATE CARD (LIST + BUTTONS)
function createCarCard(car) {
    const div = document.createElement("div");
    div.className = "col-md-6";

    div.innerHTML = `
        <div class="card">
            <div class="card-body">
                <h5>${car.brand} ${car.model}</h5>
                <p>Year: ${car.year}</p>

                <button class="btn btn-warning btn-sm me-2">Edit</button>
                <button class="btn btn-danger btn-sm">Delete</button>
            </div>
        </div>
    `;

    // DELETE
    div.querySelector(".btn-danger").onclick = () => {
        fetch(`${API_URL}/${car.id}`, { method: "DELETE" })
            .then(() => {
                showMessage("Car deleted");
                loadCars();
            });
    };

    // EDIT
    div.querySelector(".btn-warning").onclick = () => {
        brand.value = car.brand;
        model.value = car.model;
        year.value = car.year;
        editingId = car.id;
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
        showMessage(editingId ? "Car updated" : "Car added");
        editingId = null;
        form.reset();
        loadCars();
    });
});

// FEEDBACK MODAL 
function showMessage(text) {
    document.getElementById("modalMessage").innerText = text;
    new bootstrap.Modal(document.getElementById("feedbackModal")).show();
}

// INITIAL LOAD
loadCars();

