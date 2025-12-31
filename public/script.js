const url = 'http://localhost:3000/cars';

function showModal(title, message) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    const modal = new bootstrap.Modal(document.getElementById('feedbackModal'));
    modal.show();
}

async function getAllCars() {
    try {
        const response = await fetch('http://localhost:3000/cars');
        const data = await response.json();

        if (!Array.isArray(data)) {
            console.error("Expected array but got:", data);
            return;
        }

        const listElement = document.getElementById('carList');
        listElement.innerHTML = '';

        data.forEach(car => {
            const li = document.createElement('li');
            li.className = "list-group-item d-flex justify-content-between align-items-center";
            li.innerHTML = `
                <span>${car.brand} ${car.model} (${car.color}, ${car.year})</span>
                <div>
                    <button class="btn btn-warning btn-sm me-2" onclick="editCar(${car.id}, '${car.brand}', '${car.model}', '${car.color}', ${car.year})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCar(${car.id})">Delete</button>
                </div>
            `;
            listElement.appendChild(li);
        });
    } catch (error) {
        console.error("Fetch error:", error);
        showModal('Error', 'Failed to load cars');
    }
}

document.getElementById('carForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('carId').value;
    const carData = {
        brand: document.getElementById('brand').value,
        model: document.getElementById('model').value,
        color: document.getElementById('color').value,
        year: document.getElementById('year').value
    };

    let method = 'POST';
    let fetchUrl = url;
    let successMessage = '';

    if (id) {
        method = 'PUT';
        fetchUrl = `${url}/${id}`;
        successMessage = `Car "${carData.brand} ${carData.model}" updated successfully!`;
    } else {
        successMessage = `Car "${carData.brand} ${carData.model}" created successfully!`;
    }

    try {
        const response = await fetch(fetchUrl, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(carData)
        });

        if (response.ok) {
            showModal('Success', successMessage);
            document.getElementById('carForm').reset();
            document.getElementById('carId').value = ''; 
            getAllCars();
        } else {
            showModal('Error', 'Failed to save car');
        }
    } catch (error) {
        console.error('Error:', error);
        showModal('Error', 'Failed to save car');
    }
});

async function deleteCar(id) {
    try {
        const response = await fetch(`${url}/${id}`, { method: 'DELETE' });
        
        if (response.ok) {
            showModal('Success', 'Car deleted successfully!');
            getAllCars();
        } else {
            showModal('Error', 'Failed to delete car');
        }
    } catch (error) {
        console.error('Error:', error);
        showModal('Error', 'Failed to delete car');
    }
}

window.editCar = (id, brand, model, color, year) => {
    document.getElementById('carId').value = id;
    document.getElementById('brand').value = brand;
    document.getElementById('model').value = model;
    document.getElementById('color').value = color;
    document.getElementById('year').value = year;
};

getAllCars();