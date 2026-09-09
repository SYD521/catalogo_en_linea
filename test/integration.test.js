const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

test('Validación de lógica de filtrado de catálogo', (t) => {
    const filePath = path.join(__dirname, '..', 'data', 'productos.json');
    const productos = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // 1. Filtro por marca
    const costeña = productos.filter(p => p.marca.toLowerCase() === 'tradición costeña');
    assert.ok(costeña.length > 0, 'Debe haber productos de Tradición Costeña');

    // 2. Filtro por categoría
    const sopas = productos.filter(p => p.categoria.toLowerCase() === 'sopas tradicionales');
    assert.ok(sopas.length > 0, 'Debe haber productos en Sopas Tradicionales');

    // 3. Filtro por precio máximo
    const baratas = productos.filter(p => p.precio <= 5.00);
    assert.ok(baratas.length > 0, 'Debe haber productos de <= $5.00');

    // Combinación de filtros
    const combinado = productos.filter(p => p.categoria.toLowerCase() === 'sopas tradicionales' && p.precio <= 6.00);
    assert.ok(combinado.length > 0, 'Debe haber sopas <= $6.00');
});

