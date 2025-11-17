// JavaScript para la página BADLAR
// Basado en cer.js, adaptado para BADLAR (id_variable = 7)

// Formatear fecha para mostrar (sin problemas de zona horaria - Argentina)
function formatearFechaMostrar(fechaString) {
    if (!fechaString) return '';
    
    if (typeof fechaString === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaString)) {
        const partes = fechaString.split('T')[0].split('-');
        const year = partes[0];
        const month = partes[1];
        const day = partes[2];
        return `${day}-${month}-${year}`;
    }
    
    const fecha = crearFechaDesdeString(fechaString);
    if (!fecha || isNaN(fecha.getTime())) return '';
    
    const day = String(fecha.getDate()).padStart(2, '0');
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const year = fecha.getFullYear();
    return `${day}-${month}-${year}`;
}

// Formatear número para mostrar
function formatearNumero(numero) {
    if (numero === null || numero === undefined) return '-';
    return parseFloat(numero).toLocaleString('es-AR', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4
    });
}

// Crear fecha desde string YYYY-MM-DD sin problemas de zona horaria
function crearFechaDesdeString(fechaString) {
    if (!fechaString) return null;
    if (typeof fechaString === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaString)) {
        const partes = fechaString.split('T')[0].split('-');
        const year = parseInt(partes[0], 10);
        const month = parseInt(partes[1], 10) - 1;
        const day = parseInt(partes[2], 10);
        return new Date(year, month, day);
    }
    return new Date(fechaString);
}

