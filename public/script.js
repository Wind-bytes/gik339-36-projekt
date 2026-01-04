const API_URL = "http://localhost:3000/cars";

const carList = document.getElementById("carList");
const form = document.getElementById("carForm");

const brand = document.getElementById("brand");
const model = document.getElementById("model");
const year = document.getElementById("year");

let editingId = null; 

// LOAD LIST
function loadCars() {
    fetch(API_URL)
        .then(res => res.json())
        .then(cars => {
            carList.innerHTML = "";
            cars.forEach(createCarCard);
        });
}

// CREATE CARD
function createCarCard(car) {
    const div = document.createElement("div");
    div.className = "col-md-6 mb-3"; // Added margin for spacing

    div.innerHTML = `
        <div class="card shadow-sm">
            <div class="card-body">
                <h5>${car.brand} ${car.model}</h5>
                <p>Year: ${car.year}</p>
                <button class="btn btn-warning btn-sm me-2 edit-btn">Edit</button>
                <button class="btn btn-danger btn-sm delete-btn">Delete</button>
            </div>
        </div>
    `;

    // DELETE WITH PROMPT
    div.querySelector(".delete-btn").onclick = () => {
        // The Prompt: Confirmation before action
        const confirmed = confirm(`Are you sure you want to delete the ${car.brand}?`);
        
        if (confirmed) {
            fetch(`${API_URL}/${car.id}`, { method: "DELETE" })
                .then(() => {
                    alert("Success: Car deleted from database."); // Success notification
                    loadCars();
                })
                .catch(err => alert("Error: Could not delete car."));
        }
    };

    // EDIT
    div.querySelector(".edit-btn").onclick = () => {
        brand.value = car.brand;
        model.value = car.model;
        year.value = car.year;
        editingId = car.id;
        
        // Scroll to form so the user knows they are editing
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
        // Notification logic
        const message = editingId ? "Car successfully updated!" : "New car added!";
        alert(message); // The Success Prompt
        
        editingId = null;
        form.reset();
        loadCars();
    }).catch(err => {
        alert("Something went wrong saving the data.");
    });
});

// FEEDBACK MODAL (Optional helper)
function showMessage(text) {
    const modalElem = document.getElementById("feedbackModal");
    if(modalElem) {
        document.getElementById("modalMessage").innerText = text;
        new bootstrap.Modal(modalElem).show();
    }
}

// INITIAL LOAD
loadCars();

