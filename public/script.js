const url = 'http://localhost:3000/cars';

async function getAllCars() {
    try {
        const response = await fetch('http://localhost:3000/cars');
        const data = await response.json();

        // Check if data is an array before using forEach
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
                <span>${car.brand} ${car.model}</span>
                <button class="btn btn-danger btn-sm" onclick="deleteCar(${car.id})">Delete</button>
            `;
            listElement.appendChild(li);
        });
    } catch (error) {
        console.error("Fetch error:", error);
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

    if (id) {
        method = 'PUT';
        fetchUrl = `${url}/${id}`;
    }

    await fetch(fetchUrl, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(carData)
    });

    document.getElementById('carForm').reset();
    document.getElementById('carId').value = ''; 
    getAllCars();
});

async function deleteCar(id) {
    await fetch(`${url}/${id}`, { method: 'DELETE' });
    getAllCars();
}

window.editCar = (id, brand, model, color, year) => {
    document.getElementById('carId').value = id;
    document.getElementById('brand').value = brand;
    document.getElementById('model').value = model;
    document.getElementById('color').value = color;
    document.getElementById('year').value = year;
};
getAllCars();