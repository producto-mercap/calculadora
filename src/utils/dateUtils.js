// Utilidades para manejo de fechas en zona horaria de Argentina (America/Argentina/Buenos_Aires, UTC-3)

/**
 * Crear fecha desde string YYYY-MM-DD en zona horaria de Argentina
 * Evita problemas de conversión UTC que cambian el día
 */
function crearFechaArgentina(fechaString) {
    if (!fechaString) return null;
    
    // Si viene en formato YYYY-MM-DD, parsear directamente
    if (typeof fechaString === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaString)) {
        const partes = fechaString.split('T')[0].split('-');
        const year = parseInt(partes[0], 10);
        const month = parseInt(partes[1], 10) - 1; // Los meses en JS son 0-11
        const day = parseInt(partes[2], 10);
        
        // Crear fecha en hora local de Argentina (sin conversión UTC)
        return new Date(year, month, day);
    }
    
    // Si es un objeto Date, crear uno nuevo con los componentes locales
    if (fechaString instanceof Date) {
        return new Date(fechaString.getFullYear(), fechaString.getMonth(), fechaString.getDate());
    }
    
    return new Date(fechaString);
}

/**
 * Formatear fecha a string YYYY-MM-DD en zona horaria de Argentina
 */
function formatearFechaArgentina(fecha) {
    if (!fecha) return '';
    
    const d = crearFechaArgentina(fecha);
    if (!d || isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * Formatear fecha para mostrar (DD/MM/YYYY) en zona horaria de Argentina
 */
function formatearFechaMostrarArgentina(fecha) {
    if (!fecha) return '';
    
    const d = crearFechaArgentina(fecha);
    if (!d || isNaN(d.getTime())) return '';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
}

/**
 * Comparar dos fechas (retorna -1, 0, o 1)
 */
function compararFechas(fecha1, fecha2) {
    const d1 = crearFechaArgentina(fecha1);
    const d2 = crearFechaArgentina(fecha2);
    
    if (!d1 || !d2) return 0;
    
    // Comparar solo año, mes y día (sin hora)
    const time1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()).getTime();
    const time2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()).getTime();
    
    if (time1 < time2) return -1;
    if (time1 > time2) return 1;
    return 0;
}

/**
 * Obtener fecha actual en zona horaria de Argentina
 */
function fechaActualArgentina() {
    const ahora = new Date();
    return new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
}

module.exports = {
    crearFechaArgentina,
    formatearFechaArgentina,
    formatearFechaMostrarArgentina,
    compararFechas,
    fechaActualArgentina
};

