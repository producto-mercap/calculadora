// Rutas para la calculadora
const express = require('express');
const router = express.Router();
const calculadoraController = require('../controllers/calculadoraController');

// Ruta principal - redirige a calculadora CER
router.get('/', (req, res) => {
    res.redirect('/calculadora-cer');
});

// Rutas de las diferentes calculadoras y páginas
router.get('/calculadora-cer', calculadoraController.renderCalculadoraCER);
router.get('/calculadora-variable', calculadoraController.renderCalculadoraVariable);
router.get('/cer', calculadoraController.renderCER);
router.get('/tamar', calculadoraController.renderTAMAR);
router.get('/badlar', calculadoraController.renderBADLAR);
router.get('/feriados', calculadoraController.renderFeriados);

// Ruta para calcular TIR
router.post('/calcular-tir', calculadoraController.calcularTIR);

module.exports = router;

