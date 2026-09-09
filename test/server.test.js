const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const http = require('http');

const app = require('../server.js');

test('Validación del catálogo JSON (data/productos.json)', (t) => {
    const filePath = path.join(__dirname, '..', 'data', 'productos.json');
    assert.strictEqual(fs.existsSync(filePath), true, 'El archivo data/productos.json debe existir');

    const content = fs.readFileSync(filePath, 'utf8');
    const productos = JSON.parse(content);

    assert.ok(Array.isArray(productos), 'Los productos deben ser un arreglo');
    assert.ok(productos.length >= 10 && productos.length <= 20, `Debe contener entre 10 y 15+ productos (actual: ${productos.length})`);

    productos.forEach((p, index) => {
        assert.ok(p.nombre, `Producto en índice ${index} debe tener nombre`);
        assert.ok(p.marca, `Producto en índice ${index} debe tener marca`);
        assert.ok(p.categoria, `Producto en índice ${index} debe tener categoria`);
        assert.ok(typeof p.precio === 'number' && p.precio > 0, `Producto en índice ${index} debe tener precio numérico positivo`);
        assert.ok(p.imagen, `Producto en índice ${index} debe tener enlace a imagen`);
    });
});

