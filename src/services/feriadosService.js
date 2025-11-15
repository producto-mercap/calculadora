// Servicio para consumir API de feriados
const axios = require('axios');

const FERIADOS_API_URL = process.env.FERIADOS_API_URL || 'https://api.argentinadatos.com/v1/feriados';

/**
 * Obtener feriados de un año específico
 * @param {number} anio - Año a consultar
 * @returns {Promise<Array>} Array con feriados del año
 */
const obtenerFeriados = async (anio) => {
    try {
        const response = await axios.get(`${FERIADOS_API_URL}/${anio}`);
        // La API devuelve un array de objetos con: fecha, tipo, nombre
        const datos = response.data || [];
        
        // Validar y normalizar formato
        return datos.map(feriado => {
            // Si es un objeto con fecha, tipo y nombre, devolverlo tal cual
            if (feriado && typeof feriado === 'object' && feriado.fecha) {
                return {
                    fecha: feriado.fecha,
                    tipo: feriado.tipo || '',
                    nombre: feriado.nombre || ''
                };
            }
            // Si viene como string de fecha
            if (typeof feriado === 'string') {
                return { fecha: feriado, tipo: '', nombre: '' };
            }
            // Si tiene otros campos, intentar normalizar
            return {
                fecha: feriado.fecha || feriado.date || feriado,
                tipo: feriado.tipo || '',
                nombre: feriado.nombre || ''
            };
        });
    } catch (error) {
        console.error(`Error al obtener feriados para año ${anio}:`, error.message);
        throw new Error(`No se pudo obtener datos de feriados para el año ${anio}`);
    }
};

/**
 * Obtener feriados en un rango de años (particionado desde 2020)
 * @param {string} fechaDesde - Fecha desde (formato: YYYY-MM-DD)
 * @param {string} fechaHasta - Fecha hasta (formato: YYYY-MM-DD)
 * @returns {Promise<Array>} Array con todos los feriados en el rango
 */
const obtenerFeriadosRango = async (fechaDesde, fechaHasta) => {
    try {
        const fechaDesdeDate = new Date(fechaDesde);
        const fechaHastaDate = new Date(fechaHasta);
        
        // Asegurar que la fecha desde sea al menos 2020-01-01
        const fechaMinima = new Date('2020-01-01');
        const fechaInicio = fechaDesdeDate < fechaMinima ? fechaMinima : fechaDesdeDate;
        
        const todosLosFeriados = [];
        let añoActual = fechaInicio.getFullYear();
        const añoFin = fechaHastaDate.getFullYear();
        
        // Particionar por años
        while (añoActual <= añoFin) {
            try {
                const feriadosAño = await obtenerFeriados(añoActual);
                todosLosFeriados.push(...feriadosAño);
                
                // Pequeña pausa entre llamadas
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`Error al obtener feriados para año ${añoActual}:`, error.message);
                // Continuar con el siguiente año aunque falle uno
            }
            
            añoActual++;
        }
        
        // Filtrar feriados dentro del rango y eliminar duplicados
        const feriadosFiltrados = todosLosFeriados
            .filter((feriado, index, self) => {
                const fechaFeriado = feriado.fecha;
                if (!fechaFeriado) return false;
                
                const fechaFeriadoDate = new Date(fechaFeriado);
                
                // Verificar que esté en el rango
                if (fechaFeriadoDate < fechaInicio || fechaFeriadoDate > fechaHastaDate) {
                    return false;
                }
                
                // Eliminar duplicados por fecha
                return index === self.findIndex(f => f.fecha === fechaFeriado);
            })
            .map(feriado => ({
                fecha: feriado.fecha,
                tipo: feriado.tipo || '',
                nombre: feriado.nombre || ''
            }));
        
        return feriadosFiltrados;
    } catch (error) {
        console.error('Error al obtener feriados en rango:', error.message);
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
    if (!fecha || !feriados || feriados.length === 0) return false;
    
    // Normalizar fecha a formato YYYY-MM-DD
    const fechaNormalizada = typeof fecha === 'string' && fecha.includes('-') 
        ? fecha.split('T')[0] 
        : formatearFecha(fecha);
    
    return feriados.some(feriado => {
        const fechaFeriado = feriado.fecha || feriado.date || feriado;
        const fechaFeriadoNormalizada = typeof fechaFeriado === 'string' && fechaFeriado.includes('-')
            ? fechaFeriado.split('T')[0]
            : formatearFecha(fechaFeriado);
        
        return fechaFeriadoNormalizada === fechaNormalizada;
    });
};

/**
 * Verificar si una fecha es fin de semana
 * @param {Date} fecha - Fecha a verificar
 * @returns {boolean} True si es sábado o domingo
 */
const esFinDeSemana = (fecha) => {
    const dia = fecha.getDay();
    return dia === 0 || dia === 6; // 0 = domingo, 6 = sábado
};

/**
 * Formatear fecha a YYYY-MM-DD
 */
const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const d = new Date(fecha);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

module.exports = {
    obtenerFeriados,
    obtenerFeriadosRango,
    esFeriado,
    esFinDeSemana
};
