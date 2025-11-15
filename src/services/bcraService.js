// Servicio para consumir API del BCRA
const axios = require('axios');

const BCRA_API_URL = process.env.BCRA_API_URL || 'https://api.bcra.gob.ar/estadisticas/v2.0';

/**
 * Obtener datos de CER desde BCRA
 * @param {string} fechaDesde - Fecha desde (formato: YYYY-MM-DD)
 * @param {string} fechaHasta - Fecha hasta (formato: YYYY-MM-DD)
 * @returns {Promise<Array>} Array con datos de CER
 */
const obtenerCER = async (fechaDesde, fechaHasta) => {
    try {
        const response = await axios.get(`${BCRA_API_URL}/dato/CER`, {
            params: {
                desde: fechaDesde,
                hasta: fechaHasta
            }
        });

        return response.data.results || [];
    } catch (error) {
        console.error('Error al obtener CER desde BCRA:', error.message);
        throw new Error('No se pudo obtener datos de CER');
    }
};

/**
 * Obtener datos de TAMAR desde BCRA
 * @param {string} fechaDesde - Fecha desde (formato: YYYY-MM-DD)
 * @param {string} fechaHasta - Fecha hasta (formato: YYYY-MM-DD)
 * @returns {Promise<Array>} Array con datos de TAMAR
 */
const obtenerTAMAR = async (fechaDesde, fechaHasta) => {
    try {
        const response = await axios.get(`${BCRA_API_URL}/dato/TAMAR`, {
            params: {
                desde: fechaDesde,
                hasta: fechaHasta
            }
        });

        return response.data.results || [];
    } catch (error) {
        console.error('Error al obtener TAMAR desde BCRA:', error.message);
        throw new Error('No se pudo obtener datos de TAMAR');
    }
};

/**
 * Obtener datos de BADLAR desde BCRA
 * @param {string} fechaDesde - Fecha desde (formato: YYYY-MM-DD)
 * @param {string} fechaHasta - Fecha hasta (formato: YYYY-MM-DD)
 * @returns {Promise<Array>} Array con datos de BADLAR
 */
const obtenerBADLAR = async (fechaDesde, fechaHasta) => {
    try {
        const response = await axios.get(`${BCRA_API_URL}/dato/BADLAR`, {
            params: {
                desde: fechaDesde,
                hasta: fechaHasta
            }
        });

        return response.data.results || [];
    } catch (error) {
        console.error('Error al obtener BADLAR desde BCRA:', error.message);
        throw new Error('No se pudo obtener datos de BADLAR');
    }
};

module.exports = {
    obtenerCER,
    obtenerTAMAR,
    obtenerBADLAR
};

