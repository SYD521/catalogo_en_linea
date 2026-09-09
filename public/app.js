// Estado global de la aplicación
let allProducts = [];
let filteredProducts = [];

// Elementos del DOM
const catalogGrid = document.getElementById('catalogGrid');
const noResults = document.getElementById('noResults');
const resultsCount = document.getElementById('resultsCount');

// Filtros
const selectMarca = document.getElementById('selectMarca');
const selectCategoria = document.getElementById('selectCategoria');
const rangePrecio = document.getElementById('rangePrecio');
const priceDisplay = document.getElementById('priceDisplay');
const searchInput = document.getElementById('searchInput');
const btnClearSearch = document.getElementById('btnClearSearch');
const selectSort = document.getElementById('selectSort');
const btnReset = document.getElementById('btnReset');
const btnResetEmpty = document.getElementById('btnResetEmpty');
const categoryPills = document.getElementById('categoryPills');

// Modal
const productModal = document.getElementById('productModal');
const modalContent = document.getElementById('modalContent');
const btnCloseModal = document.getElementById('btnCloseModal');

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    setupEventListeners();
});

// Obtener productos desde la API JSON
async function fetchProducts() {
    try {
        const response = await fetch('/api/productos');
        if (!response.ok) throw new Error('Error en la respuesta del servidor');
        allProducts = await response.json();
        
        populateFilterOptions();
        applyFilters();
    } catch (error) {
        console.error('Error al obtener productos:', error);
        catalogGrid.innerHTML = `
            <div class="no-results" style="grid-column: 1 / -1;">
                <div class="no-results-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
                <h3>Ocurrió un error al cargar el catálogo</h3>
                <p>Asegúrate de que el servidor Node.js esté en ejecución.</p>
            </div>
        `;
    }
}

// Poblar opciones únicas de Marca y Categoría en los Selects y Pills
function populateFilterOptions() {
    // 1. Extraer marcas únicas
    const marcas = [...new Set(allProducts.map(p => p.marca))].sort();
    selectMarca.innerHTML = '<option value="">Todas las marcas</option>';
    marcas.forEach(marca => {
        const opt = document.createElement('option');
        opt.value = marca;
        opt.textContent = marca;
        selectMarca.appendChild(opt);
    });

    // 2. Extraer categorías únicas
    const categorias = [...new Set(allProducts.map(p => p.categoria))].sort();
    selectCategoria.innerHTML = '<option value="">Todas las categorías</option>';
    categorias.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        selectCategoria.appendChild(opt);
    });

    // Crear pills rápidas de categoría
    categoryPills.innerHTML = '<button class="pill-btn active" data-category="">Todos</button>';
    categorias.forEach(cat => {
        const pill = document.createElement('button');
        pill.className = 'pill-btn';
        pill.dataset.category = cat;
        pill.textContent = cat;
        categoryPills.appendChild(pill);
    });

    // 3. Ajustar slider de precio acorde al valor máximo real
    const maxCatalogPrice = Math.ceil(Math.max(...allProducts.map(p => p.precio)));
    rangePrecio.max = maxCatalogPrice;
    rangePrecio.value = maxCatalogPrice;
    priceDisplay.textContent = `$${maxCatalogPrice.toFixed(2)}`;
}