// Formatear fecha para input (YYYY-MM-DD) sin problemas de zona horaria
function formatearFechaInput(fecha) {
    if (!fecha) return '';
    if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return fecha;
    }
    const d = crearFechaDesdeString(fecha);
    if (!d || isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Cargar datos de BADLAR desde la API
async function cargarBADLAR() {
    try {
        const fechaDesdeDDMMAAAA = document.getElementById('fechaDesdeBADLAR')?.value;
        const fechaHastaDDMMAAAA = document.getElementById('fechaHastaBADLAR')?.value;
        const btnCargar = document.getElementById('btnCargarBADLAR');
        
        if (!fechaDesdeDDMMAAAA || !fechaHastaDDMMAAAA) {
            showError('Por favor seleccione un rango de fechas');
            return;
        }
        
        if (!validarFechaDDMMAAAA(fechaDesdeDDMMAAAA) || !validarFechaDDMMAAAA(fechaHastaDDMMAAAA)) {
            showError('Formato de fecha inválido. Use DD-MM-AAAA');
            return;
        }
        
        const fechaDesde = convertirFechaDDMMAAAAaYYYYMMDD(fechaDesdeDDMMAAAA);
        const fechaHasta = convertirFechaDDMMAAAAaYYYYMMDD(fechaHastaDDMMAAAA);
        
        const desdeDate = crearFechaDesdeString(fechaDesde);
        const hastaDate = crearFechaDesdeString(fechaHasta);
        
        if (!desdeDate || !hastaDate || desdeDate > hastaDate) {
            showError('La fecha "Desde" debe ser anterior a la fecha "Hasta"');
            return;
        }
        
        const textoOriginal = btnCargar.innerHTML;
        btnCargar.disabled = true;
        btnCargar.innerHTML = '<span>Cargando...</span>';
        
        const tableContainer = document.getElementById('badlarTableContainer');
        const tbody = document.getElementById('badlarTableBody');
        
        try {
            btnCargar.innerHTML = '<span>Cargando desde API...</span>';
            
            const response = await fetch(`/api/badlar?desde=${fechaDesde}&hasta=${fechaHasta}`);
            const result = await response.json();
            
            if (!result.success || !result.datos || result.datos.length === 0) {
                showError('No se pudieron obtener datos de la API');
                btnCargar.disabled = false;
                btnCargar.innerHTML = textoOriginal;
                return;
            }
            
            btnCargar.innerHTML = '<span>Guardando en BD...</span>';
            
            const responseGuardar = await fetch('/api/badlar/guardar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ datos: result.datos })
            });
            
            const resultGuardar = await responseGuardar.json();
            if (resultGuardar.success) {
                btnCargar.innerHTML = '<span>Cargando tabla...</span>';
                const responseBD = await fetch(`/api/badlar/bd?desde=${fechaDesde}&hasta=${fechaHasta}`);
                const resultBD = await responseBD.json();
                
                if (resultBD.success && resultBD.datos && resultBD.datos.length > 0) {
                    generarTablaBADLAR(resultBD.datos, false);
                    tableContainer.style.display = 'block';
                    showSuccess(`Se guardaron ${resultGuardar.actualizados} registros de BADLAR`);
                } else {
                    tableContainer.style.display = 'none';
                }
            } else {
                showError('Error al guardar datos: ' + (resultGuardar.error || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error al cargar BADLAR:', error);
            showError('Error al cargar datos: ' + error.message);
        } finally {
            btnCargar.disabled = false;
            btnCargar.innerHTML = textoOriginal;
        }
        
    } catch (error) {
        console.error('Error en cargarBADLAR:', error);
        showError('Error al cargar BADLAR: ' + error.message);
    }
}

// Generar tabla de BADLAR
function generarTablaBADLAR(datos, soloNuevos = false) {
    const tbody = document.getElementById('badlarTableBody');
    if (!tbody) return 0;
    
    if (!soloNuevos) {
        tbody.innerHTML = '';
        
        const datosOrdenados = [...datos].sort((a, b) => {
            const fechaA = crearFechaDesdeString(a.fecha);
            const fechaB = crearFechaDesdeString(b.fecha);
            return fechaB - fechaA;
        });
        
        let sumaValores = 0;
        let cantidadValores = 0;
        
        datosOrdenados.forEach(item => {
            let fecha = item.fecha;
            if (!fecha) return;
            if (typeof fecha === 'string' && fecha.includes('T')) {
                fecha = fecha.split('T')[0];
            }
            
            const valor = item.valor;
            if (valor === null || valor === undefined) return;
            
            sumaValores += parseFloat(valor);
            cantidadValores++;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatearFechaMostrar(fecha)}</td>
                <td style="text-align: right;">${formatearNumero(valor)}</td>
            `;
            tbody.appendChild(row);
        });
        
        // Agregar fila de promedio al final
        if (cantidadValores > 0) {
            const promedio = sumaValores / cantidadValores;
            const rowPromedio = document.createElement('tr');
            rowPromedio.style.background = '#f8f9fa';
            rowPromedio.style.fontWeight = '600';
            rowPromedio.innerHTML = `
                <td style="font-weight: 600; color: var(--text-primary);">Promedio</td>
                <td style="text-align: right; font-weight: 600; color: var(--primary-color);">${formatearNumero(promedio)}</td>
            `;
            tbody.appendChild(rowPromedio);
        }
        
        return datosOrdenados.length;
    }
    
    return 0;
}

// Convertir DD-MM-AAAA o DD/MM/AAAA a YYYY-MM-DD
function convertirFechaDDMMAAAAaYYYYMMDD(fechaDDMMAAAA) {
    if (!fechaDDMMAAAA) return '';
    const partes = fechaDDMMAAAA.split(/[-\/]/);
    if (partes.length !== 3) return '';
    const dia = partes[0].padStart(2, '0');
    const mes = partes[1].padStart(2, '0');
    const año = partes[2];
    return `${año}-${mes}-${dia}`;
}

// Convertir YYYY-MM-DD a DD-MM-AAAA
function convertirFechaYYYYMMDDaDDMMAAAA(fechaYYYYMMDD) {
    if (!fechaYYYYMMDD) return '';
    if (typeof fechaYYYYMMDD === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaYYYYMMDD)) {
        const partes = fechaYYYYMMDD.split('T')[0].split('-');
        return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
    return fechaYYYYMMDD;
}

// Validar formato DD-MM-AAAA o DD/MM/AAAA
function validarFechaDDMMAAAA(fecha) {
    if (!fecha) return false;
    const regex = /^(\d{2})[-\/](\d{2})[-\/](\d{4})$/;
    const match = fecha.match(regex);
    if (!match) return false;
    
    const dia = parseInt(match[1], 10);
    const mes = parseInt(match[2], 10);
    const año = parseInt(match[3], 10);
    
    if (mes < 1 || mes > 12) return false;
    if (dia < 1 || dia > 31) return false;
    if (año < 1900 || año > 2100) return false;
    
    const diasPorMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (mes === 2 && ((año % 4 === 0 && año % 100 !== 0) || año % 400 === 0)) {
        if (dia > 29) return false;
    } else {
        if (dia > diasPorMes[mes - 1]) return false;
    }
    
    return true;
}

// Aplicar máscara DD-MM-AAAA mientras se escribe
function aplicarMascaraFecha(input) {
    input.addEventListener('input', function(e) {
        let valor = e.target.value.replace(/\D/g, '');
        if (valor.length >= 2) {
            valor = valor.substring(0, 2) + '-' + valor.substring(2);
        }
        if (valor.length >= 5) {
            valor = valor.substring(0, 5) + '-' + valor.substring(5, 9);
        }
        e.target.value = valor;
    });
    
    input.addEventListener('blur', function(e) {
        if (e.target.value && !validarFechaDDMMAAAA(e.target.value)) {
            e.target.style.borderColor = '#d93025';
            showError('Formato de fecha inválido. Use DD-MM-AAAA');
        } else {
            e.target.style.borderColor = '';
        }
    });
}

// Abrir modal de intervalos
function abrirModalIntervalosBADLAR() {
    const modal = document.getElementById('modalIntervalosBADLAR');
    if (modal) {
        modal.style.display = 'flex';
        
        const fechaDesdeInput = document.getElementById('fechaDesdeBADLAR');
        const fechaHastaInput = document.getElementById('fechaHastaBADLAR');
        
        if (fechaDesdeInput && !fechaDesdeInput.value) {
            const hoy = new Date();
            const dia15 = new Date(hoy.getFullYear(), hoy.getMonth(), 15);
            fechaDesdeInput.value = convertirFechaYYYYMMDDaDDMMAAAA(formatearFechaInput(dia15));
        }
        
        if (fechaHastaInput && !fechaHastaInput.value) {
            const hoy = new Date();
            const dia15Siguiente = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 15);
            fechaHastaInput.value = convertirFechaYYYYMMDDaDDMMAAAA(formatearFechaInput(dia15Siguiente));
        }
    }
}

// Cerrar modal de intervalos
function cerrarModalIntervalosBADLAR() {
    const modal = document.getElementById('modalIntervalosBADLAR');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Confirmar y cargar BADLAR
async function confirmarCargarBADLAR() {
    cerrarModalIntervalosBADLAR();
    const btnCargar = document.getElementById('btnConfirmarCargarBADLAR');
    if (btnCargar) {
        btnCargar.disabled = true;
        btnCargar.innerHTML = 'Cargando...';
    }
    try {
        await cargarBADLAR();
        window.location.reload();
    } catch (error) {
        console.error('Error al cargar BADLAR:', error);
        if (btnCargar) {
            btnCargar.disabled = false;
            btnCargar.innerHTML = 'Cargar';
        }
    }
}

// Limpiar filtro BADLAR
function limpiarFiltroBADLAR() {
    const buscarDesdeInput = document.getElementById('buscarDesdeBADLAR');
    const buscarHastaInput = document.getElementById('buscarHastaBADLAR');
    
    if (buscarDesdeInput) buscarDesdeInput.value = '';
    if (buscarHastaInput) buscarHastaInput.value = '';
    
    const tbody = document.getElementById('badlarTableBody');
    if (tbody) {
        const filas = tbody.querySelectorAll('tr');
        filas.forEach(fila => {
            fila.style.display = '';
        });
    }
}

// Buscar BADLAR por intervalo
async function filtrarBADLARPorIntervalo() {
    const buscarDesdeInput = document.getElementById('buscarDesdeBADLAR');
    const buscarHastaInput = document.getElementById('buscarHastaBADLAR');
    
    if (!buscarDesdeInput || !buscarHastaInput) {
        return;
    }
    
    const fechaDesdeStr = buscarDesdeInput.value.trim();
    const fechaHastaStr = buscarHastaInput.value.trim();
    
    if (!fechaDesdeStr || !fechaHastaStr) {
        showError('Por favor complete ambas fechas');
        return;
    }
    
    if (!validarFechaDDMMAAAA(fechaDesdeStr) || !validarFechaDDMMAAAA(fechaHastaStr)) {
        showError('Formato de fecha inválido. Use DD-MM-AAAA');
        return;
    }
    
    const fechaDesdeYYYYMMDD = convertirFechaDDMMAAAAaYYYYMMDD(fechaDesdeStr);
    const fechaHastaYYYYMMDD = convertirFechaDDMMAAAAaYYYYMMDD(fechaHastaStr);
    
    if (fechaDesdeYYYYMMDD > fechaHastaYYYYMMDD) {
        showError('La fecha "Desde" debe ser anterior a la fecha "Hasta"');
        return;
    }
    
    const tableContainer = document.getElementById('badlarTableContainer');
    if (tableContainer) {
        tableContainer.style.display = 'block';
    }
    
    const tbody = document.getElementById('badlarTableBody');
    if (!tbody) {
        return;
    }
    
    tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; padding: 20px;">Buscando...</td></tr>';
    
    try {
        const response = await fetch(`/api/badlar/bd?desde=${fechaDesdeYYYYMMDD}&hasta=${fechaHastaYYYYMMDD}`);
        const result = await response.json();
        
        if (result.success && result.datos && result.datos.length > 0) {
            generarTablaBADLAR(result.datos, false);
        } else {
            tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; padding: 20px;">No se encontraron registros en el rango especificado</td></tr>';
        }
    } catch (error) {
        console.error('Error al buscar BADLAR:', error);
        tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; padding: 20px; color: red;">Error al buscar datos</td></tr>';
        showError('Error al buscar datos: ' + error.message);
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    const fechaDesdeInput = document.getElementById('fechaDesdeBADLAR');
    const fechaHastaInput = document.getElementById('fechaHastaBADLAR');
    
    if (fechaDesdeInput) {
        aplicarMascaraFecha(fechaDesdeInput);
    }
    
    if (fechaHastaInput) {
        aplicarMascaraFecha(fechaHastaInput);
    }
    
    // Verificar si hay fechas guardadas en sessionStorage para auto-filtrar
    const fechaDesde = sessionStorage.getItem('badlar_fechaDesde');
    const fechaHasta = sessionStorage.getItem('badlar_fechaHasta');
    const autoFiltrar = sessionStorage.getItem('badlar_autoFiltrar');
    
    if (fechaDesde && fechaHasta && autoFiltrar === 'true') {
        const buscarDesdeInput = document.getElementById('buscarDesdeBADLAR');
        const buscarHastaInput = document.getElementById('buscarHastaBADLAR');
        
        if (buscarDesdeInput && buscarHastaInput) {
            buscarDesdeInput.value = fechaDesde;
            buscarHastaInput.value = fechaHasta;
            
            // Limpiar sessionStorage
            sessionStorage.removeItem('badlar_fechaDesde');
            sessionStorage.removeItem('badlar_fechaHasta');
            sessionStorage.removeItem('badlar_autoFiltrar');
            
            // Ejecutar el filtro automáticamente después de un pequeño delay
            setTimeout(() => {
                if (typeof filtrarBADLARPorIntervalo === 'function') {
                    filtrarBADLARPorIntervalo();
                }
            }, 300);
        }
    }
    
    const modal = document.getElementById('modalIntervalosBADLAR');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                cerrarModalIntervalosBADLAR();
            }
        });
    }
    
    const buscarDesdeInput = document.getElementById('buscarDesdeBADLAR');
    const buscarHastaInput = document.getElementById('buscarHastaBADLAR');
    
    if (buscarDesdeInput) {
        aplicarMascaraFecha(buscarDesdeInput);
    }
    
    if (buscarHastaInput) {
        aplicarMascaraFecha(buscarHastaInput);
    }
    
    // Si hay datos iniciales, mostrar tabla
    if (window.badlarDatos && window.badlarDatos.length > 0) {
        const tableContainer = document.getElementById('badlarTableContainer');
        if (tableContainer) {
            tableContainer.style.display = 'block';
            generarTablaBADLAR(window.badlarDatos);
        }
    }
});

// Cambiar página de BADLAR
async function cambiarPaginaBADLAR(nuevaPagina) {
    if (nuevaPagina < 1 || (window.badlarTotalPaginas && nuevaPagina > window.badlarTotalPaginas)) {
        return;
    }
    
    try {
        const tbody = document.getElementById('badlarTableBody');
        tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; padding: 20px;">Cargando...</td></tr>';
        
        const response = await fetch(`/api/badlar/bd?pagina=${nuevaPagina}&porPagina=${window.badlarPorPagina || 50}`);
        const result = await response.json();
        
        if (result.success && result.datos) {
            window.badlarPaginaActual = result.pagina;
            window.badlarTotalPaginas = result.totalPaginas;
            window.badlarTotal = result.total;
            
            generarTablaBADLAR(result.datos);
            window.location.href = `/badlar?pagina=${nuevaPagina}`;
        } else {
            throw new Error(result.error || 'Error al cargar datos');
        }
    } catch (error) {
        console.error('Error al cambiar página:', error);
        showError('Error al cargar página: ' + error.message);
    }
}
