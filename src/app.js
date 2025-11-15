// Módulos nativos de Node
const path = require('path');

// Dependencias de terceros
const express = require('express');
require('dotenv').config();

// Módulos propios
const calculadoraRoutes = require('./routes/calculadoraRoutes');
const apiRoutes = require('./routes/apiRoutes');

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.use('/', calculadoraRoutes);
app.use('/api', apiRoutes);

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).render('pages/404', {
        title: 'Página no encontrada',
        activeMenu: ''
    });
});

// Manejo de errores generales
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
    });
});

// Iniciar servidor solo en desarrollo
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
}

// Exportar para Vercel
module.exports = app;

