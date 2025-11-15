// JavaScript para la página CER

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

// Formatear número para mostrar
function formatearNumero(numero) {
    if (numero === null || numero === undefined) return '-';
    return parseFloat(numero).toLocaleString('es-AR', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4
    });
}

// Cargar datos de CER desde la API
async function cargarCER() {
    try {
        const fechaDesde = document.getElementById('fechaDesdeCER')?.value;
        const fechaHasta = document.getElementById('fechaHastaCER')?.value;
        const btnCargar = document.getElementById('btnCargarCER');
        
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
        document.getElementById('cerTableContainer').style.display = 'none';
        document.getElementById('cerEmptyState').style.display = 'block';
        
        try {
            // Consultar API
            const response = await fetch(`/api/cer?desde=${fechaDesde}&hasta=${fechaHasta}`);
            const result = await response.json();
            
            if (result.success && result.datos && result.datos.length > 0) {
                // Generar tabla
                generarTablaCER(result.datos);
                
                // Mostrar tabla y ocultar empty state
                document.getElementById('cerTableContainer').style.display = 'block';
                document.getElementById('cerEmptyState').style.display = 'none';
                
                showSuccess(`Se cargaron ${result.datos.length} registros de CER`);
            } else {
                document.getElementById('cerTableContainer').style.display = 'none';
                document.getElementById('cerEmptyState').style.display = 'block';
                document.getElementById('cerEmptyState').querySelector('.empty-state-text').textContent = 'No se encontraron datos';
                document.getElementById('cerEmptyState').querySelector('.empty-state-subtext').textContent = result.error || 'No hay datos disponibles para el rango seleccionado';
                showError(result.error || 'No se encontraron datos para el rango seleccionado');
            }
        } catch (error) {
            console.error('Error al cargar CER:', error);
            showError('Error al cargar datos: ' + error.message);
            
            document.getElementById('cerTableContainer').style.display = 'none';
            document.getElementById('cerEmptyState').style.display = 'block';
        } finally {
            // Restaurar botón
            btnCargar.disabled = false;
            btnCargar.innerHTML = textoOriginal;
        }
        
    } catch (error) {
        console.error('Error en cargarCER:', error);
        showError('Error al cargar CER: ' + error.message);
    }
}

// Generar tabla de CER
function generarTablaCER(datos) {
    const tbody = document.getElementById('cerTableBody');
    tbody.innerHTML = '';
    
    // Ordenar datos por fecha (descendente - más reciente primero)
    const datosOrdenados = [...datos].sort((a, b) => {
        const fechaA = new Date(a.fecha);
        const fechaB = new Date(b.fecha);
        return fechaB - fechaA; // Orden descendente
    });
    
    datosOrdenados.forEach(item => {
        const row = document.createElement('tr');
        
        // Extraer fecha (formato YYYY-MM-DD)
        let fecha = item.fecha;
        if (!fecha) {
            console.warn('Item sin fecha:', item);
            return;
        }
        if (typeof fecha === 'string' && fecha.includes('T')) {
            fecha = fecha.split('T')[0];
        }
        
        // Extraer valor CER
        const valor = item.valor;
        if (valor === null || valor === undefined) {
            console.warn('Item sin valor:', item);
            return;
        }
        
        row.innerHTML = `
            <td>${formatearFechaMostrar(fecha)}</td>
            <td style="text-align: right;">${formatearNumero(valor)}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Establecer fechas por defecto (último año)
    const hoy = new Date();
    const haceUnAno = new Date();
    haceUnAno.setFullYear(hoy.getFullYear() - 1);
    
    const fechaDesdeInput = document.getElementById('fechaDesdeCER');
    const fechaHastaInput = document.getElementById('fechaHastaCER');
    
    if (fechaDesdeInput && !fechaDesdeInput.value) {
        fechaDesdeInput.value = formatearFechaInput(haceUnAno);
    }
    
    if (fechaHastaInput && !fechaHastaInput.value) {
        fechaHastaInput.value = formatearFechaInput(hoy);
    }
});

