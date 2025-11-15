// JavaScript para la página Feriados

// Formatear fecha para mostrar (sin problemas de zona horaria)
function formatearFechaMostrar(fechaString) {
    if (!fechaString) return '';
    
    // Si viene en formato YYYY-MM-DD, parsear directamente sin crear Date
    if (typeof fechaString === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaString)) {
        const partes = fechaString.split('T')[0].split('-');
        const year = partes[0];
        const month = partes[1];
        const day = partes[2];
        return `${day}/${month}/${year}`;
    }
    
    // Si viene en otro formato, usar Date pero con métodos UTC
    const fecha = new Date(fechaString);
    const day = String(fecha.getUTCDate()).padStart(2, '0');
    const month = String(fecha.getUTCMonth() + 1).padStart(2, '0');
    const year = fecha.getUTCFullYear();
    return `${day}/${month}/${year}`;
}

// Cargar datos de Feriados desde la API
async function cargarFeriados() {
    try {
        const fechaDesde = document.getElementById('fechaDesdeFeriados')?.value;
        const fechaHasta = document.getElementById('fechaHastaFeriados')?.value;
        const btnCargar = document.getElementById('btnCargarFeriados');
        
        if (!fechaDesde || !fechaHasta) {
            showError('Por favor seleccione un rango de fechas');
            return;
        }
        
        if (new Date(fechaDesde) > new Date(fechaHasta)) {
            showError('La fecha "Desde" debe ser anterior a la fecha "Hasta"');
            return;
        }
        
        // Mostrar indicador de carga
        const textoOriginal = btnCargar.innerHTML;
        btnCargar.disabled = true;
        btnCargar.innerHTML = '<span>Cargando...</span>';
        
        // Ocultar tabla anterior si existe
        document.getElementById('feriadosTableContainer').style.display = 'none';
        document.getElementById('feriadosEmptyState').style.display = 'block';
        
        try {
            // Consultar API
            const response = await fetch(`/api/feriados?desde=${fechaDesde}&hasta=${fechaHasta}`);
            const result = await response.json();
            
            if (result.success && result.datos && result.datos.length > 0) {
                // Generar tabla
                generarTablaFeriados(result.datos);
                
                // Mostrar tabla y ocultar empty state
                document.getElementById('feriadosTableContainer').style.display = 'block';
                document.getElementById('feriadosEmptyState').style.display = 'none';
                
                showSuccess(`Se cargaron ${result.datos.length} feriados`);
            } else {
                document.getElementById('feriadosTableContainer').style.display = 'none';
                document.getElementById('feriadosEmptyState').style.display = 'block';
                document.getElementById('feriadosEmptyState').querySelector('.empty-state-text').textContent = 'No se encontraron feriados';
                document.getElementById('feriadosEmptyState').querySelector('.empty-state-subtext').textContent = result.error || 'No hay feriados disponibles para el rango seleccionado';
                showError(result.error || 'No se encontraron feriados para el rango seleccionado');
            }
        } catch (error) {
            console.error('Error al cargar feriados:', error);
            showError('Error al cargar datos: ' + error.message);
            
            document.getElementById('feriadosTableContainer').style.display = 'none';
            document.getElementById('feriadosEmptyState').style.display = 'block';
        } finally {
            // Restaurar botón
            btnCargar.disabled = false;
            btnCargar.innerHTML = textoOriginal;
        }
        
    } catch (error) {
        console.error('Error en cargarFeriados:', error);
        showError('Error al cargar feriados: ' + error.message);
    }
}

// Generar tabla de Feriados
function generarTablaFeriados(datos) {
    const tbody = document.getElementById('feriadosTableBody');
    tbody.innerHTML = '';
    
    // Ordenar datos por fecha (ascendente)
    const datosOrdenados = [...datos].sort((a, b) => {
        const fechaA = new Date(a.fecha);
        const fechaB = new Date(b.fecha);
        return fechaA - fechaB; // Orden ascendente
    });
    
    datosOrdenados.forEach(item => {
        const row = document.createElement('tr');
        
        // Extraer fecha (formato YYYY-MM-DD)
        let fecha = item.fecha || item.date || item;
        if (typeof fecha === 'string' && fecha.includes('T')) {
            fecha = fecha.split('T')[0];
        }
        
        // Extraer nombre
        const nombre = item.nombre || '';
        
        row.innerHTML = `
            <td>${formatearFechaMostrar(fecha)}</td>
            <td>${nombre}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Establecer fechas por defecto (año actual)
    const hoy = new Date();
    const inicioAno = new Date(hoy.getFullYear(), 0, 1);
    const finAno = new Date(hoy.getFullYear(), 11, 31);
    
    const fechaDesdeInput = document.getElementById('fechaDesdeFeriados');
    const fechaHastaInput = document.getElementById('fechaHastaFeriados');
    
    if (fechaDesdeInput && !fechaDesdeInput.value) {
        fechaDesdeInput.value = formatearFechaInput(inicioAno);
    }
    
    if (fechaHastaInput && !fechaHastaInput.value) {
        fechaHastaInput.value = formatearFechaInput(finAno);
    }
});

