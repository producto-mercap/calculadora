// Rutas API para consumir datos externos
const express = require('express');
const router = express.Router();
const bcraService = require('../services/bcraService');
const feriadosService = require('../services/feriadosService');
const calculadoraController = require('../controllers/calculadoraController');

// Obtener datos de CER
router.get('/cer', async (req, res) => {
    try {
        const { desde, hasta } = req.query;

        if (!desde || !hasta) {
            return res.status(400).json({
                success: false,
                error: 'Parámetros "desde" y "hasta" son requeridos'
            });
        }

        const datos = await bcraService.obtenerCER(desde, hasta);

        res.json({
            success: true,
            datos
        });
    } catch (error) {
        console.error('Error en API CER:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obtener datos de TAMAR
router.get('/tamar', async (req, res) => {
    try {
        const { desde, hasta } = req.query;

        if (!desde || !hasta) {
            return res.status(400).json({
                success: false,
                error: 'Parámetros "desde" y "hasta" son requeridos'
            });
        }

        const datos = await bcraService.obtenerTAMAR(desde, hasta);

        res.json({
            success: true,
            datos
        });
    } catch (error) {
        console.error('Error en API TAMAR:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obtener datos de BADLAR
router.get('/badlar', async (req, res) => {
    try {
        const { desde, hasta } = req.query;

        if (!desde || !hasta) {
            return res.status(400).json({
                success: false,
                error: 'Parámetros "desde" y "hasta" son requeridos'
            });
        }

        const datos = await bcraService.obtenerBADLAR(desde, hasta);

        res.json({
            success: true,
            datos
        });
    } catch (error) {
        console.error('Error en API BADLAR:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Verificar y obtener Feriados desde BD (debe ir ANTES de /feriados/:anio para evitar conflictos)
router.get('/feriados/verificar', calculadoraController.verificarFeriados);
router.get('/feriados/bd', calculadoraController.obtenerFeriadosBD);
router.get('/feriados/fechas-existentes', calculadoraController.obtenerFechasExistentesFeriados);
router.post('/feriados/guardar', calculadoraController.guardarFeriados);
router.post('/feriados/nuevo', calculadoraController.guardarFeriadoIndividual);

// Obtener feriados de un año específico
router.get('/feriados/:anio', async (req, res) => {
    try {
        const { anio } = req.params;
        const anioNum = parseInt(anio, 10);

        // Validar que sea un año válido (entre 2000 y 2100)
        if (!anio || isNaN(anioNum) || anioNum < 2000 || anioNum > 2100) {
            return res.status(400).json({
                success: false,
                error: `Año inválido: ${anio}. Debe ser un número entre 2000 y 2100.`
            });
        }

        const datos = await feriadosService.obtenerFeriados(anioNum);

        res.json({
            success: true,
            datos
        });
    } catch (error) {
        console.error('Error en API Feriados:', error);
        // Si es 404, retornar array vacío en lugar de error
        if (error.response && error.response.status === 404) {
            return res.json({
                success: true,
                datos: []
            });
        }
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obtener feriados en un rango de fechas
router.get('/feriados', async (req, res) => {
    try {
        const { desde, hasta } = req.query;

        if (!desde || !hasta) {
            return res.status(400).json({
                success: false,
                error: 'Parámetros "desde" y "hasta" son requeridos'
            });
        }

        const datos = await feriadosService.obtenerFeriadosRango(desde, hasta);

        res.json({
            success: true,
            datos
        });
    } catch (error) {
        console.error('Error en API Feriados Rango:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Guardar calculadora
router.post('/calculadora/guardar', calculadoraController.guardarCalculadora);

// Listar calculadoras guardadas
router.get('/calculadora/listar', calculadoraController.listarCalculadoras);

// Obtener una calculadora específica
router.get('/calculadora/:titulo', calculadoraController.obtenerCalculadora);

// Eliminar una calculadora
router.delete('/calculadora/:titulo', calculadoraController.eliminarCalculadora);

// Verificar y obtener CER desde BD
router.get('/cer/verificar', calculadoraController.verificarCER);
router.get('/cer/bd', calculadoraController.obtenerCERBD);
router.get('/cer/fechas-existentes', calculadoraController.obtenerFechasExistentesCER);
router.post('/cer/guardar', calculadoraController.guardarCER);

// Verificar y obtener TAMAR desde BD
router.get('/tamar/verificar', calculadoraController.verificarTAMAR);
router.get('/tamar/bd', calculadoraController.obtenerTAMARBD);
router.get('/tamar/fechas-existentes', calculadoraController.obtenerFechasExistentesTAMAR);
router.post('/tamar/guardar', calculadoraController.guardarTAMAR);

// Verificar y obtener BADLAR desde BD
router.get('/badlar/verificar', calculadoraController.verificarBADLAR);
router.get('/badlar/bd', calculadoraController.obtenerBADLARBD);
router.get('/badlar/fechas-existentes', calculadoraController.obtenerFechasExistentesBADLAR);
router.post('/badlar/guardar', calculadoraController.guardarBADLAR);

module.exports = router;

