// JavaScript para la página Feriados

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

// Formatear fecha para mostrar (sin problemas de zona horaria - Argentina)
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
    
    // Si viene en otro formato, crear fecha local (Argentina)
    const fecha = crearFechaDesdeString(fechaString);
    if (!fecha || isNaN(fecha.getTime())) return '';
    
    const day = String(fecha.getDate()).padStart(2, '0');
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const year = fecha.getFullYear();
    return `${day}/${month}/${year}`;
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

// Calcular rangos de fechas faltantes para feriados (OPTIMIZADO - no recorre día por día)
function calcularRangosFaltantesFeriados(fechaDesde, fechaHasta, fechasExistentes) {
    const rangos = [];
    
    // Parsear fechas sin problemas de zona horaria
    const desde = crearFechaDesdeString(fechaDesde);
    const hasta = crearFechaDesdeString(fechaHasta);
    
    if (!desde || !hasta || desde > hasta) {
        return [];
    }
    
    // Calcular rangos por año (la API de feriados requiere particionar por año)
    const añoInicio = desde.getFullYear();
    const añoFin = hasta.getFullYear();
    
    for (let año = añoInicio; año <= añoFin; año++) {
        const inicioAño = año === añoInicio ? desde : new Date(año, 0, 1);
        const finAño = año === añoFin ? hasta : new Date(año, 11, 31);
        
        // Verificación rápida: verificar solo algunas fechas clave del año
        // (inicio, medio del año, fin) en lugar de recorrer día por día
        const inicioStr = formatearFechaInput(inicioAño);
        const finStr = formatearFechaInput(finAño);
        const medioAño = new Date(año, 5, 15); // 15 de junio
        const medioStr = formatearFechaInput(medioAño);
        
        // Si alguna de las fechas clave no existe, agregar el año
        if (!fechasExistentes.has(inicioStr) || 
            !fechasExistentes.has(finStr) || 
            !fechasExistentes.has(medioStr)) {
            rangos.push({ año: año });
        }
    }
    
    return rangos;
}

// Convertir DD/MM/AAAA a YYYY-MM-DD
function convertirFechaDDMMAAAAaYYYYMMDD(fechaDDMMAAAA) {
    if (!fechaDDMMAAAA) return '';
    const partes = fechaDDMMAAAA.split('/');
    if (partes.length !== 3) return '';
    const dia = partes[0].padStart(2, '0');
    const mes = partes[1].padStart(2, '0');
    const año = partes[2];
    return `${año}-${mes}-${dia}`;
}

// Convertir YYYY-MM-DD a DD/MM/AAAA
function convertirFechaYYYYMMDDaDDMMAAAA(fechaYYYYMMDD) {
    if (!fechaYYYYMMDD) return '';
    if (typeof fechaYYYYMMDD === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaYYYYMMDD)) {
        const partes = fechaYYYYMMDD.split('T')[0].split('-');
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return fechaYYYYMMDD;
}