// Configurar Event Listeners para filtrado en tiempo real
function setupEventListeners() {
    // Filtros de entrada
    selectMarca.addEventListener('change', applyFilters);
    selectCategoria.addEventListener('change', (e) => {
        syncCategoryPills(e.target.value);
        applyFilters();
    });
    
    rangePrecio.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        priceDisplay.textContent = `$${val.toFixed(2)}`;
        applyFilters();
    });

    searchInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        btnClearSearch.style.display = val ? 'block' : 'none';
        applyFilters();
    });

    btnClearSearch.addEventListener('click', () => {
        searchInput.value = '';
        btnClearSearch.style.display = 'none';
        applyFilters();
    });

    selectSort.addEventListener('change', applyFilters);

    // Event Delegation para Pills de Categoría
    categoryPills.addEventListener('click', (e) => {
        if (e.target.classList.contains('pill-btn')) {
            const cat = e.target.dataset.category;
            selectCategoria.value = cat;
            syncCategoryPills(cat);
            applyFilters();
        }
    });

    // Resetear filtros
    btnReset.addEventListener('click', resetFilters);
    btnResetEmpty.addEventListener('click', resetFilters);

    // Cerrar modal
    btnCloseModal.addEventListener('click', closeModal);
    productModal.addEventListener('click', (e) => {
        if (e.target === productModal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

// Sincronizar pill activa con el select de categoría
function syncCategoryPills(selectedCategory) {
    const pills = categoryPills.querySelectorAll('.pill-btn');
    pills.forEach(pill => {
        if (pill.dataset.category === selectedCategory) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });
}

// Aplicar Filtros en Tiempo Real
function applyFilters() {
    const marcaVal = selectMarca.value.toLowerCase();
    const catVal = selectCategoria.value.toLowerCase();
    const maxPrecioVal = parseFloat(rangePrecio.value);
    const searchVal = searchInput.value.toLowerCase();
    const sortVal = selectSort.value;

    filteredProducts = allProducts.filter(product => {
        // 1. Filtro por marca
        const matchMarca = !marcaVal || product.marca.toLowerCase() === marcaVal;
        
        // 2. Filtro por categoría
        const matchCategoria = !catVal || product.categoria.toLowerCase() === catVal;
        
        // 3. Filtro por precio máximo
        const matchPrecio = product.precio <= maxPrecioVal;
        
        // 4. Búsqueda por texto (nombre o descripción)
        const matchSearch = !searchVal || 
            product.nombre.toLowerCase().includes(searchVal) || 
            product.descripcion.toLowerCase().includes(searchVal) ||
            product.region.toLowerCase().includes(searchVal);

        return matchMarca && matchCategoria && matchPrecio && matchSearch;
    });

    // Ordenar resultados
    sortProducts(sortVal);

    // Renderizar tarjeta e información de conteo
    renderCatalog();
}

// Ordenar lista de productos
function sortProducts(sortType) {
    switch (sortType) {
        case 'price-asc':
            filteredProducts.sort((a, b) => a.precio - b.precio);
            break;
        case 'price-desc':
            filteredProducts.sort((a, b) => b.precio - a.precio);
            break;
        case 'name-asc':
            filteredProducts.sort((a, b) => a.nombre.localeCompare(b.nombre));
            break;
        default:
            // Por defecto mantendremos el orden del JSON (ID)
            filteredProducts.sort((a, b) => a.id - b.id);
            break;
    }
}

// Renderizar Tarjetas en el Grid
function renderCatalog() {
    resultsCount.innerHTML = `Mostrando <strong>${filteredProducts.length}</strong> de <strong>${allProducts.length}</strong> platillos disponibles`;

    if (filteredProducts.length === 0) {
        catalogGrid.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }

    catalogGrid.style.display = 'grid';
    noResults.style.display = 'none';

    catalogGrid.innerHTML = filteredProducts.map(product => `
        <article class="product-card">
            <div class="card-image-wrapper">
                <img src="${product.imagen}" alt="${product.nombre}" class="card-image" loading="lazy" 
                     onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';">
                <span class="brand-badge-tag"><i class="fa-solid fa-award"></i> ${escapeHTML(product.marca)}</span>
                <span class="region-tag">${escapeHTML(product.region)}</span>
            </div>
            <div class="card-body">
                <span class="category-tag">${escapeHTML(product.categoria)}</span>
                <h3 class="product-title">${escapeHTML(product.nombre)}</h3>
                <p class="product-desc">${escapeHTML(product.descripcion)}</p>
                <div class="card-footer">
                    <span class="product-price">$${product.precio.toFixed(2)}</span>
                    <button class="btn-details" onclick="openModal(${product.id})">
                        Ver Detalles <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        </article>
    `).join('');
}

// Restablecer todos los filtros
function resetFilters() {
    selectMarca.value = '';
    selectCategoria.value = '';
    syncCategoryPills('');
    
    const maxCatalogPrice = Math.ceil(Math.max(...allProducts.map(p => p.precio)));
    rangePrecio.value = maxCatalogPrice;
    priceDisplay.textContent = `$${maxCatalogPrice.toFixed(2)}`;
    
    searchInput.value = '';
    btnClearSearch.style.display = 'none';
    selectSort.value = 'default';
    
    applyFilters();
}

// Modal de detalles
window.openModal = function(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    modalContent.innerHTML = `
        <div class="modal-body-grid">
            <img src="${product.imagen}" alt="${product.nombre}" class="modal-img"
                 onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';">
            <div class="modal-info">
                <span class="category-tag"><i class="fa-solid fa-utensils"></i> ${escapeHTML(product.categoria)}</span>
                <h2>${escapeHTML(product.nombre)}</h2>
                <div class="modal-meta-list">
                    <div class="modal-meta-item">
                        <i class="fa-solid fa-award"></i> <strong>Marca:</strong> ${escapeHTML(product.marca)}
                    </div>
                    <div class="modal-meta-item">
                        <i class="fa-solid fa-earth-americas"></i> <strong>Región de origen:</strong> ${escapeHTML(product.region)}
                    </div>
                </div>
                <p class="product-desc" style="display: block; -webkit-line-clamp: initial;">${escapeHTML(product.descripcion)}</p>
                <div class="modal-price-tag">$${product.precio.toFixed(2)} USD</div>
            </div>
        </div>
    `;

    productModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

function closeModal() {
    productModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Función auxiliar de escape XSS
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

