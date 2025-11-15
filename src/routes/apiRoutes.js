// Rutas API para consumir datos externos
const express = require('express');
const router = express.Router();
const bcraService = require('../services/bcraService');
const feriadosService = require('../services/feriadosService');

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

// Obtener feriados
router.get('/feriados/:anio', async (req, res) => {
    try {
        const { anio } = req.params;

        if (!anio || isNaN(anio)) {
            return res.status(400).json({
                success: false,
                error: 'Año inválido'
            });
        }

        const datos = await feriadosService.obtenerFeriados(parseInt(anio));

        res.json({
            success: true,
            datos
        });
    } catch (error) {
        console.error('Error en API Feriados:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;