// Validar formato DD/MM/AAAA
function validarFechaDDMMAAAA(fecha) {
    if (!fecha) return false;
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
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

// Aplicar máscara DD/MM/AAAA mientras se escribe
function aplicarMascaraFecha(input) {
    input.addEventListener('input', function(e) {
        let valor = e.target.value.replace(/\D/g, '');
        if (valor.length >= 2) {
            valor = valor.substring(0, 2) + '/' + valor.substring(2);
        }
        if (valor.length >= 5) {
            valor = valor.substring(0, 5) + '/' + valor.substring(5, 9);
        }
        e.target.value = valor;
    });
    
    input.addEventListener('blur', function(e) {
        if (e.target.value && !validarFechaDDMMAAAA(e.target.value)) {
            e.target.style.borderColor = '#d93025';
            showError('Formato de fecha inválido. Use DD/MM/AAAA');
        } else {
            e.target.style.borderColor = '';
        }
    });
}

// Cargar datos de Feriados desde la API
async function cargarFeriados() {
    try {
        const fechaDesdeDDMMAAAA = document.getElementById('fechaDesdeFeriados')?.value;
        const fechaHastaDDMMAAAA = document.getElementById('fechaHastaFeriados')?.value;
        const btnCargar = document.getElementById('btnCargarFeriados');
        
        if (!fechaDesdeDDMMAAAA || !fechaHastaDDMMAAAA) {
            showError('Por favor seleccione un rango de fechas');
            return;
        }
        
        // Validar formato
        if (!validarFechaDDMMAAAA(fechaDesdeDDMMAAAA) || !validarFechaDDMMAAAA(fechaHastaDDMMAAAA)) {
            showError('Formato de fecha inválido. Use DD/MM/AAAA');
            return;
        }
        
        // Convertir DD/MM/AAAA a YYYY-MM-DD para la API
        const fechaDesde = convertirFechaDDMMAAAAaYYYYMMDD(fechaDesdeDDMMAAAA);
        const fechaHasta = convertirFechaDDMMAAAAaYYYYMMDD(fechaHastaDDMMAAAA);
        
        const desdeDate = crearFechaDesdeString(fechaDesde);
        const hastaDate = crearFechaDesdeString(fechaHasta);
        
        if (!desdeDate || !hastaDate || desdeDate > hastaDate) {
            showError('La fecha "Desde" debe ser anterior a la fecha "Hasta"');
            return;
        }
        
        // Mostrar indicador de carga
        const textoOriginal = btnCargar.innerHTML;
        btnCargar.disabled = true;
        btnCargar.innerHTML = '<span>Cargando...</span>';
        
        // NO ocultar la tabla - mantenerla visible
        const tableContainer = document.getElementById('feriadosTableContainer');
        const emptyState = document.getElementById('feriadosEmptyState');
        const tbody = document.getElementById('feriadosTableBody');
        const tieneDatosEnTabla = tbody && tbody.querySelectorAll('tr').length > 0;
        
        try {
            // Llamado directo a la API (sin verificar fechas existentes)
            btnCargar.innerHTML = '<span>Cargando desde API...</span>';
            
            // Calcular años del rango
            const desdeDate = crearFechaDesdeString(fechaDesde);
            const hastaDate = crearFechaDesdeString(fechaHasta);
            const añoInicio = desdeDate.getFullYear();
            const añoFin = hastaDate.getFullYear();
            
            // Consultar API para cada año en paralelo
            const promesas = [];
            for (let año = añoInicio; año <= añoFin; año++) {
                promesas.push(
                    fetch(`/api/feriados/${año}`)
                        .then(res => res.json())
                        .then(result => result.success && result.datos ? result.datos : [])
                        .catch(error => {
                            console.error(`Error al cargar año ${año}:`, error);
                            return [];
                        })
                );
            }
            
            btnCargar.innerHTML = `<span>Cargando ${añoFin - añoInicio + 1} año(s)...</span>`;
            
            const resultados = await Promise.all(promesas);
            const todosLosDatos = resultados.flat();
            
            // Filtrar solo los datos dentro del rango
            const datosEnRango = todosLosDatos.filter(item => {
                const fechaItem = crearFechaDesdeString(item.fecha);
                return fechaItem >= desdeDate && fechaItem <= hastaDate;
            });
            
            if (datosEnRango.length === 0) {
                showError('No se pudieron obtener datos de la API');
                btnCargar.disabled = false;
                btnCargar.innerHTML = textoOriginal;
                return;
            }
            
            // Guardar todos los datos (sobreescribir si existen)
            btnCargar.innerHTML = '<span>Guardando en BD...</span>';
            
            const responseGuardar = await fetch('/api/feriados/guardar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ datos: datosEnRango })
            });
            
            const resultGuardar = await responseGuardar.json();
            if (resultGuardar.success) {
                // Cargar datos desde BD para mostrar en tabla
                btnCargar.innerHTML = '<span>Cargando tabla...</span>';
                const responseBD = await fetch(`/api/feriados/bd?desde=${fechaDesde}&hasta=${fechaHasta}`);
                const resultBD = await responseBD.json();
                
                if (resultBD.success && resultBD.datos && resultBD.datos.length > 0) {
                    generarTablaFeriados(resultBD.datos, false);
                    tableContainer.style.display = 'block';
                    emptyState.style.display = 'none';
                    showSuccess(`Se guardaron ${resultGuardar.actualizados} feriados`);
                } else {
                    tableContainer.style.display = 'none';
                    emptyState.style.display = 'block';
                }
            } else {
                showError('Error al guardar datos: ' + (resultGuardar.error || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error al cargar feriados:', error);
            showError('Error al cargar datos: ' + error.message);
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

// Inicializar inputs de fecha con formato DD/MM/AAAA
document.addEventListener('DOMContentLoaded', () => {
    const fechaDesdeInput = document.getElementById('fechaDesdeFeriados');
    const fechaHastaInput = document.getElementById('fechaHastaFeriados');
    
    // Aplicar máscara a los inputs
    if (fechaDesdeInput) {
        aplicarMascaraFecha(fechaDesdeInput);
        // Inicializar con fecha por defecto (15 del mes actual)
        if (!fechaDesdeInput.value) {
            const hoy = new Date();
            const dia15 = new Date(hoy.getFullYear(), hoy.getMonth(), 15);
            fechaDesdeInput.value = convertirFechaYYYYMMDDaDDMMAAAA(formatearFechaInput(dia15));
        }
    }
    
    if (fechaHastaInput) {
        aplicarMascaraFecha(fechaHastaInput);
        // Inicializar con fecha por defecto (15 del mes siguiente)
        if (!fechaHastaInput.value) {
            const hoy = new Date();
            const dia15Siguiente = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 15);
            fechaHastaInput.value = convertirFechaYYYYMMDDaDDMMAAAA(formatearFechaInput(dia15Siguiente));
        }
    }
});

// Obtener fechas que ya están en la tabla
function obtenerFechasEnTablaFeriados() {
    const tbody = document.getElementById('feriadosTableBody');
    const fechas = new Set();
    
    if (tbody) {
        const filas = tbody.querySelectorAll('tr');
        filas.forEach(fila => {
            const celdaFecha = fila.querySelector('td:first-child');
            if (celdaFecha) {
                // Convertir formato DD/MM/YYYY a YYYY-MM-DD
                const textoFecha = celdaFecha.textContent.trim();
                const partes = textoFecha.split('/');
                if (partes.length === 3) {
                    const fechaNormalizada = `${partes[2]}-${partes[1]}-${partes[0]}`;
                    fechas.add(fechaNormalizada);
                }
            }
        });
    }
    
    return fechas;
}

// Agregar fila nueva a la tabla (manteniendo orden ascendente)
function agregarFilaFeriados(item, tbody) {
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
    
    // Insertar en orden ascendente
    const filas = Array.from(tbody.querySelectorAll('tr'));
    let insertado = false;
    
    for (let i = 0; i < filas.length; i++) {
        const celdaFecha = filas[i].querySelector('td:first-child');
        if (celdaFecha) {
            const textoFecha = celdaFecha.textContent.trim();
            const partes = textoFecha.split('/');
            if (partes.length === 3) {
                const fechaFila = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
                const fechaNueva = new Date(fecha);
                
                // Orden descendente: insertar si la fecha nueva es mayor (más reciente)
                if (fechaNueva > fechaFila) {
                    tbody.insertBefore(row, filas[i]);
                    insertado = true;
                    break;
                }
            }
        }
    }
    
    if (!insertado) {
        tbody.appendChild(row);
    }
    
    return row;
}

// Generar tabla de Feriados (solo si está vacía) o agregar solo nuevos registros (OPTIMIZADO)
function generarTablaFeriados(datos, soloNuevos = false) {
    const tbody = document.getElementById('feriadosTableBody');
    if (!tbody) return 0;
    
    if (!soloNuevos) {
        // Si no es solo nuevos, limpiar y regenerar toda la tabla
        tbody.innerHTML = '';
        
        // Ordenar datos por fecha (descendente - más reciente primero)
        const datosOrdenados = [...datos].sort((a, b) => {
            const fechaA = crearFechaDesdeString(a.fecha);
            const fechaB = crearFechaDesdeString(b.fecha);
            return fechaB - fechaA; // Orden descendente
        });
        
        // Agregar todas las filas de una vez (más eficiente)
        datosOrdenados.forEach(item => {
            let fecha = item.fecha || item.date || item;
            if (typeof fecha === 'string' && fecha.includes('T')) {
                fecha = fecha.split('T')[0];
            }
            
            const nombre = item.nombre || '';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatearFechaMostrar(fecha)}</td>
                <td>${nombre}</td>
            `;
            tbody.appendChild(row);
        });
        
        return datosOrdenados.length;
    } else {
        // Solo agregar nuevos registros (ya filtrados, no verificar duplicados)
        // Ordenar datos por fecha (ascendente)
        const datosOrdenados = [...datos].sort((a, b) => {
            const fechaA = crearFechaDesdeString(a.fecha);
            const fechaB = crearFechaDesdeString(b.fecha);
            return fechaA - fechaB;
        });
        
        // Agregar filas directamente (sin verificar duplicados - ya están filtrados)
        datosOrdenados.forEach(item => {
            agregarFilaFeriados(item, tbody);
        });
        
        return datosOrdenados.length;
    }
}

// Cambiar página de Feriados
async function cambiarPaginaFeriados(nuevaPagina) {
    if (nuevaPagina < 1 || (window.feriadosTotalPaginas && nuevaPagina > window.feriadosTotalPaginas)) {
        return;
    }
    
    try {
        // Mostrar indicador de carga
        const tbody = document.getElementById('feriadosTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; padding: 20px;">Cargando...</td></tr>';
        }
        
        // Obtener datos paginados desde BD (sin parámetros de fecha)
        const response = await fetch(`/api/feriados/bd?pagina=${nuevaPagina}&porPagina=${window.feriadosPorPagina || 50}`);
        const result = await response.json();
        
        if (result.success && result.datos) {
            // Actualizar variables globales
            window.feriadosPaginaActual = result.pagina;
            window.feriadosTotalPaginas = result.totalPaginas;
            window.feriadosTotal = result.total;
            
            // Generar tabla con nuevos datos
            generarTablaFeriados(result.datos, false);
            
            // Actualizar controles de paginación (recargar página para actualizar botones)
            window.location.href = `/feriados?pagina=${nuevaPagina}`;
        } else {
            throw new Error(result.error || 'Error al cargar datos');
        }
    } catch (error) {
        console.error('Error al cambiar página:', error);
        showError('Error al cargar página: ' + error.message);
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Establecer fechas por defecto: día 15 del mes actual hasta día 15 del mes siguiente
    const hoy = new Date();
    const dia15Actual = new Date(hoy.getFullYear(), hoy.getMonth(), 15);
    const dia15Siguiente = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 15);
    
    const fechaDesdeInput = document.getElementById('fechaDesdeFeriados');
    const fechaHastaInput = document.getElementById('fechaHastaFeriados');
    
    if (fechaDesdeInput && !fechaDesdeInput.value) {
        fechaDesdeInput.value = formatearFechaInput(dia15Actual);
    }
    
    if (fechaHastaInput && !fechaHastaInput.value) {
        fechaHastaInput.value = formatearFechaInput(dia15Siguiente);
    }
});

