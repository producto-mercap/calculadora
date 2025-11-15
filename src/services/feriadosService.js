// Servicio para consumir API de feriados
const axios = require('axios');

const FERIADOS_API_URL = process.env.FERIADOS_API_URL || 'https://nolaborables.com.ar/api/v2/feriados';

/**
 * Obtener feriados de un año específico
 * @param {number} anio - Año a consultar
 * @returns {Promise<Array>} Array con feriados del año
 */
const obtenerFeriados = async (anio) => {
    try {
        const response = await axios.get(`${FERIADOS_API_URL}/${anio}`);
        return response.data || [];
    } catch (error) {
        console.error('Error al obtener feriados:', error.message);
        throw new Error('No se pudo obtener datos de feriados');
    }
};

/**
 * Verificar si una fecha es feriado
 * @param {string} fecha - Fecha a verificar (formato: YYYY-MM-DD)
 * @param {Array} feriados - Array de feriados
 * @returns {boolean} True si es feriado
 */
const esFeriado = (fecha, feriados) => {
    return feriados.some(feriado => feriado.fecha === fecha);
};

module.exports = {
    obtenerFeriados,
    esFeriado
};

