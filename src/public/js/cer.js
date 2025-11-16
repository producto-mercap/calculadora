// JavaScript para la página CER

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

// Calcular rangos de fechas faltantes (CORREGIDO - verificación precisa)
function calcularRangosFaltantes(fechaDesde, fechaHasta, fechasExistentes) {
    const rangos = [];
    
    // Parsear fechas sin problemas de zona horaria
    const desde = crearFechaDesdeString(fechaDesde);
    const hasta = crearFechaDesdeString(fechaHasta);
    
    if (!desde || !hasta || desde > hasta) {
        return [];
    }
    
    // Calcular días totales del rango
    const diasTotales = Math.ceil((hasta - desde) / (1000 * 60 * 60 * 24)) + 1;
    
    // Filtrar solo las fechas que están dentro del rango
    const fechasEnRango = new Set();
    fechasExistentes.forEach(fecha => {
        const fechaDate = crearFechaDesdeString(fecha);
        if (fechaDate && fechaDate >= desde && fechaDate <= hasta) {
            fechasEnRango.add(fecha);
        }
    });
    
    const fechasExistentesCount = fechasEnRango.size;
    
    // Si hay menos fechas existentes que días del rango, definitivamente faltan datos
    if (fechasExistentesCount < diasTotales) {
        // Para rangos cortos (menos de 30 días), verificar día por día
        if (diasTotales <= 30) {
            // Verificar si faltan fechas en el rango
            let fechaActual = new Date(desde);
            let faltanFechas = false;
            let inicioRangoFaltante = null;
            
            while (fechaActual <= hasta) {
                const fechaStr = formatearFechaInput(fechaActual);
                
                if (!fechasEnRango.has(fechaStr)) {
                    // Iniciar un nuevo rango faltante
                    if (!inicioRangoFaltante) {
                        inicioRangoFaltante = fechaStr;
                    }
                    faltanFechas = true;
                } else {
                    // Si había un rango faltante, cerrarlo
                    if (inicioRangoFaltante) {
                        const fechaAnterior = new Date(fechaActual);
                        fechaAnterior.setDate(fechaAnterior.getDate() - 1);
                        rangos.push({ 
                            desde: inicioRangoFaltante, 
                            hasta: formatearFechaInput(fechaAnterior) 
                        });
                        inicioRangoFaltante = null;
                    }
                }
                
                fechaActual.setDate(fechaActual.getDate() + 1);
            }
            
            // Si quedó un rango abierto, cerrarlo
            if (inicioRangoFaltante) {
                rangos.push({ 
                    desde: inicioRangoFaltante, 
                    hasta: formatearFechaInput(hasta) 
                });
            }
            
            // Si no se encontraron rangos pero faltan fechas, agregar el rango completo
            if (faltanFechas && rangos.length === 0) {
                rangos.push({ 
                    desde: formatearFechaInput(desde), 
                    hasta: formatearFechaInput(hasta) 
                });
            }
        } else {
            // Para rangos largos, verificar por año
            const añoInicio = desde.getFullYear();
            const añoFin = hasta.getFullYear();
            
            for (let año = añoInicio; año <= añoFin; año++) {
                const inicioAño = año === añoInicio ? desde : new Date(año, 0, 1);
                const finAño = año === añoFin ? hasta : new Date(año, 11, 31);
                
                // Verificar inicio, medio y fin del año
                const inicioStr = formatearFechaInput(inicioAño);
                const finStr = formatearFechaInput(finAño);
                const medioAño = new Date(año, 5, 15);
                const medioStr = formatearFechaInput(medioAño);
                
                // Si falta alguna fecha clave, agregar el año completo
                if (!fechasEnRango.has(inicioStr) || !fechasEnRango.has(finStr) || !fechasEnRango.has(medioStr)) {
                    rangos.push({ desde: inicioStr, hasta: finStr });
                }
            }
        }
    }
    
    return rangos;
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

// Cargar datos de CER desde la API
async function cargarCER() {
    try {
        const fechaDesdeDDMMAAAA = document.getElementById('fechaDesdeCER')?.value;
        const fechaHastaDDMMAAAA = document.getElementById('fechaHastaCER')?.value;
        const btnCargar = document.getElementById('btnCargarCER');
        
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
        const tableContainer = document.getElementById('cerTableContainer');
        const emptyState = document.getElementById('cerEmptyState');
        const tbody = document.getElementById('cerTableBody');
        const tieneDatosEnTabla = tbody && tbody.querySelectorAll('tr').length > 0;
        
        try {
            // Llamado directo a la API (sin verificar fechas existentes)
            btnCargar.innerHTML = '<span>Cargando desde API...</span>';
            
            const response = await fetch(`/api/cer?desde=${fechaDesde}&hasta=${fechaHasta}`);
            const result = await response.json();
            
            if (!result.success || !result.datos || result.datos.length === 0) {
                showError('No se pudieron obtener datos de la API');
                btnCargar.disabled = false;
                btnCargar.innerHTML = textoOriginal;
                return;
            }
            
            // Guardar todos los datos (sobreescribir si existen)
            btnCargar.innerHTML = '<span>Guardando en BD...</span>';
            
            const responseGuardar = await fetch('/api/cer/guardar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ datos: result.datos })
            });
            
            const resultGuardar = await responseGuardar.json();
            if (resultGuardar.success) {
                // Cargar datos desde BD para mostrar en tabla
                btnCargar.innerHTML = '<span>Cargando tabla...</span>';
                const responseBD = await fetch(`/api/cer/bd?desde=${fechaDesde}&hasta=${fechaHasta}`);
                const resultBD = await responseBD.json();
                
                if (resultBD.success && resultBD.datos && resultBD.datos.length > 0) {
                    generarTablaCER(resultBD.datos, false);
                    tableContainer.style.display = 'block';
                    emptyState.style.display = 'none';
                    showSuccess(`Se guardaron ${resultGuardar.actualizados} registros de CER`);
                } else {
                    tableContainer.style.display = 'none';
                    emptyState.style.display = 'block';
                }
            } else {
                showError('Error al guardar datos: ' + (resultGuardar.error || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error al cargar CER:', error);
            showError('Error al cargar datos: ' + error.message);
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

// Obtener fechas que ya están en la tabla
function obtenerFechasEnTablaCER() {
    const tbody = document.getElementById('cerTableBody');
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

// Agregar fila nueva a la tabla (manteniendo orden descendente)
function agregarFilaCER(item, tbody) {
    const row = document.createElement('tr');
    
    // Extraer fecha (formato YYYY-MM-DD)
    let fecha = item.fecha;
    if (!fecha) {
        console.warn('Item sin fecha:', item);
        return null;
    }
    if (typeof fecha === 'string' && fecha.includes('T')) {
        fecha = fecha.split('T')[0];
    }
    
    // Extraer valor CER
    const valor = item.valor;
    if (valor === null || valor === undefined) {
        console.warn('Item sin valor:', item);
        return null;
    }
    
    row.innerHTML = `
        <td>${formatearFechaMostrar(fecha)}</td>
        <td style="text-align: right;">${formatearNumero(valor)}</td>
    `;
    
    // Insertar en orden descendente (más reciente primero)
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

// Generar tabla de CER (solo si está vacía) o agregar solo nuevos registros (OPTIMIZADO)
function generarTablaCER(datos, soloNuevos = false) {
    const tbody = document.getElementById('cerTableBody');
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
            let fecha = item.fecha;
            if (!fecha) return;
            if (typeof fecha === 'string' && fecha.includes('T')) {
                fecha = fecha.split('T')[0];
            }
            
            const valor = item.valor;
            if (valor === null || valor === undefined) return;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatearFechaMostrar(fecha)}</td>
                <td style="text-align: right;">${formatearNumero(valor)}</td>
            `;
            tbody.appendChild(row);
        });
        
        return datosOrdenados.length;
    } else {
        // Solo agregar nuevos registros (ya filtrados, no verificar duplicados)
        // Ordenar datos por fecha (descendente)
        const datosOrdenados = [...datos].sort((a, b) => {
            const fechaA = crearFechaDesdeString(a.fecha);
            const fechaB = crearFechaDesdeString(b.fecha);
            return fechaB - fechaA;
        });
        
        // Agregar filas directamente (sin verificar duplicados - ya están filtrados)
        datosOrdenados.forEach(item => {
            agregarFilaCER(item, tbody);
        });
        
        return datosOrdenados.length;
    }
}

// Convertir DD/MM/AAAA a YYYY-MM-DD
function convertirFechaDDMMAAAAaYYYYMMDD(fechaDDMMAAAA) {
    if (!fechaDDMMAAAA) return '';
    // Formato esperado: DD/MM/AAAA
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
    // Formato esperado: YYYY-MM-DD
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
    
    // Validar rangos
    if (mes < 1 || mes > 12) return false;
    if (dia < 1 || dia > 31) return false;
    if (año < 1900 || año > 2100) return false;
    
    // Validar día según mes
    const diasPorMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    // Año bisiesto
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
        let valor = e.target.value.replace(/\D/g, ''); // Solo números
        
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

// Inicializar inputs de fecha con formato DD/MM/AAAA
document.addEventListener('DOMContentLoaded', () => {
    const fechaDesdeInput = document.getElementById('fechaDesdeCER');
    const fechaHastaInput = document.getElementById('fechaHastaCER');
    
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

// Cambiar página de CER
async function cambiarPaginaCER(nuevaPagina) {
    if (nuevaPagina < 1 || (window.cerTotalPaginas && nuevaPagina > window.cerTotalPaginas)) {
        return;
    }
    
    try {
        // Mostrar indicador de carga
        const tbody = document.getElementById('cerTableBody');
        tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; padding: 20px;">Cargando...</td></tr>';
        
        // Obtener datos paginados desde BD
        const response = await fetch(`/api/cer/bd?pagina=${nuevaPagina}&porPagina=${window.cerPorPagina || 50}`);
        const result = await response.json();
        
        if (result.success && result.datos) {
            // Actualizar variables globales
            window.cerPaginaActual = result.pagina;
            window.cerTotalPaginas = result.totalPaginas;
            window.cerTotal = result.total;
            
            // Generar tabla con nuevos datos
            generarTablaCER(result.datos);
            
            // Actualizar controles de paginación (recargar página para actualizar botones)
            window.location.href = `/cer?pagina=${nuevaPagina}`;
        } else {
            throw new Error(result.error || 'Error al cargar datos');
        }
    } catch (error) {
        console.error('Error al cambiar página:', error);
        showError('Error al cargar página: ' + error.message);
    }
}


