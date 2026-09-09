const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos de la carpeta public
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Cargar catálogo de productos desde JSON
const getProductos = () => {
    const filePath = path.join(__dirname, 'data', 'productos.json');
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
};

// Endpoint principal para consultar productos en formato JSON
app.get('/api/productos', (req, res) => {
    try {
        let productos = getProductos();
        const { marca, categoria, maxPrecio, search } = req.query;

        if (marca) {
            productos = productos.filter(p => p.marca.toLowerCase() === marca.toLowerCase());
        }
        if (categoria) {
            productos = productos.filter(p => p.categoria.toLowerCase() === categoria.toLowerCase());
        }
        if (maxPrecio) {
            const max = parseFloat(maxPrecio);
            if (!isNaN(max)) {
                productos = productos.filter(p => p.precio <= max);
            }
        }
        if (search) {
            const term = search.toLowerCase();
            productos = productos.filter(p => 
                p.nombre.toLowerCase().includes(term) || 
                p.descripcion.toLowerCase().includes(term)
            );
        }

        res.json(productos);
    } catch (error) {
        console.error('Error al leer productos.json:', error);
        res.status(500).json({ error: 'Error al obtener el catálogo de productos' });
    }
});

// Endpoint de metadatos del servicio
app.get('/api/info', (req, res) => {
    res.json({
        nombre: "Catálogo de Comida Típica Ecuatoriana - Sabores del Ecuador",
        version: "1.0.0",
        status: "OK",
        despliegue: "Docker / Render"
    });
});

// Endpoint de verificación de salud (Health Check)
app.get('/health', (req, res) => {
    res.status(200).send("OK");
});

// Redirección por defecto al frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
