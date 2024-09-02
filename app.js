// Variables globales
let db;

window.onload = () => {
    // Abrir o crear la base de datos
    let request = window.indexedDB.open("FlowerDB", 1);

    request.onerror = (event) => {
        console.error("Error al abrir la base de datos:", event);
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        console.log("Base de datos abierta:", db);

        // Cargar las flores almacenadas
        loadFlowers();
    };

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        let objectStore = db.createObjectStore("flowers", { keyPath: "id", autoIncrement: true });

        objectStore.createIndex("flowerName", "flowerName", { unique: false });
        objectStore.createIndex("packageQuantity", "packageQuantity", { unique: false });
        objectStore.createIndex("description", "description", { unique: false });
        objectStore.createIndex("dateTime", "dateTime", { unique: false });
        console.log("Base de datos creada y configurada.");
    };

    // Manejar el formulario
    document.getElementById("form").onsubmit = (event) => {
        event.preventDefault();
        let flowerName = document.getElementById("flowerName").value;
        let packageQuantity = document.getElementById("packageQuantity").value;
        let description = document.getElementById("description").value;
        let dateTime = document.getElementById("dateTime").value;

        addFlower(flowerName, packageQuantity, description, dateTime);
    };

    // Exportar a Excel
    document.getElementById("exportExcel").onclick = () => {
        exportToExcel();
    };

    // Buscar en la tabla
    document.getElementById("search").onkeyup = () => {
        searchTable();
    };
};

// Función para agregar una flor
function addFlower(flowerName, packageQuantity, description, dateTime) {
    let transaction = db.transaction(["flowers"], "readwrite");
    let objectStore = transaction.objectStore("flowers");

    let request = objectStore.add({ flowerName, packageQuantity, description, dateTime });

    request.onsuccess = () => {
        document.getElementById("flowerName").value = "";
        document.getElementById("packageQuantity").value = "";
        document.getElementById("description").value = "";
        document.getElementById("dateTime").value = "";
        loadFlowers();
    };

    request.onerror = (event) => {
        console.error("Error al agregar la flor:", event);
    };
}

// Función para cargar las flores
function loadFlowers() {
    let transaction = db.transaction(["flowers"], "readonly");
    let objectStore = transaction.objectStore("flowers");

    let flowerList = document.getElementById("flowerList");
    flowerList.innerHTML = "";

    objectStore.openCursor().onsuccess = (event) => {
        let cursor = event.target.result;

        if (cursor) {
            let tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${cursor.value.id}</td>
                <td>${cursor.value.flowerName}</td>
                <td>${cursor.value.packageQuantity}</td>
                <td>${cursor.value.description}</td>
                <td>${cursor.value.dateTime}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editFlower(${cursor.value.id}, '${cursor.value.flowerName}', ${cursor.value.packageQuantity}, '${cursor.value.description}', '${cursor.value.dateTime}')">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteFlower(${cursor.value.id})">Eliminar</button>
                </td>
            `;
            flowerList.appendChild(tr);

            cursor.continue();
        }
    };
}


// Función para editar una flor (abrir modal)
function editFlower(id, flowerName, packageQuantity, description, dateTime) {
    document.getElementById("editId").value = id;
    document.getElementById("editFlowerName").value = flowerName;
    document.getElementById("editPackageQuantity").value = packageQuantity;
    document.getElementById("editDescription").value = description;
    document.getElementById("editDateTime").value = dateTime;
    new bootstrap.Modal(document.getElementById("editModal")).show();
}

// Función para guardar los cambios de edición
function saveChanges() {
    let id = parseInt(document.getElementById("editId").value);
    let flowerName = document.getElementById("editFlowerName").value;
    let packageQuantity = document.getElementById("editPackageQuantity").value;
    let description = document.getElementById("editDescription").value;
    let dateTime = document.getElementById("editDateTime").value;

    let transaction = db.transaction(["flowers"], "readwrite");
    let objectStore = transaction.objectStore("flowers");

    let request = objectStore.put({ id, flowerName, packageQuantity, description, dateTime });

    request.onsuccess = () => {
        loadFlowers();
        document.getElementById("editModal").querySelector(".btn-close").click();
    };

    request.onerror = (event) => {
        console.error("Error al guardar los cambios:", event);
    };
}

// Función para eliminar una flor
function deleteFlower(id) {
    let transaction = db.transaction(["flowers"], "readwrite");
    let objectStore = transaction.objectStore("flowers");

    let request = objectStore.delete(id);

    request.onsuccess = () => {
        loadFlowers();
    };

    request.onerror = (event) => {
        console.error("Error al eliminar la flor:", event);
    };
}

// Función para buscar en la tabla
function searchTable() {
    let filter = document.getElementById("search").value.toLowerCase();
    let rows = document.getElementById("flowerList").getElementsByTagName("tr");

    Array.from(rows).forEach(row => {
        let columns = row.getElementsByTagName("td");
        let match = false;

        Array.from(columns).forEach(column => {
            if (column.textContent.toLowerCase().includes(filter)) {
                match = true;
            }
        });

        if (match) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
}

// Función para exportar a Excel
function exportToExcel() {
    let table = document.getElementById("flowerTable");
    let wb = XLSX.utils.table_to_book(table, { sheet: "Flores" });
    XLSX.writeFile(wb, "flores.xlsx");
}
