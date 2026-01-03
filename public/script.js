const url = 'http://localhost:3000/cars';

function showModal(title, message) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    const modal = new bootstrap.Modal(document.getElementById('feedbackModal'));
    modal.show();
}

// Sanitize text to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function fetchCarImage(brand, model, year) {
    try {
        const params = new URLSearchParams({ brand, model, year: year || '' });
        const response = await fetch(`http://localhost:3000/api/car-image?${params}`);
        
        if (response.ok) {
            const data = await response.json();
            return data.imageUrl;
        }
        return null;
    } catch (error) {
        console.error('Image fetch error:', error);
        return null;
    }
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

        for (const car of data) {
            const li = document.createElement('li');
            li.className = "list-group-item d-flex justify-content-between align-items-center flex-wrap";
            
            // Safely create content
            const infoSpan = document.createElement('span');
            infoSpan.textContent = `${car.brand} ${car.model} (${car.color}, ${car.year})`;
            
            const buttonDiv = document.createElement('div');
            buttonDiv.innerHTML = `
                <button class="btn btn-warning btn-sm me-2" data-action="edit" data-id="${car.id}">Edit</button>
                <button class="btn btn-danger btn-sm" data-action="delete" data-id="${car.id}">Delete</button>
            `;
            
            li.appendChild(infoSpan);
            li.appendChild(buttonDiv);
            
            // Create placeholder for image
            const imageContainer = document.createElement('div');
            imageContainer.className = 'w-100 mt-2';
            imageContainer.innerHTML = '<small class="text-muted">Loading image...</small>';
            li.appendChild(imageContainer);
            
            listElement.appendChild(li);
            
            // Fetch image asynchronously
            fetchCarImage(car.brand, car.model, car.year).then(imageUrl => {
                if (imageUrl) {
                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.alt = `${car.brand} ${car.model}`;
                    img.style.maxWidth = '200px';
                    img.style.marginTop = '10px';
                    imageContainer.innerHTML = '';
                    imageContainer.appendChild(img);
                } else {
                    imageContainer.innerHTML = '<small class="text-muted">No image available</small>';
                }
            });
            
            // Add event listeners
            buttonDiv.querySelector('[data-action="edit"]').addEventListener('click', () => {
                editCar(car.id, car.brand, car.model, car.color, car.year);
            });
            
            buttonDiv.querySelector('[data-action="delete"]').addEventListener('click', () => {
                deleteCar(car.id);
            });
        }
    } catch (error) {
        console.error("Fetch error:", error);
        showModal('Error', 'Failed to load cars');
    }
}

document.getElementById('carForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('carId').value;
    const carData = {
        brand: document.getElementById('brand').value.trim(),
        model: document.getElementById('model').value.trim(),
        color: document.getElementById('color').value.trim(),
        year: parseInt(document.getElementById('year').value) || null
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
            const errorData = await response.json();
            showModal('Error', errorData.error || 'Failed to save car');
        }
    } catch (error) {
        console.error('Error:', error);
        showModal('Error', 'Failed to save car');
    }
});

async function deleteCar(id) {
    if (!confirm('Are you sure you want to delete this car?')) {
        return;
    }
    
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

function editCar(id, brand, model, color, year) {
    document.getElementById('carId').value = id;
    document.getElementById('brand').value = brand;
    document.getElementById('model').value = model;
    document.getElementById('color').value = color;
    document.getElementById('year').value = year;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

getAllCars();