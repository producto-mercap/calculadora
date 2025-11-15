// Servicio para consumir API del BCRA
const axios = require('axios');
const https = require('https');

const BCRA_API_URL = process.env.BCRA_API_URL || 'https://api.bcra.gob.ar/estadisticas/v3.0';

/**
 * Obtener datos de CER desde BCRA
 * La API solo permite consultar 1 año a la vez, por lo que se particiona la consulta
 * @param {string} fechaDesde - Fecha desde (formato: YYYY-MM-DD)
 * @param {string} fechaHasta - Fecha hasta (formato: YYYY-MM-DD)
 * @returns {Promise<Array>} Array con datos de CER
 */
const obtenerCER = async (fechaDesde, fechaHasta) => {
    try {
        const fechaDesdeDate = new Date(fechaDesde);
        const fechaHastaDate = new Date(fechaHasta);
        
        // Asegurar que la fecha desde sea al menos 2020-01-01
        const fechaMinima = new Date('2020-01-01');
        const fechaInicio = fechaDesdeDate < fechaMinima ? fechaMinima : fechaDesdeDate;
        
        const todosLosDatos = [];
        let añoActual = fechaInicio.getFullYear();
        const añoFin = fechaHastaDate.getFullYear();
        
        // Particionar por años (máximo 1 año por consulta)
        while (añoActual <= añoFin) {
            // Calcular fecha inicio del año
            let desdeAño = añoActual === fechaInicio.getFullYear() 
                ? `${añoActual}-01-01` 
                : `${añoActual}-01-01`;
            
            // Calcular fecha fin del año (o fechaHasta si es el último año)
            let hastaAño = añoActual === añoFin
                ? fechaHasta
                : `${añoActual}-12-31`;
            
            try {
                const response = await axios.get(`${BCRA_API_URL}/monetarias/30`, {
                    params: {
                        desde: desdeAño,
                        hasta: hastaAño
                    },
                    // Configurar para ignorar problemas de certificado SSL
                    httpsAgent: new https.Agent({
                        rejectUnauthorized: false
                    })
                });

                // La API devuelve: { results: [{ idVariable: 30, fecha: "YYYY-MM-DD", valor: number }] }
                const datos = response.data?.results || [];
                
                if (Array.isArray(datos) && datos.length > 0) {
                    // Normalizar datos: extraer fecha y valor
                    const datosNormalizados = datos.map(item => ({
                        fecha: item.fecha,
                        valor: item.valor,
                        idVariable: item.idVariable
                    }));
                    todosLosDatos.push(...datosNormalizados);
                }
                
                // Pequeña pausa entre llamadas para no saturar la API
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`Error al obtener CER para año ${añoActual}:`, error.message);
                // Continuar con el siguiente año aunque falle uno
            }
            
            añoActual++;
        }

        // Ordenar por fecha y eliminar duplicados
        const datosUnicos = todosLosDatos
            .filter((item, index, self) => 
                index === self.findIndex(t => t.fecha === item.fecha)
            )
            .sort((a, b) => {
                const fechaA = new Date(a.fecha);
                const fechaB = new Date(b.fecha);
                return fechaB - fechaA; // Orden descendente (más reciente primero)
            });

        return datosUnicos;
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

