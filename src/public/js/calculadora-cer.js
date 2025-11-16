// JavaScript para la calculadora CER

// Contador de cupones
let cuponCount = 0;

// Cache de feriados
let cacheFeriados = [];
let cacheFeriadosRango = null;

// Agregar nuevo cupón a la tabla
function agregarCupon() {
    cuponCount++;
    const tbody = document.getElementById('cashflowBody');
    
    const row = document.createElement('tr');
    row.setAttribute('data-cupon-id', cuponCount);
    row.setAttribute('data-tipo', 'cupon');
    
    row.innerHTML = `
        <td>
            <div style="position: relative;">
                <input type="text" class="input-table date-input fecha-inicio" id="fechaInicio${cuponCount}" style="padding-right: 40px;" placeholder="DD/MM/AAAA" maxlength="10" onchange="calcularDayCountFactor(this)" />
                <button type="button" class="date-picker-icon" onclick="abrirDatePicker('fechaInicio${cuponCount}')" title="Seleccionar fecha" style="right: 4px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                    </svg>
                </button>
                <div id="datePickerFechaInicio${cuponCount}" class="date-picker-popup" style="display: none;"></div>
            </div>
        </td>
        <td>
            <div style="position: relative;">
                <input type="text" class="input-table date-input fecha-liquidacion" id="fechaLiquidacion${cuponCount}" style="padding-right: 40px;" placeholder="DD/MM/AAAA" maxlength="10" onchange="calcularDayCountFactor(this)" />
                <button type="button" class="date-picker-icon" onclick="abrirDatePicker('fechaLiquidacion${cuponCount}')" title="Seleccionar fecha" style="right: 4px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                    </svg>
                </button>
                <div id="datePickerFechaLiquidacion${cuponCount}" class="date-picker-popup" style="display: none;"></div>
            </div>
        </td>
        <td>
            <div style="position: relative;">
                <input type="text" class="input-table date-input fecha-inicio-cer" readonly style="padding-right: 40px;" placeholder="DD/MM/AAAA" maxlength="10" />
            </div>
        </td>
        <td>
            <div style="position: relative;">
                <input type="text" class="input-table date-input fecha-final-cer" readonly style="padding-right: 40px;" placeholder="DD/MM/AAAA" maxlength="10" />
            </div>
        </td>
        <td><input type="number" class="input-table" step="0.0001" /></td>
        <td><input type="number" class="input-table day-count-factor" readonly /></td>
        <td><input type="number" class="input-table" step="0.01" /></td>
        <td><input type="number" class="input-table" step="0.01" /></td>
        <td><input type="number" class="input-table" step="0.01" /></td>
        <td><input type="number" class="input-table" step="0.01" /></td>
        <td><input type="number" class="input-table" step="0.01" /></td>
        <td><input type="number" class="input-table" step="0.01" /></td>
        <td><input type="number" class="input-table" step="0.0001" /></td>
        <td><input type="number" class="input-table" step="0.01" /></td>
        <td><input type="number" class="input-table" step="0.01" /></td>
        <td><input type="number" class="input-table" step="0.01" /></td>
        <td><input type="number" class="input-table" step="0.01" /></td>
        <td>
            <button onclick="eliminarCupon(${cuponCount})" class="btn" style="min-width: auto; padding: 6px 12px; height: 32px;" title="Eliminar cupón">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
            </button>
        </td>
    `;
    
    tbody.appendChild(row);
    
    // Calcular Day Count Factor para la nueva fila
    const inputs = row.querySelectorAll('input');
    if (inputs[0].value && inputs[1].value) {
        calcularDayCountFactor(inputs[1]);
    }
}

// Eliminar cupón
function eliminarCupon(cuponId) {
    if (confirm('¿Está seguro de eliminar este cupón?')) {
        const row = document.querySelector(`tr[data-cupon-id="${cuponId}"]`);
        if (row) {
            row.remove();
        }
    }
}

// Obtener meses según periodicidad
function obtenerMesesPeriodicidad(periodicidad) {
    const meses = {
        'mensual': 1,
        'bimestral': 2,
        'trimestral': 3,
        'semestral': 6,
        'anual': 12
    };
    return meses[periodicidad] || 0;
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

// Formatear fecha para input date (YYYY-MM-DD)
// Maneja correctamente las fechas sin problemas de zona horaria
function formatearFechaInput(fecha) {
    if (!fecha) return '';
    
    // Si es un string en formato DD/MM/AAAA, convertir a YYYY-MM-DD
    if (typeof fecha === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
        return convertirFechaDDMMAAAAaYYYYMMDD(fecha);
    }
    
    // Si es un string en formato YYYY-MM-DD, devolverlo directamente
    if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return fecha;
    }
    
    // Si es un objeto Date, formatearlo correctamente
    const d = new Date(fecha);
    // Usar UTC para evitar problemas de zona horaria
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Crear fecha desde string YYYY-MM-DD sin problemas de zona horaria
function crearFechaDesdeString(fechaString) {
    if (!fechaString) return null;
    const [year, month, day] = fechaString.split('-').map(Number);
    return new Date(year, month - 1, day);
}

// Agregar meses a una fecha
function agregarMeses(fecha, meses) {
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + meses);
    return nuevaFecha;
}

// Función FRAC.AÑO de Excel
// Calcula la fracción de año entre dos fechas según la base de días especificada
// FRAC.AÑO(fecha_inicio, fecha_fin, base)
// base: 0 = US (NASD) 30/360, 1 = Actual/actual, 2 = Actual/360, 3 = Actual/365, 4 = European 30/360
function fracAno(fechaInicio, fechaFin, base) {
    if (!fechaInicio || !fechaFin) return 0;
    
    const inicio = crearFechaDesdeString(fechaInicio) || new Date(fechaInicio);
    const fin = crearFechaDesdeString(fechaFin) || new Date(fechaFin);
    
    if (inicio >= fin) return 0;
    
    // Por defecto usamos base 0 (US 30/360) que es la más común para bonos
    if (base === undefined || base === null) base = 0;
    
    switch (base) {
        case 0: // US (NASD) 30/360
            return calcular30_360US(inicio, fin);
        case 1: // Actual/actual
            return calcularActualActual(inicio, fin);
        case 2: // Actual/360
            return calcularActual360(inicio, fin);
        case 3: // Actual/365
            return calcularActual365(inicio, fin);
        case 4: // European 30/360
            return calcular30_360European(inicio, fin);
        default:
            return calcular30_360US(inicio, fin);
    }
}

// US (NASD) 30/360: Meses de 30 días, años de 360 días
function calcular30_360US(inicio, fin) {
    let diaInicio = inicio.getDate();
    let mesInicio = inicio.getMonth() + 1;
    let añoInicio = inicio.getFullYear();
    
    let diaFin = fin.getDate();
    let mesFin = fin.getMonth() + 1;
    let añoFin = fin.getFullYear();
    
    // Si el día es 31, se ajusta a 30
    if (diaInicio === 31) diaInicio = 30;
    if (diaFin === 31) diaFin = 30;
    
    // Si el día de inicio es el último día del mes (28, 29, 30 o 31), se ajusta a 30
    const ultimoDiaMesInicio = new Date(añoInicio, mesInicio, 0).getDate();
    if (diaInicio === ultimoDiaMesInicio && ultimoDiaMesInicio > 30) {
        diaInicio = 30;
    }
    
    // Si el día de fin es el último día del mes y el día de inicio es menor a 30, se ajusta
    const ultimoDiaMesFin = new Date(añoFin, mesFin, 0).getDate();
    if (diaFin === ultimoDiaMesFin && ultimoDiaMesFin > 30 && diaInicio < 30) {
        diaFin = 30;
    }
    
    const dias = (añoFin - añoInicio) * 360 + (mesFin - mesInicio) * 30 + (diaFin - diaInicio);
    return dias / 360;
}

// Actual/actual: Días reales / días reales del año
function calcularActualActual(inicio, fin) {
    const diasTranscurridos = Math.floor((fin - inicio) / (1000 * 60 * 60 * 24));
    const añoInicio = inicio.getFullYear();
    const esBisiesto = (añoInicio % 4 === 0 && añoInicio % 100 !== 0) || (añoInicio % 400 === 0);
    const diasEnAño = esBisiesto ? 366 : 365;
    return diasTranscurridos / diasEnAño;
}

// Actual/360: Días reales / 360
function calcularActual360(inicio, fin) {
    const diasTranscurridos = Math.floor((fin - inicio) / (1000 * 60 * 60 * 24));
    return diasTranscurridos / 360;
}

// Actual/365: Días reales / 365
function calcularActual365(inicio, fin) {
    const diasTranscurridos = Math.floor((fin - inicio) / (1000 * 60 * 60 * 24));
    return diasTranscurridos / 365;
}

// European 30/360: Similar a US pero con reglas diferentes
function calcular30_360European(inicio, fin) {
    let diaInicio = inicio.getDate();
    let mesInicio = inicio.getMonth() + 1;
    let añoInicio = inicio.getFullYear();
    
    let diaFin = fin.getDate();
    let mesFin = fin.getMonth() + 1;
    let añoFin = fin.getFullYear();
    
    // Si el día es 31, se ajusta a 30
    if (diaInicio === 31) diaInicio = 30;
    if (diaFin === 31) diaFin = 30;
    
    const dias = (añoFin - añoInicio) * 360 + (mesFin - mesInicio) * 30 + (diaFin - diaInicio);
    return dias / 360;
}

// Calcular Day Count Factor para una fila específica
function calcularDayCountFactor(input) {
    const row = input.closest('tr');
    if (!row) return;
    
    const fechaInicioInput = row.querySelector('.fecha-inicio');
    const fechaLiquidacionInput = row.querySelector('.fecha-liquidacion');
    const dayCountFactorInput = row.querySelector('.day-count-factor');
    
    if (!fechaInicioInput || !fechaLiquidacionInput || !dayCountFactorInput) return;
    
    let fechaInicio = fechaInicioInput.value;
    let fechaLiquidacion = fechaLiquidacionInput.value;
    
    if (!fechaInicio || !fechaLiquidacion) {
        dayCountFactorInput.value = '';
        return;
    }
    
    // Convertir de DD/MM/AAAA a YYYY-MM-DD si es necesario
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaInicio)) {
        fechaInicio = convertirFechaDDMMAAAAaYYYYMMDD(fechaInicio);
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaLiquidacion)) {
        fechaLiquidacion = convertirFechaDDMMAAAAaYYYYMMDD(fechaLiquidacion);
    }
    
    // Obtener tipo de interés (días) - por defecto 360
    const tipoInteresDias = parseInt(document.getElementById('tipoInteresDias')?.value) || 360;
    
    // Determinar base según tipoInteresDias
    // 360 = US 30/360 (base 0)
    // 365 = Actual/365 (base 3)
    // 366 = Actual/actual (base 1)
    let base = 0; // Por defecto US 30/360
    if (tipoInteresDias === 365) {
        base = 3;
    } else if (tipoInteresDias === 366) {
        base = 1;
    } else {
        base = 0; // 360 días = US 30/360
    }
    
    const factor = fracAno(fechaInicio, fechaLiquidacion, base);
    dayCountFactorInput.value = factor.toFixed(8);
}

// Cache de datos CER
let cacheCER = [];
let cacheCERRango = null;

// Obtener feriados y cachearlos (solo desde cache, no hace llamadas automáticas)
function obtenerFeriadosCache(fechaDesde, fechaHasta) {
    // Solo devolver cache si existe y cubre el rango
    if (cacheFeriadosRango && 
        cacheFeriadosRango.desde <= fechaDesde && 
        cacheFeriadosRango.hasta >= fechaHasta &&
        cacheFeriados.length > 0) {
        return cacheFeriados;
    }
    
    // Si no hay cache, devolver array vacío (no hacer llamada automática)
    return [];
}

// Obtener datos CER desde cache (no hace llamadas automáticas)
function obtenerCERCache(fechaDesde, fechaHasta) {
    // Solo devolver cache si existe y cubre el rango
    if (cacheCERRango && 
        cacheCERRango.desde <= fechaDesde && 
        cacheCERRango.hasta >= fechaHasta &&
        cacheCER.length > 0) {
        return cacheCER;
    }
    
    // Si no hay cache, devolver array vacío (no hacer llamada automática)
    return [];
}

// Cargar feriados y CER desde BD al iniciar (rango amplio)
async function cargarDatosDesdeBD() {
    try {
        // Calcular rango amplio (últimos 5 años)
        const hoy = new Date();
        const hace5Anos = new Date();
        hace5Anos.setFullYear(hoy.getFullYear() - 5);
        
        // Validar fechas antes de formatear
        if (isNaN(hace5Anos.getTime()) || isNaN(hoy.getTime())) {
            console.error('❌ Fechas inválidas para cargar desde BD');
            return;
        }
        
        const fechaDesdeStr = formatearFechaInput(hace5Anos);
        const fechaHastaStr = formatearFechaInput(hoy);
        
        // Validar que las fechas formateadas sean válidas
        if (!fechaDesdeStr || !fechaHastaStr || !/^\d{4}-\d{2}-\d{2}$/.test(fechaDesdeStr) || !/^\d{4}-\d{2}-\d{2}$/.test(fechaHastaStr)) {
            console.error('❌ Fechas formateadas inválidas:', fechaDesdeStr, fechaHastaStr);
            return;
        }
        
        console.log('📥 Cargando feriados y CER desde BD...');
        
        // Cargar feriados desde BD
        try {
            const responseFeriados = await fetch(`/api/feriados/bd?desde=${encodeURIComponent(fechaDesdeStr)}&hasta=${encodeURIComponent(fechaHastaStr)}`);
            const resultFeriados = await responseFeriados.json();
            
            if (resultFeriados.success && resultFeriados.datos && resultFeriados.datos.length > 0) {
                cacheFeriados = resultFeriados.datos.map(f => f.fecha || f.date || f);
                cacheFeriadosRango = { desde: fechaDesdeStr, hasta: fechaHastaStr };
                console.log(`✅ Feriados cargados desde BD: ${cacheFeriados.length} feriados en cache`);
            } else {
                console.log('ℹ️ No hay feriados en BD para el rango solicitado');
            }
        } catch (error) {
            console.warn('⚠️ Error al cargar feriados desde BD:', error);
        }
        
        // Cargar CER desde BD
        try {
            const responseCER = await fetch(`/api/cer/bd?desde=${encodeURIComponent(fechaDesdeStr)}&hasta=${encodeURIComponent(fechaHastaStr)}`);
            const resultCER = await responseCER.json();
            
            if (resultCER.success && resultCER.datos && resultCER.datos.length > 0) {
                cacheCER = resultCER.datos;
                cacheCERRango = { desde: fechaDesdeStr, hasta: fechaHastaStr };
                console.log(`✅ CER cargado desde BD: ${cacheCER.length} registros en cache`);
            } else {
                console.log('ℹ️ No hay CER en BD para el rango solicitado');
            }
        } catch (error) {
            console.warn('⚠️ Error al cargar CER desde BD:', error);
        }
        
    } catch (error) {
        console.error('Error al cargar datos desde BD:', error);
    }
}

// Actualizar datos de APIs (CER y Feriados) a demanda
async function actualizarDatosAPIs() {
    try {
        const btnRefresh = document.getElementById('btnRefreshAPIs');
        if (!btnRefresh) return;
        
        // Obtener rango de fechas de los cupones
        const rows = document.querySelectorAll('#cashflowBody tr[data-tipo="cupon"]');
        
        if (rows.length === 0) {
            showError('No hay cupones para determinar el rango de fechas');
            return;
        }
        
        // Determinar rango de fechas
        let fechaMin = null;
        let fechaMax = null;
        
        rows.forEach(row => {
            const fechaInicioInput = row.querySelector('.fecha-inicio');
            const fechaLiquidacionInput = row.querySelector('.fecha-liquidacion');
            
            let fechaInicio = fechaInicioInput?.value;
            let fechaLiquidacion = fechaLiquidacionInput?.value;
            
            // Convertir de DD/MM/AAAA a YYYY-MM-DD si es necesario
            if (fechaInicio && /^\d{2}\/\d{2}\/\d{4}$/.test(fechaInicio)) {
                fechaInicio = convertirFechaDDMMAAAAaYYYYMMDD(fechaInicio);
            }
            if (fechaLiquidacion && /^\d{2}\/\d{2}\/\d{4}$/.test(fechaLiquidacion)) {
                fechaLiquidacion = convertirFechaDDMMAAAAaYYYYMMDD(fechaLiquidacion);
            }
            
            if (fechaInicio) {
                const fecha = crearFechaDesdeString(fechaInicio);
                if (!fechaMin || fecha < fechaMin) {
                    fechaMin = fecha;
                }
            }
            
            if (fechaLiquidacion) {
                const fecha = crearFechaDesdeString(fechaLiquidacion);
                if (!fechaMax || fecha > fechaMax) {
                    fechaMax = fecha;
                }
            }
        });
        
        // Obtener intervalos para ajustar el rango
        const intervaloInicio = parseInt(document.getElementById('intervaloInicio')?.value) || 0;
        const intervaloFin = parseInt(document.getElementById('intervaloFin')?.value) || 0;
        const diasExtras = Math.max(Math.abs(intervaloInicio), Math.abs(intervaloFin)) + 30;
        
        if (!fechaMin || !fechaMax) {
            showError('No se pudo determinar el rango de fechas');
            return;
        }
        
        // Ajustar rango para incluir los días de intervalo
        fechaMin.setDate(fechaMin.getDate() - diasExtras);
        fechaMax.setDate(fechaMax.getDate() + diasExtras);
        
        const fechaDesdeStr = formatearFechaInput(fechaMin);
        const fechaHastaStr = formatearFechaInput(fechaMax);
        
        // Mostrar indicador de carga
        const textoOriginal = btnRefresh.innerHTML;
        btnRefresh.disabled = true;
        btnRefresh.innerHTML = '<span>Actualizando...</span>';
        
        try {
            // Consultar API de Feriados
            const responseFeriados = await fetch(`/api/feriados?desde=${fechaDesdeStr}&hasta=${fechaHastaStr}`);
            const resultFeriados = await responseFeriados.json();
            
            if (resultFeriados.success && resultFeriados.datos) {
                cacheFeriados = resultFeriados.datos.map(f => f.fecha || f.date || f);
                cacheFeriadosRango = { desde: fechaDesdeStr, hasta: fechaHastaStr };
                console.log(`✅ Feriados actualizados: ${cacheFeriados.length} feriados cargados`);
            } else {
                console.warn('⚠️ No se pudieron obtener feriados:', resultFeriados.error);
            }
            
            // Consultar API de CER (BCRA)
            const responseCER = await fetch(`/api/cer?desde=${fechaDesdeStr}&hasta=${fechaHastaStr}`);
            const resultCER = await responseCER.json();
            
            if (resultCER.success && resultCER.datos) {
                cacheCER = resultCER.datos;
                cacheCERRango = { desde: fechaDesdeStr, hasta: fechaHastaStr };
                console.log(`✅ CER actualizado: ${cacheCER.length} registros cargados`);
            } else {
                console.warn('⚠️ No se pudo obtener CER:', resultCER.error);
            }
            
            // Calcular fechas CER con los nuevos datos
            calcularFechasCER();
            
            showSuccess('Datos de CER y Feriados actualizados correctamente');
            
        } catch (error) {
            console.error('Error al actualizar datos de APIs:', error);
            showError('Error al actualizar datos: ' + error.message);
        } finally {
            // Restaurar botón
            btnRefresh.disabled = false;
            btnRefresh.innerHTML = textoOriginal;
        }
        
    } catch (error) {
        console.error('Error en actualizarDatosAPIs:', error);
        showError('Error al actualizar datos: ' + error.message);
        
        // Restaurar botón en caso de error
        const btnRefresh = document.getElementById('btnRefreshAPIs');
        if (btnRefresh) {
            btnRefresh.disabled = false;
        }
    }
}

// Verificar si una fecha es fin de semana
function esFinDeSemana(fecha) {
    const dia = fecha.getDay();
    return dia === 0 || dia === 6; // 0 = domingo, 6 = sábado
}

// Verificar si una fecha es feriado
function esFeriado(fecha, feriados) {
    if (!fecha || !feriados || feriados.length === 0) return false;
    
    const fechaStr = formatearFechaInput(fecha);
    return feriados.includes(fechaStr);
}

// Verificar si una fecha es día hábil (no es fin de semana ni feriado)
function esDiaHabil(fecha, feriados) {
    return !esFinDeSemana(fecha) && !esFeriado(fecha, feriados);
}

// Calcular fecha sumando/restando días hábiles (síncrono, usa cache)
function calcularFechaConDiasHabiles(fechaBase, dias, feriados) {
    if (!fechaBase) return null;
    
    const fecha = new Date(fechaBase);
    let diasRestantes = Math.abs(dias);
    const direccion = dias >= 0 ? 1 : -1; // 1 = avanzar, -1 = retroceder
    
    while (diasRestantes > 0) {
        fecha.setDate(fecha.getDate() + direccion);
        
        if (esDiaHabil(fecha, feriados)) {
            diasRestantes--;
        }
    }
    
    return fecha;
}

// Calcular fechas CER basándose en intervalos (usando días hábiles desde cache)
function calcularFechasCER() {
    const intervaloInicio = parseInt(document.getElementById('intervaloInicio')?.value) || 0;
    const intervaloFin = parseInt(document.getElementById('intervaloFin')?.value) || 0;
    
    // Si no hay intervalos, limpiar campos
    if (intervaloInicio === 0 && intervaloFin === 0) {
        const rows = document.querySelectorAll('#cashflowBody tr[data-tipo="cupon"]');
        rows.forEach(row => {
            const inputs = row.querySelectorAll('input');
            if (inputs[2]) inputs[2].value = '';
            if (inputs[3]) inputs[3].value = '';
        });
        return;
    }
    
    // Obtener todas las filas de cupones (excluyendo la fila de inversión)
    const rows = document.querySelectorAll('#cashflowBody tr[data-tipo="cupon"]');
    
    if (rows.length === 0) return;
    
    // Determinar rango de fechas para obtener feriados del cache
    let fechaMin = null;
    let fechaMax = null;
    
    rows.forEach(row => {
        const fechaInicioInput = row.querySelector('.fecha-inicio');
        const fechaLiquidacionInput = row.querySelector('.fecha-liquidacion');
        
        let fechaInicio = fechaInicioInput?.value;
        let fechaLiquidacion = fechaLiquidacionInput?.value;
        
        // Convertir de DD/MM/AAAA a YYYY-MM-DD si es necesario
        if (fechaInicio && /^\d{2}\/\d{2}\/\d{4}$/.test(fechaInicio)) {
            fechaInicio = convertirFechaDDMMAAAAaYYYYMMDD(fechaInicio);
        }
        if (fechaLiquidacion && /^\d{2}\/\d{2}\/\d{4}$/.test(fechaLiquidacion)) {
            fechaLiquidacion = convertirFechaDDMMAAAAaYYYYMMDD(fechaLiquidacion);
        }
        
        if (fechaInicio) {
            const fecha = crearFechaDesdeString(fechaInicio);
            if (!fechaMin || fecha < fechaMin) {
                fechaMin = fecha;
            }
        }
        
        if (fechaLiquidacion) {
            const fecha = crearFechaDesdeString(fechaLiquidacion);
            if (!fechaMax || fecha > fechaMax) {
                fechaMax = fecha;
            }
        }
    });
    
    // Si no hay fechas, salir
    if (!fechaMin || !fechaMax) return;
    
    // Ajustar rango para incluir los días de intervalo (puede ser negativo)
    const diasExtras = Math.max(Math.abs(intervaloInicio), Math.abs(intervaloFin)) + 10;
    fechaMin.setDate(fechaMin.getDate() - diasExtras);
    fechaMax.setDate(fechaMax.getDate() + diasExtras);
    
    const fechaDesdeStr = formatearFechaInput(fechaMin);
    const fechaHastaStr = formatearFechaInput(fechaMax);
    
    // Obtener feriados desde cache (NO hace llamadas automáticas)
    const feriados = obtenerFeriadosCache(fechaDesdeStr, fechaHastaStr);
    
    // Si no hay feriados en cache, mostrar advertencia pero continuar
    if (feriados.length === 0) {
        console.warn('⚠️ No hay feriados en cache. Use el botón "Actualizar CER y Feriados" para cargar los datos.');
    }
    
    // Calcular fechas CER para cada fila
    for (const row of rows) {
        const fechaInicioInput = row.querySelector('.fecha-inicio');
        const fechaLiquidacionInput = row.querySelector('.fecha-liquidacion');
        const fechaInicioCERInput = row.querySelector('.fecha-inicio-cer');
        const fechaFinalCERInput = row.querySelector('.fecha-final-cer');
        
        if (!fechaInicioInput || !fechaLiquidacionInput || !fechaInicioCERInput || !fechaFinalCERInput) continue;
        
        let fechaInicio = fechaInicioInput.value;
        let fechaLiquidacion = fechaLiquidacionInput.value;
        
        if (!fechaInicio || !fechaLiquidacion) {
            fechaInicioCERInput.value = '';
            fechaFinalCERInput.value = '';
            continue;
        }
        
        // Convertir de DD/MM/AAAA a YYYY-MM-DD si es necesario
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaInicio)) {
            fechaInicio = convertirFechaDDMMAAAAaYYYYMMDD(fechaInicio);
        }
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaLiquidacion)) {
            fechaLiquidacion = convertirFechaDDMMAAAAaYYYYMMDD(fechaLiquidacion);
        }
        
        // Calcular fechas CER usando días hábiles (síncrono, usa cache)
        const fechaInicioDate = crearFechaDesdeString(fechaInicio);
        const fechaLiquidacionDate = crearFechaDesdeString(fechaLiquidacion);
        
        if (fechaInicioDate && fechaLiquidacionDate) {
            // Fecha Inicio CER = Fecha Inicio + intervaloInicio días hábiles
            const fechaInicioCER = calcularFechaConDiasHabiles(fechaInicioDate, intervaloInicio, feriados);
            if (fechaInicioCER) {
                fechaInicioCERInput.value = convertirFechaYYYYMMDDaDDMMAAAA(formatearFechaInput(fechaInicioCER));
            }
            
            // Fecha Final CER = Fecha Liquidación + intervaloFin días hábiles
            const fechaFinalCER = calcularFechaConDiasHabiles(fechaLiquidacionDate, intervaloFin, feriados);
            if (fechaFinalCER) {
                fechaFinalCERInput.value = convertirFechaYYYYMMDDaDDMMAAAA(formatearFechaInput(fechaFinalCER));
            }
        }
    }
}

// Autocompletar cupones basándose en datos de especie
async function autocompletarCupones() {
    try {
        // Obtener datos necesarios
        let fechaEmision = document.getElementById('fechaEmision')?.value;
        const periodicidad = document.getElementById('periodicidad')?.value;
        let fechaPrimeraRenta = document.getElementById('fechaPrimeraRenta')?.value;
        let fechaAmortizacion = document.getElementById('fechaAmortizacion')?.value;
        let fechaCompra = document.getElementById('fechaCompra')?.value; // Opcional
        
        // Convertir de DD/MM/AAAA a YYYY-MM-DD si es necesario
        if (fechaEmision && /^\d{2}\/\d{2}\/\d{4}$/.test(fechaEmision)) {
            fechaEmision = convertirFechaDDMMAAAAaYYYYMMDD(fechaEmision);
        }
        if (fechaPrimeraRenta && /^\d{2}\/\d{2}\/\d{4}$/.test(fechaPrimeraRenta)) {
            fechaPrimeraRenta = convertirFechaDDMMAAAAaYYYYMMDD(fechaPrimeraRenta);
        }
        if (fechaAmortizacion && /^\d{2}\/\d{2}\/\d{4}$/.test(fechaAmortizacion)) {
            fechaAmortizacion = convertirFechaDDMMAAAAaYYYYMMDD(fechaAmortizacion);
        }
        if (fechaCompra && /^\d{2}\/\d{2}\/\d{4}$/.test(fechaCompra)) {
            fechaCompra = convertirFechaDDMMAAAAaYYYYMMDD(fechaCompra);
        }
        
        // Validar que todos los campos obligatorios estén completos
        if (!fechaEmision || !periodicidad || !fechaPrimeraRenta || !fechaAmortizacion) {
            showError('Por favor complete todos los campos: Fecha Emisión, Periodicidad, Fecha Primera Renta y Fecha Amortización');
            return;
        }
        
        // Validar que las fechas sean lógicas (usar función que evita problemas de zona horaria)
        const fechaEmisionDate = crearFechaDesdeString(fechaEmision);
        const fechaPrimeraRentaDate = crearFechaDesdeString(fechaPrimeraRenta);
        const fechaAmortizacionDate = crearFechaDesdeString(fechaAmortizacion);
        const fechaCompraDate = fechaCompra ? crearFechaDesdeString(fechaCompra) : null;
        
        if (fechaPrimeraRentaDate < fechaEmisionDate) {
            showError('La Fecha Primera Renta debe ser posterior a la Fecha de Emisión');
            return;
        }
        
        if (fechaAmortizacionDate <= fechaPrimeraRentaDate) {
            showError('La Fecha Amortización debe ser posterior a la Fecha Primera Renta');
            return;
        }
        
        if (fechaCompraDate && fechaCompraDate < fechaEmisionDate) {
            showError('La Fecha Compra debe ser posterior a la Fecha de Emisión');
            return;
        }
        
        // Obtener meses según periodicidad
        const mesesPeriodo = obtenerMesesPeriodicidad(periodicidad);
        if (mesesPeriodo === 0) {
            showError('Periodicidad inválida');
            return;
        }
        
        // Limpiar cupones existentes (excepto la fila de inversión)
        const tbody = document.getElementById('cashflowBody');
        const filasCupones = tbody.querySelectorAll('tr[data-tipo="cupon"]');
        filasCupones.forEach(fila => fila.remove());
        cuponCount = 0;
        
        // Generar todos los cupones desde emisión hasta amortización
        const todosLosCupones = [];
        
        // Primer cupón: Fecha Inicio = Fecha Emisión, Fecha Liquidación = Fecha Primera Renta
        todosLosCupones.push({
            fechaInicio: crearFechaDesdeString(fechaEmision),
            fechaLiquidacion: crearFechaDesdeString(fechaPrimeraRenta)
        });
        
        // Generar cupones intermedios según periodicidad
        let fechaInicioActual = crearFechaDesdeString(fechaPrimeraRenta);
        let fechaLiquidacionActual = agregarMeses(fechaInicioActual, mesesPeriodo);
        
        // Generar cupones mientras no superemos la fecha de amortización
        while (fechaLiquidacionActual < fechaAmortizacionDate) {
            todosLosCupones.push({
                fechaInicio: new Date(fechaInicioActual),
                fechaLiquidacion: new Date(fechaLiquidacionActual)
            });
            
            // Avanzar al siguiente período
            fechaInicioActual = new Date(fechaLiquidacionActual);
            fechaLiquidacionActual = agregarMeses(fechaInicioActual, mesesPeriodo);
        }
        
        // Último cupón: Fecha Liquidación = Fecha Amortización
        // Si el último cupón generado no coincide con fecha amortización, ajustarlo
        if (todosLosCupones.length > 0) {
            const ultimoCupon = todosLosCupones[todosLosCupones.length - 1];
            if (ultimoCupon.fechaLiquidacion.getTime() !== fechaAmortizacionDate.getTime()) {
                // Ajustar el último cupón o agregar uno nuevo
                if (ultimoCupon.fechaLiquidacion < fechaAmortizacionDate) {
                    // Agregar un cupón final con fecha amortización
                    todosLosCupones.push({
                        fechaInicio: new Date(ultimoCupon.fechaLiquidacion),
                        fechaLiquidacion: crearFechaDesdeString(fechaAmortizacion)
                    });
                } else {
                    // Ajustar el último cupón
                    ultimoCupon.fechaLiquidacion = crearFechaDesdeString(fechaAmortizacion);
                }
            }
        }
        
        // Filtrar cupones según fecha de compra (si existe)
        let cuponesAFiltrar = todosLosCupones;
        if (fechaCompraDate) {
            // Solo incluir cupones cuya fecha liquidación sea >= fecha compra
            // Esto asegura que el primer cupón mostrado sea el cupón vigente en la fecha de compra
            cuponesAFiltrar = todosLosCupones.filter(cupon => {
                return cupon.fechaLiquidacion >= fechaCompraDate;
            });
            
            if (cuponesAFiltrar.length === 0) {
                showError('No hay cupones vigentes después de la fecha de compra');
                return;
            }
            
            // Ajustar la fecha inicio del primer cupón si es necesario
            // Si la fecha de compra está dentro del período del primer cupón, 
            // ajustar la fecha inicio al día siguiente a la fecha de compra
            if (cuponesAFiltrar.length > 0) {
                const primerCupon = cuponesAFiltrar[0];
                // Si la fecha de compra está dentro del período del primer cupón
                if (fechaCompraDate > primerCupon.fechaInicio && fechaCompraDate < primerCupon.fechaLiquidacion) {
                    // Ajustar fecha inicio al día siguiente a la fecha de compra
                    const nuevaFechaInicio = new Date(fechaCompraDate);
                    nuevaFechaInicio.setDate(nuevaFechaInicio.getDate() + 1);
                    primerCupon.fechaInicio = nuevaFechaInicio;
                } else if (fechaCompraDate >= primerCupon.fechaLiquidacion) {
                    // Si la fecha de compra es posterior a la liquidación del primer cupón,
                    // la fecha inicio del primer cupón debe ser la fecha liquidación del cupón anterior
                    // (si existe) o la fecha de compra
                    const cuponAnterior = todosLosCupones.find(c => 
                        c.fechaLiquidacion.getTime() === primerCupon.fechaInicio.getTime()
                    );
                    if (cuponAnterior) {
                        primerCupon.fechaInicio = new Date(cuponAnterior.fechaLiquidacion);
                    } else {
                        // Si no hay cupón anterior, usar la fecha de compra
                        primerCupon.fechaInicio = new Date(fechaCompraDate);
                    }
                }
            }
        }
        
        // Crear filas en la tabla para los cupones filtrados
        cuponesAFiltrar.forEach(cupon => {
            cuponCount++;
            
            const row = document.createElement('tr');
            row.setAttribute('data-cupon-id', cuponCount);
            row.setAttribute('data-tipo', 'cupon');
            
            const fechaInicioStr = formatearFechaInput(cupon.fechaInicio);
            const fechaLiquidacionStr = formatearFechaInput(cupon.fechaLiquidacion);
            
            // Convertir fechas de YYYY-MM-DD a DD/MM/AAAA
            const fechaInicioDDMM = convertirFechaYYYYMMDDaDDMMAAAA(fechaInicioStr);
            const fechaLiquidacionDDMM = convertirFechaYYYYMMDDaDDMMAAAA(fechaLiquidacionStr);
            
            row.innerHTML = `
                <td>
                    <div style="position: relative;">
                        <input type="text" class="input-table date-input fecha-inicio" id="fechaInicio${cuponCount}" value="${fechaInicioDDMM}" style="padding-right: 40px;" placeholder="DD/MM/AAAA" maxlength="10" onchange="calcularDayCountFactor(this)" />
                        <button type="button" class="date-picker-icon" onclick="abrirDatePicker('fechaInicio${cuponCount}')" title="Seleccionar fecha" style="right: 4px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                            </svg>
                        </button>
                        <div id="datePickerFechaInicio${cuponCount}" class="date-picker-popup" style="display: none;"></div>
                    </div>
                </td>
                <td>
                    <div style="position: relative;">
                        <input type="text" class="input-table date-input fecha-liquidacion" id="fechaLiquidacion${cuponCount}" value="${fechaLiquidacionDDMM}" style="padding-right: 40px;" placeholder="DD/MM/AAAA" maxlength="10" onchange="calcularDayCountFactor(this)" />
                        <button type="button" class="date-picker-icon" onclick="abrirDatePicker('fechaLiquidacion${cuponCount}')" title="Seleccionar fecha" style="right: 4px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                            </svg>
                        </button>
                        <div id="datePickerFechaLiquidacion${cuponCount}" class="date-picker-popup" style="display: none;"></div>
                    </div>
                </td>
                <td>
                    <div style="position: relative;">
                        <input type="text" class="input-table date-input fecha-inicio-cer" readonly style="padding-right: 40px;" placeholder="DD/MM/AAAA" maxlength="10" />
                    </div>
                </td>
                <td>
                    <div style="position: relative;">
                        <input type="text" class="input-table date-input fecha-final-cer" readonly style="padding-right: 40px;" placeholder="DD/MM/AAAA" maxlength="10" />
                    </div>
                </td>
                <td><input type="number" class="input-table" step="0.0001" /></td>
                <td><input type="number" class="input-table day-count-factor" readonly /></td>
                <td><input type="number" class="input-table" step="0.01" /></td>
                <td><input type="number" class="input-table" step="0.01" /></td>
                <td><input type="number" class="input-table" step="0.01" /></td>
                <td><input type="number" class="input-table" step="0.01" /></td>
                <td><input type="number" class="input-table" step="0.01" /></td>
                <td><input type="number" class="input-table" step="0.01" /></td>
                <td><input type="number" class="input-table" step="0.0001" /></td>
                <td><input type="number" class="input-table" step="0.01" /></td>
                <td><input type="number" class="input-table" step="0.01" /></td>
                <td><input type="number" class="input-table" step="0.01" /></td>
                <td><input type="number" class="input-table" step="0.01" /></td>
                <td>
                    <button onclick="eliminarCupon(${cuponCount})" class="btn" style="min-width: auto; padding: 6px 12px; height: 32px;" title="Eliminar cupón">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
            
            // Calcular Day Count Factor y fechas CER para la nueva fila
            const fechaInicioInput = row.querySelector('.fecha-inicio');
            const fechaLiquidacionInput = row.querySelector('.fecha-liquidacion');
            if (fechaInicioInput && fechaLiquidacionInput && fechaInicioInput.value && fechaLiquidacionInput.value) {
                calcularDayCountFactor(fechaLiquidacionInput);
                calcularFechasCER();
            }
            
            // Aplicar máscara a los nuevos campos de fecha
            const fechaInputs = row.querySelectorAll('.date-input');
            fechaInputs.forEach(input => {
                aplicarMascaraFecha(input);
            });
        });
        
        const mensaje = fechaCompraDate 
            ? `Se generaron ${cuponCount} cupones desde la fecha de compra (${cuponesAFiltrar.length} de ${todosLosCupones.length} totales)`
            : `Se generaron ${cuponCount} cupones automáticamente`;
        showSuccess(mensaje);
        
        // Calcular Day Count Factor para todos los cupones generados
        const rows = document.querySelectorAll('#cashflowBody tr[data-tipo="cupon"]');
        rows.forEach(row => {
            const fechaLiquidacionInput = row.querySelector('.fecha-liquidacion');
            if (fechaLiquidacionInput && fechaLiquidacionInput.value) {
                calcularDayCountFactor(fechaLiquidacionInput);
            }
        });
        
    } catch (error) {
        console.error('Error al autocompletar cupones:', error);
        showError('Error al autocompletar cupones: ' + error.message);
    }
}

// Obtener datos de la tabla de cashflow
function obtenerDatosCashflow() {
    const rows = document.querySelectorAll('#cashflowBody tr');
    const datos = [];
    
    rows.forEach(row => {
        const tipo = row.getAttribute('data-tipo');
        
        // Para la fila de inversión, usar IDs específicos
        let fechaInicioInput, fechaLiquidacionInput, fechaInicioCERInput, fechaFinalCERInput;
        
        if (tipo === 'inversion') {
            // Fila de inversión tiene IDs específicos
            fechaLiquidacionInput = document.getElementById('fechaLiquidacion');
            fechaInicioInput = null; // No tiene fecha inicio
            fechaInicioCERInput = null;
            fechaFinalCERInput = null;
        } else {
            // Cupones usan clases
            fechaInicioInput = row.querySelector('.fecha-inicio');
            fechaLiquidacionInput = row.querySelector('.fecha-liquidacion');
            fechaInicioCERInput = row.querySelector('.fecha-inicio-cer');
            fechaFinalCERInput = row.querySelector('.fecha-final-cer');
        }
        
        const inputs = row.querySelectorAll('input');
        
        let fechaInicio = fechaInicioInput?.value || null;
        let fechaLiquidacion = fechaLiquidacionInput?.value || null;
        let fechaInicioCER = fechaInicioCERInput?.value || null;
        let fechaFinalCER = fechaFinalCERInput?.value || null;
        
        // Convertir de DD/MM/AAAA a YYYY-MM-DD para el backend
        if (fechaInicio && /^\d{2}\/\d{2}\/\d{4}$/.test(fechaInicio)) {
            fechaInicio = convertirFechaDDMMAAAAaYYYYMMDD(fechaInicio);
        }
        if (fechaLiquidacion && /^\d{2}\/\d{2}\/\d{4}$/.test(fechaLiquidacion)) {
            fechaLiquidacion = convertirFechaDDMMAAAAaYYYYMMDD(fechaLiquidacion);
        }
        if (fechaInicioCER && /^\d{2}\/\d{2}\/\d{4}$/.test(fechaInicioCER)) {
            fechaInicioCER = convertirFechaDDMMAAAAaYYYYMMDD(fechaInicioCER);
        }
        if (fechaFinalCER && /^\d{2}\/\d{2}\/\d{4}$/.test(fechaFinalCER)) {
            fechaFinalCER = convertirFechaDDMMAAAAaYYYYMMDD(fechaFinalCER);
        }
        
        // Para la fila de inversión, usar IDs específicos
        let rowData;
        if (tipo === 'inversion') {
            const valorCERInput = document.getElementById('valorCER');
            const flujosInput = document.getElementById('flujos');
            const flujosDescFechaCompraInput = document.getElementById('flujosDescFechaCompra');
            
            rowData = {
                tipo: tipo,
                fechaInicio: null,
                fechaLiquidacion: fechaLiquidacion,
                fechaInicioCER: null,
                fechaFinalCER: null,
                valorCER: parseFloat(valorCERInput?.value) || 0,
                dayCountFactor: 0,
                amortizacion: 0,
                valorResidual: 0,
                amortizacionAjustada: 0,
                rentaNominal: 0,
                rentaTNA: 0,
                rentaAjustada: 0,
                factorActualizacion: 0,
                pagosActualizados: 0,
                flujos: parseFloat(flujosInput?.value) || 0,
                flujosDescFechaCompra: parseFloat(flujosDescFechaCompraInput?.value) || 0,
                flujosDescHoy: 0
            };
        } else {
            rowData = {
                tipo: tipo,
                fechaInicio: fechaInicio,
                fechaLiquidacion: fechaLiquidacion,
                fechaInicioCER: fechaInicioCER, // Inicio Intervalo
                fechaFinalCER: fechaFinalCER, // Final
                valorCER: parseFloat(inputs[4]?.value) || 0,
                dayCountFactor: parseFloat(inputs[5]?.value) || 0,
                amortizacion: parseFloat(inputs[6]?.value) || 0,
                valorResidual: parseFloat(inputs[7]?.value) || 0,
                amortizacionAjustada: parseFloat(inputs[8]?.value) || 0,
                rentaNominal: parseFloat(inputs[9]?.value) || 0,
                rentaTNA: parseFloat(inputs[10]?.value) || 0,
                rentaAjustada: parseFloat(inputs[11]?.value) || 0,
                factorActualizacion: parseFloat(inputs[12]?.value) || 0,
                pagosActualizados: parseFloat(inputs[13]?.value) || 0,
                flujos: parseFloat(inputs[14]?.value) || 0,
                flujosDescFechaCompra: parseFloat(inputs[15]?.value) || 0,
                flujosDescHoy: parseFloat(inputs[16]?.value) || 0
            };
        }
        
        // Truncar valores decimales a 8 decimales
        Object.keys(rowData).forEach(key => {
            if (typeof rowData[key] === 'number' && !isNaN(rowData[key]) && rowData[key] !== 0) {
                rowData[key] = window.truncarDecimal ? window.truncarDecimal(rowData[key], 8) : parseFloat(rowData[key].toFixed(8));
            }
        });
        
        datos.push(rowData);
    });
    
    return datos;
}

// Convertir número con coma a punto (para decimales)
function convertirNumeroDecimal(valor) {
    if (!valor || valor === '') return 0;
    // Reemplazar coma por punto
    const valorConvertido = String(valor).replace(',', '.');
    const numero = parseFloat(valorConvertido);
    return isNaN(numero) ? 0 : numero;
}

// Obtener datos de partida
function obtenerDatosPartida() {
    let fechaCompra = document.getElementById('fechaCompra')?.value || null;
    
    // Convertir de DD/MM/AAAA a YYYY-MM-DD para el backend
    if (fechaCompra && /^\d{2}\/\d{2}\/\d{4}$/.test(fechaCompra)) {
        fechaCompra = convertirFechaDDMMAAAAaYYYYMMDD(fechaCompra);
    }
    
    // Convertir precio con coma o punto
    const precioCompra = convertirNumeroDecimal(document.getElementById('precioCompra')?.value);
    
    return {
        fechaCompra: fechaCompra,
        precioCompra: precioCompra,
        cantidadPartida: parseFloat(document.getElementById('cantidadPartida')?.value) || 0
    };
}

// Obtener datos de especie
function obtenerDatosEspecie() {
    let fechaEmision = document.getElementById('fechaEmision')?.value || null;
    let fechaPrimeraRenta = document.getElementById('fechaPrimeraRenta')?.value || null;
    let fechaAmortizacion = document.getElementById('fechaAmortizacion')?.value || null;
    
    // Convertir de DD/MM/AAAA a YYYY-MM-DD para el backend
    if (fechaEmision && /^\d{2}\/\d{2}\/\d{4}$/.test(fechaEmision)) {
        fechaEmision = convertirFechaDDMMAAAAaYYYYMMDD(fechaEmision);
    }
    if (fechaPrimeraRenta && /^\d{2}\/\d{2}\/\d{4}$/.test(fechaPrimeraRenta)) {
        fechaPrimeraRenta = convertirFechaDDMMAAAAaYYYYMMDD(fechaPrimeraRenta);
    }
    if (fechaAmortizacion && /^\d{2}\/\d{2}\/\d{4}$/.test(fechaAmortizacion)) {
        fechaAmortizacion = convertirFechaDDMMAAAAaYYYYMMDD(fechaAmortizacion);
    }
    
    return {
        ticker: document.getElementById('ticker')?.value || '',
        fechaEmision: fechaEmision,
        tipoInteresDias: parseInt(document.getElementById('tipoInteresDias')?.value) || 360,
        spread: parseFloat(document.getElementById('spread')?.value) || 0,
        periodicidad: document.getElementById('periodicidad')?.value || '',
        fechaPrimeraRenta: fechaPrimeraRenta,
        fechaAmortizacion: fechaAmortizacion,
        intervaloInicio: parseInt(document.getElementById('intervaloInicio')?.value) || 0,
        intervaloFin: parseInt(document.getElementById('intervaloFin')?.value) || 0
    };
}

// Calcular TIR
async function calcularTIR() {
    try {
        // Obtener todos los datos
        const cashflow = obtenerDatosCashflow();
        const datosPartida = obtenerDatosPartida();
        const datosEspecie = obtenerDatosEspecie();
        
        // Validar que haya al menos la inversión inicial
        if (cashflow.length === 0) {
            showError('Debe agregar al menos la inversión inicial');
            return;
        }
        
        // Preparar flujos para el cálculo
        const flujos = cashflow.map(row => row.flujos);
        const fechas = cashflow.map(row => row.fechaLiquidacion);
        
        // Llamar a la API para calcular TIR
        const response = await fetch('/calcular-tir', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                flujos: flujos,
                fechas: fechas,
                datosPartida: datosPartida,
                datosEspecie: datosEspecie,
                cashflow: cashflow
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Mostrar resultado de TIR
            document.getElementById('resultadoTIR').textContent = result.tirPorcentaje + '%';
            
            // Aquí se calcularían y mostrarían los resultados adicionales
            // Por ahora mostramos valores de ejemplo
            document.getElementById('pagosEfectActualizados').textContent = formatNumber(0, 2);
            document.getElementById('precioCTHoyAjustado').textContent = formatNumber(0, 2);
            document.getElementById('precioCTAjustPagos').textContent = formatNumber(0, 2);
            document.getElementById('precioFlujosDescontados').textContent = formatNumber(0, 2);
            document.getElementById('precioTecnicoVencimiento').textContent = formatNumber(0, 2);
            
            // Generar tira de precios
            generarTiraPrecios(result.tir, cashflow, datosPartida);
            
            showSuccess('TIR calculada correctamente');
        } else {
            showError(result.error || 'Error al calcular TIR');
        }
    } catch (error) {
        console.error('Error al calcular TIR:', error);
        showError('Error al calcular TIR: ' + error.message);
    }
}

// Generar tira de precios
function generarTiraPrecios(tir, cashflow, datosPartida) {
    const tbody = document.getElementById('tiraPreciosBody');
    tbody.innerHTML = '';
    
    // Por ahora generamos filas de ejemplo
    // La lógica completa se implementará según los requerimientos específicos
    
    const fechaCompra = new Date(datosPartida.fechaCompra);
    const fechaVencimiento = new Date(cashflow[cashflow.length - 1].fechaLiquidacion);
    
    // Generar una fila por mes desde fecha compra hasta vencimiento
    let fechaActual = new Date(fechaCompra);
    
    while (fechaActual <= fechaVencimiento) {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${formatDate(fechaActual)}</td>
            <td>${formatNumber(0, 2)}</td>
            <td>${formatNumber(0, 2)}</td>
            <td>${formatNumber(0, 2)}</td>
            <td>${formatNumber(0, 2)}</td>
            <td>${formatNumber(0, 2)}</td>
            <td>${formatNumber(0, 2)}</td>
            <td>${formatNumber(0, 2)}</td>
            <td>${formatNumber(0, 2)}</td>
            <td>${formatNumber(0, 2)}</td>
        `;
        
        tbody.appendChild(row);
        
        // Avanzar un mes
        fechaActual.setMonth(fechaActual.getMonth() + 1);
    }
}

// Recopilar todos los datos del formulario para guardar
function recopilarDatosCalculadora() {
    const datos = {
        // Datos de Partida
        datosPartida: obtenerDatosPartida(),
        
        // Datos de Especie
        datosEspecie: obtenerDatosEspecie(),
        
        // Cashflow completo
        cashflow: obtenerDatosCashflow(),
        
        // Resultados (si están calculados)
        resultados: {
            tir: document.getElementById('resultadoTIR')?.textContent || null,
            pagosEfectActualizados: document.getElementById('pagosEfectActualizados')?.textContent || null,
            precioCTHoyAjustado: document.getElementById('precioCTHoyAjustado')?.textContent || null,
            precioCTAjustPagos: document.getElementById('precioCTAjustPagos')?.textContent || null,
            precioFlujosDescontados: document.getElementById('precioFlujosDescontados')?.textContent || null,
            precioTecnicoVencimiento: document.getElementById('precioTecnicoVencimiento')?.textContent || null
        },
        
        // Metadatos
        fechaCreacion: new Date().toISOString(),
        tipo: 'calculadora-cer'
    };
    
    return datos;
}

// Guardar calculadora
async function guardarCalculadora() {
    try {
        // Recopilar todos los datos
        const datos = recopilarDatosCalculadora();
        
        // Validar que haya datos mínimos
        if (!datos.datosPartida.fechaCompra && !datos.datosEspecie.ticker) {
            showError('Por favor complete al menos los datos de Partida o Especie');
            return;
        }
        
        // Pedir título al usuario usando modal
        const titulo = await pedirTituloModal();
        
        if (!titulo || titulo.trim() === '') {
            return; // Usuario canceló o no ingresó título
        }
        
        // Agregar título a los datos
        datos.titulo = titulo.trim();
        
        // Mostrar indicador de carga
        const btnGuardar = document.getElementById('btnGuardar');
        const textoOriginal = btnGuardar.innerHTML;
        btnGuardar.disabled = true;
        btnGuardar.innerHTML = '<span>Guardando...</span>';
        
        // Enviar al backend
        const response = await fetch('/api/calculadora/guardar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });
        
        const result = await response.json();
        
        // Restaurar botón
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = textoOriginal;
        
        if (result.success) {
            showSuccess('Calculadora guardada exitosamente');
            // Limpiar localStorage después de guardar exitosamente
            localStorage.removeItem('calculadoraCER_datos');
        } else {
            showError(result.error || 'Error al guardar la calculadora');
        }
        
    } catch (error) {
        console.error('Error al guardar calculadora:', error);
        showError('Error al guardar: ' + error.message);
        
        // Restaurar botón en caso de error
        const btnGuardar = document.getElementById('btnGuardar');
        if (btnGuardar) {
            btnGuardar.disabled = false;
        }
    }
}

// Pedir título usando modal con lista de calculadoras existentes
async function pedirTituloModal() {
    return new Promise(async (resolve) => {
        // Cargar lista de calculadoras existentes
        let calculadorasExistentes = [];
        try {
            const response = await fetch('/api/calculadora/listar');
            const result = await response.json();
            if (result.success && result.calculadoras) {
                calculadorasExistentes = result.calculadoras;
            }
        } catch (error) {
            console.warn('Error al cargar calculadoras existentes:', error);
        }
        
        // Crear modal
        const modal = document.createElement('div');
        modal.id = 'modalTitulo';
        modal.style.cssText = 'display: flex; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 10001; align-items: center; justify-content: center;';
        
        // Generar lista de calculadoras existentes
        let listaCalculadorasHTML = '';
        if (calculadorasExistentes.length > 0) {
            listaCalculadorasHTML = `
                <div style="margin-bottom: 16px; padding: 12px; background: #f1f3f4; border-radius: 8px; max-height: 200px; overflow-y: auto;">
                    <div style="font-size: 13px; font-weight: 500; color: var(--text-secondary); margin-bottom: 8px;">Calculadoras existentes (haga clic para sobreescribir):</div>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        ${calculadorasExistentes.map(calc => {
                            const fecha = new Date(calc.fecha_actualizacion || calc.fecha_creacion);
                            const fechaFormateada = fecha.toLocaleDateString('es-AR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                            });
                            return `
                                <div class="calculadora-existente" data-titulo="${String(calc.titulo).replace(/"/g, '&quot;')}" 
                                     style="padding: 8px 12px; background: white; border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer; transition: all 0.2s;"
                                     onmouseover="this.style.background='#e8f0fe'; this.style.borderColor='var(--primary-color)'"
                                     onmouseout="this.style.background='white'; this.style.borderColor='var(--border-color)'">
                                    <div style="font-weight: 500; color: var(--text-primary); font-size: 14px;">${String(calc.titulo).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                                    <div style="font-size: 12px; color: var(--text-secondary);">${calc.ticker ? `Ticker: ${calc.ticker} • ` : ''}${fechaFormateada}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }
        
        modal.innerHTML = `
            <div class="card" style="max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color);">
                    <h2 style="font-size: 20px; font-weight: 500; margin: 0;">Guardar Calculadora</h2>
                    <button id="btnCerrarTitulo" style="background: none; border: none; cursor: pointer; padding: 8px; border-radius: 50%; transition: background 0.2s;" onmouseover="this.style.background='#f1f3f4'" onmouseout="this.style.background='transparent'">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                ${listaCalculadorasHTML}
                <div style="margin-bottom: 24px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: var(--text-primary);">Título de la calculadora</label>
                    <input type="text" id="inputTitulo" class="input" placeholder="Ej: Bono TX26 - Enero 2024" style="width: 100%;" autofocus />
                </div>
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button class="btn" onclick="cerrarModalTitulo(null)" style="min-width: 100px;">Cancelar</button>
                    <button class="btn btn-primary" onclick="confirmarTitulo()" style="min-width: 100px;">Guardar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Agregar event listeners a calculadoras existentes
        modal.querySelectorAll('.calculadora-existente').forEach(item => {
            item.addEventListener('click', () => {
                const titulo = item.getAttribute('data-titulo');
                const inputTitulo = document.getElementById('inputTitulo');
                if (inputTitulo && titulo) {
                    inputTitulo.value = titulo;
                    inputTitulo.focus();
                }
            });
        });
        
        const inputTitulo = document.getElementById('inputTitulo');
        if (inputTitulo) {
            inputTitulo.focus();
            inputTitulo.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    confirmarTitulo();
                } else if (e.key === 'Escape') {
                    cerrarModalTitulo(null);
                }
            });
        }
        
        window.confirmarTitulo = () => {
            const titulo = inputTitulo?.value?.trim() || '';
            if (titulo) {
                cerrarModalTitulo(titulo);
            } else {
                showError('El título es requerido');
                inputTitulo?.focus();
            }
        };
        
        window.cerrarModalTitulo = (resultado) => {
            modal.remove();
            delete window.confirmarTitulo;
            delete window.cerrarModalTitulo;
            resolve(resultado);
        };
        
        document.getElementById('btnCerrarTitulo')?.addEventListener('click', () => cerrarModalTitulo(null));
    });
}

// Aplicar máscara DD/MM/AAAA mientras se escribe
function aplicarMascaraFecha(input) {
    if (!input) return;
    
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

// Abrir modal para cargar calculadoras
async function abrirModalCargar() {
    const modal = document.getElementById('modalCargar');
    if (!modal) return;
    
    modal.style.display = 'flex';
    
    // Cargar lista de calculadoras
    await cargarListaCalculadoras();
}

// Cerrar modal de cargar
function cerrarModalCargar() {
    const modal = document.getElementById('modalCargar');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Cargar lista de calculadoras guardadas
async function cargarListaCalculadoras() {
    const lista = document.getElementById('calculadorasLista');
    if (!lista) return;
    
    try {
        lista.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">Cargando calculadoras...</div>';
        
        const response = await fetch('/api/calculadora/listar');
        const result = await response.json();
        
        if (!result.success) {
            lista.innerHTML = `<div style="text-align: center; padding: 40px; color: #d93025;">Error: ${result.error || 'Error al cargar calculadoras'}</div>`;
            return;
        }
        
        if (!result.calculadoras || result.calculadoras.length === 0) {
            lista.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">No hay calculadoras guardadas</div>';
            return;
        }
        
        // Agrupar calculadoras por título para evitar duplicados
        const calculadorasUnicas = new Map();
        result.calculadoras.forEach(calc => {
            const titulo = calc.titulo;
            if (!calculadorasUnicas.has(titulo)) {
                calculadorasUnicas.set(titulo, calc);
            } else {
                // Si ya existe, mantener la más reciente
                const existente = calculadorasUnicas.get(titulo);
                const fechaExistente = new Date(existente.fecha_actualizacion || existente.fecha_creacion);
                const fechaNueva = new Date(calc.fecha_actualizacion || calc.fecha_creacion);
                if (fechaNueva > fechaExistente) {
                    calculadorasUnicas.set(titulo, calc);
                }
            }
        });
        
        // Convertir a array y ordenar por fecha
        const calculadorasArray = Array.from(calculadorasUnicas.values()).sort((a, b) => {
            const fechaA = new Date(a.fecha_actualizacion || a.fecha_creacion);
            const fechaB = new Date(b.fecha_actualizacion || b.fecha_creacion);
            return fechaB - fechaA;
        });
        
        // Generar lista de calculadoras
        let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';
        
        calculadorasArray.forEach((calc, index) => {
            const fecha = new Date(calc.fecha_actualizacion || calc.fecha_creacion);
            const fechaFormateada = fecha.toLocaleDateString('es-AR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Usar data attribute en lugar de onclick para evitar problemas de escape
            const tituloEscapado = String(calc.titulo).replace(/"/g, '&quot;');
            
            html += `
                <div class="calculadora-item" data-titulo="${tituloEscapado}" style="display: flex; justify-content: space-between; align-items: center; padding: 16px; border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; transition: all 0.2s;" 
                     onmouseover="this.style.background='#f1f3f4'" 
                     onmouseout="this.style.background='white'">
                    <div>
                        <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 4px;">${String(calc.titulo).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                        <div style="font-size: 13px; color: var(--text-secondary);">
                            ${calc.ticker ? `Ticker: ${String(calc.ticker).replace(/</g, '&lt;').replace(/>/g, '&gt;')} • ` : ''}${fechaFormateada}
                        </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="color: var(--primary-color);">
                        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                    </svg>
                </div>
            `;
        });
        
        html += '</div>';
        lista.innerHTML = html;
        
        // Agregar event listeners a los items de calculadora
        const calculadoraItems = lista.querySelectorAll('.calculadora-item');
        calculadoraItems.forEach(item => {
            item.addEventListener('click', () => {
                const titulo = item.getAttribute('data-titulo');
                if (titulo) {
                    cargarCalculadora(titulo);
                }
            });
        });
        
    } catch (error) {
        console.error('Error al cargar lista de calculadoras:', error);
        lista.innerHTML = `<div style="text-align: center; padding: 40px; color: #d93025;">Error al cargar calculadoras: ${error.message}</div>`;
    }
}

// Cargar una calculadora específica
async function cargarCalculadora(titulo) {
    try {
        console.log('📥 Cargando calculadora:', titulo);
        
        // Mostrar indicador de carga
        const lista = document.getElementById('calculadorasLista');
        if (lista) {
            lista.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">Cargando calculadora...</div>';
        }
        
        // Codificar el título correctamente
        const tituloCodificado = encodeURIComponent(titulo);
        const response = await fetch(`/api/calculadora/${tituloCodificado}`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success || !result.datos) {
            console.error('❌ Error al cargar calculadora:', result.error);
            showError(result.error || 'Error al cargar la calculadora');
            await cargarListaCalculadoras();
            return;
        }
        
        const datos = result.datos;
        console.log('✅ Datos recibidos:', datos);
        
        // Limpiar formulario actual
        limpiarFormulario();
        
        // Limpiar localStorage antes de cargar nueva calculadora
        localStorage.removeItem('calculadoraCER_datos');
        
        // Cargar datos de partida
        if (datos.datosPartida) {
            if (datos.datosPartida.fecha_compra) {
                const fechaCompraInput = document.getElementById('fechaCompra');
                if (fechaCompraInput) {
                    fechaCompraInput.value = convertirFechaYYYYMMDDaDDMMAAAA(datos.datosPartida.fecha_compra);
                }
            }
            if (datos.datosPartida.precio_compra !== undefined) {
                const precioCompraInput = document.getElementById('precioCompra');
                if (precioCompraInput) {
                    // Mantener el formato original (puede venir con punto o coma)
                    precioCompraInput.value = String(datos.datosPartida.precio_compra).replace('.', ',');
                }
            }
            if (datos.datosPartida.cantidad_partida !== undefined) {
                const cantidadPartidaInput = document.getElementById('cantidadPartida');
                if (cantidadPartidaInput) cantidadPartidaInput.value = datos.datosPartida.cantidad_partida;
            }
        }
        
        // Cargar datos de especie
        if (datos.datosEspecie) {
            if (datos.datosEspecie.ticker) {
                const tickerInput = document.getElementById('ticker');
                if (tickerInput) tickerInput.value = datos.datosEspecie.ticker;
            }
            if (datos.datosEspecie.fecha_emision) {
                const fechaEmisionInput = document.getElementById('fechaEmision');
                if (fechaEmisionInput) {
                    fechaEmisionInput.value = convertirFechaYYYYMMDDaDDMMAAAA(datos.datosEspecie.fecha_emision);
                }
            }
            if (datos.datosEspecie.tipo_interes_dias !== undefined) {
                const tipoInteresDiasInput = document.getElementById('tipoInteresDias');
                if (tipoInteresDiasInput) tipoInteresDiasInput.value = datos.datosEspecie.tipo_interes_dias;
            }
            if (datos.datosEspecie.spread !== undefined) {
                const spreadInput = document.getElementById('spread');
                if (spreadInput) spreadInput.value = datos.datosEspecie.spread;
            }
            if (datos.datosEspecie.periodicidad) {
                const periodicidadInput = document.getElementById('periodicidad');
                if (periodicidadInput) periodicidadInput.value = datos.datosEspecie.periodicidad;
            }
            if (datos.datosEspecie.fecha_primera_renta) {
                const fechaPrimeraRentaInput = document.getElementById('fechaPrimeraRenta');
                if (fechaPrimeraRentaInput) {
                    fechaPrimeraRentaInput.value = convertirFechaYYYYMMDDaDDMMAAAA(datos.datosEspecie.fecha_primera_renta);
                }
            }
            if (datos.datosEspecie.fecha_amortizacion) {
                const fechaAmortizacionInput = document.getElementById('fechaAmortizacion');
                if (fechaAmortizacionInput) {
                    fechaAmortizacionInput.value = convertirFechaYYYYMMDDaDDMMAAAA(datos.datosEspecie.fecha_amortizacion);
                }
            }
            if (datos.datosEspecie.intervalo_inicio !== undefined) {
                const intervaloInicioInput = document.getElementById('intervaloInicio');
                if (intervaloInicioInput) intervaloInicioInput.value = datos.datosEspecie.intervalo_inicio;
            }
            if (datos.datosEspecie.intervalo_fin !== undefined) {
                const intervaloFinInput = document.getElementById('intervaloFin');
                if (intervaloFinInput) intervaloFinInput.value = datos.datosEspecie.intervalo_fin;
            }
        }
        
        // Cargar cashflow (cupones y fila de inversión)
        if (datos.cashflow && datos.cashflow.length > 0) {
            // Limpiar cupones existentes
            const tbody = document.getElementById('cashflowBody');
            const filasCupones = tbody.querySelectorAll('tr[data-tipo="cupon"]');
            filasCupones.forEach(fila => fila.remove());
            cuponCount = 0;
            
            // Separar fila de inversión de cupones
            const filaInversion = datos.cashflow.find(row => row.tipo === 'inversion');
            const cupones = datos.cashflow.filter(row => row.tipo !== 'inversion');
            
            // Cargar fila de inversión si existe
            if (filaInversion) {
                if (filaInversion.fecha_liquidacion) {
                    const fechaLiquidacionInput = document.getElementById('fechaLiquidacion');
                    if (fechaLiquidacionInput) {
                        fechaLiquidacionInput.value = convertirFechaYYYYMMDDaDDMMAAAA(filaInversion.fecha_liquidacion);
                        aplicarMascaraFecha(fechaLiquidacionInput);
                    }
                }
                const valorCERInput = document.getElementById('valorCER');
                if (valorCERInput && filaInversion.valor_cer !== undefined) {
                    valorCERInput.value = filaInversion.valor_cer || '';
                }
                const flujosInput = document.getElementById('flujos');
                if (flujosInput && filaInversion.flujos !== undefined) {
                    flujosInput.value = filaInversion.flujos || '';
                }
                const flujosDescFechaCompraInput = document.getElementById('flujosDescFechaCompra');
                if (flujosDescFechaCompraInput && filaInversion.flujos_desc_fecha_compra !== undefined) {
                    flujosDescFechaCompraInput.value = filaInversion.flujos_desc_fecha_compra || '';
                }
            }
            
            // Agregar cada cupón
            for (const cupon of cupones) {
                cuponCount++;
                
                const row = document.createElement('tr');
                row.setAttribute('data-cupon-id', cuponCount);
                row.setAttribute('data-tipo', 'cupon');
                
                const fechaInicioStr = convertirFechaYYYYMMDDaDDMMAAAA(cupon.fecha_inicio);
                const fechaLiquidacionStr = convertirFechaYYYYMMDDaDDMMAAAA(cupon.fecha_liquidacion);
                
                row.innerHTML = `
                    <td>
                        <div style="position: relative;">
                            <input type="text" class="input-table date-input fecha-inicio" id="fechaInicio${cuponCount}" value="${fechaInicioStr || ''}" style="padding-right: 40px;" placeholder="DD/MM/AAAA" maxlength="10" onchange="calcularDayCountFactor(this)" />
                            <button type="button" class="date-picker-icon" onclick="abrirDatePicker('fechaInicio${cuponCount}')" title="Seleccionar fecha" style="right: 4px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                                </svg>
                            </button>
                            <div id="datePickerFechaInicio${cuponCount}" class="date-picker-popup" style="display: none;"></div>
                        </div>
                    </td>
                    <td>
                        <div style="position: relative;">
                            <input type="text" class="input-table date-input fecha-liquidacion" id="fechaLiquidacion${cuponCount}" value="${fechaLiquidacionStr || ''}" style="padding-right: 40px;" placeholder="DD/MM/AAAA" maxlength="10" onchange="calcularDayCountFactor(this)" />
                            <button type="button" class="date-picker-icon" onclick="abrirDatePicker('fechaLiquidacion${cuponCount}')" title="Seleccionar fecha" style="right: 4px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                                </svg>
                            </button>
                            <div id="datePickerFechaLiquidacion${cuponCount}" class="date-picker-popup" style="display: none;"></div>
                        </div>
                    </td>
                    <td>
                        <div style="position: relative;">
                            <input type="text" class="input-table date-input fecha-inicio-cer" readonly style="padding-right: 40px;" placeholder="DD/MM/AAAA" maxlength="10" />
                        </div>
                    </td>
                    <td>
                        <div style="position: relative;">
                            <input type="text" class="input-table date-input fecha-final-cer" readonly style="padding-right: 40px;" placeholder="DD/MM/AAAA" maxlength="10" />
                        </div>
                    </td>
                    <td><input type="number" class="input-table" step="0.0001" /></td>
                    <td><input type="number" class="input-table day-count-factor" readonly /></td>
                    <td><input type="number" class="input-table" step="0.01" value="${cupon.amortizacion || ''}" /></td>
                    <td><input type="number" class="input-table" step="0.01" /></td>
                    <td><input type="number" class="input-table" step="0.01" /></td>
                    <td><input type="number" class="input-table" step="0.01" /></td>
                    <td><input type="number" class="input-table" step="0.01" value="${cupon.renta_tna || ''}" /></td>
                    <td><input type="number" class="input-table" step="0.01" /></td>
                    <td><input type="number" class="input-table" step="0.0001" /></td>
                    <td><input type="number" class="input-table" step="0.01" /></td>
                    <td><input type="number" class="input-table" step="0.01" /></td>
                    <td><input type="number" class="input-table" step="0.01" /></td>
                    <td><input type="number" class="input-table" step="0.01" /></td>
                    <td>
                        <button onclick="eliminarCupon(${cuponCount})" class="btn" style="min-width: auto; padding: 6px 12px; height: 32px;" title="Eliminar cupón">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                        </button>
                    </td>
                `;
                
                tbody.appendChild(row);
                
                // Aplicar máscara a los campos de fecha
                const fechaInputs = row.querySelectorAll('.date-input');
                fechaInputs.forEach(input => {
                    aplicarMascaraFecha(input);
                });
                
                // Calcular Day Count Factor si hay fechas
                const fechaInicioInput = row.querySelector('.fecha-inicio');
                const fechaLiquidacionInput = row.querySelector('.fecha-liquidacion');
                if (fechaInicioInput && fechaLiquidacionInput && fechaInicioInput.value && fechaLiquidacionInput.value) {
                    calcularDayCountFactor(fechaLiquidacionInput);
                }
            }
            
            // Calcular fechas CER
            calcularFechasCER();
        }
        
        // Aplicar máscaras a todos los campos de fecha después de cargar
        const fechaInputs = document.querySelectorAll('.date-input');
        fechaInputs.forEach(input => {
            aplicarMascaraFecha(input);
        });
        
        // Guardar en localStorage después de cargar
        guardarDatosLocalStorage();
        
        // Cerrar modal
        cerrarModalCargar();
        
        showSuccess(`Calculadora "${titulo}" cargada exitosamente`);
        
    } catch (error) {
        console.error('Error al cargar calculadora:', error);
        showError('Error al cargar la calculadora: ' + error.message);
        await cargarListaCalculadoras();
    }
}

// Limpiar formulario
function limpiarFormulario() {
    // Limpiar datos de partida
    const fechaCompraInput = document.getElementById('fechaCompra');
    if (fechaCompraInput) fechaCompraInput.value = '';
    const precioCompraInput = document.getElementById('precioCompra');
    if (precioCompraInput) precioCompraInput.value = '';
    const cantidadPartidaInput = document.getElementById('cantidadPartida');
    if (cantidadPartidaInput) cantidadPartidaInput.value = '';
    
    // Limpiar datos de especie
    const tickerInput = document.getElementById('ticker');
    if (tickerInput) tickerInput.value = '';
    const fechaEmisionInput = document.getElementById('fechaEmision');
    if (fechaEmisionInput) fechaEmisionInput.value = '';
    const tipoInteresDiasInput = document.getElementById('tipoInteresDias');
    if (tipoInteresDiasInput) tipoInteresDiasInput.value = '';
    const spreadInput = document.getElementById('spread');
    if (spreadInput) spreadInput.value = '';
    const periodicidadInput = document.getElementById('periodicidad');
    if (periodicidadInput) periodicidadInput.value = '';
    const fechaPrimeraRentaInput = document.getElementById('fechaPrimeraRenta');
    if (fechaPrimeraRentaInput) fechaPrimeraRentaInput.value = '';
    const fechaAmortizacionInput = document.getElementById('fechaAmortizacion');
    if (fechaAmortizacionInput) fechaAmortizacionInput.value = '';
    const intervaloInicioInput = document.getElementById('intervaloInicio');
    if (intervaloInicioInput) intervaloInicioInput.value = '';
    const intervaloFinInput = document.getElementById('intervaloFin');
    if (intervaloFinInput) intervaloFinInput.value = '';
    
    // Limpiar cupones (excepto la fila de inversión)
    const tbody = document.getElementById('cashflowBody');
    const filasCupones = tbody.querySelectorAll('tr[data-tipo="cupon"]');
    filasCupones.forEach(fila => fila.remove());
    cuponCount = 0;
}

// Cerrar modal al hacer clic fuera o presionar ESC
document.addEventListener('click', (e) => {
    const modal = document.getElementById('modalCargar');
    if (modal && e.target === modal) {
        cerrarModalCargar();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('modalCargar');
        if (modal && modal.style.display === 'flex') {
            cerrarModalCargar();
        }
    }
});

// Guardar datos en localStorage
function guardarDatosLocalStorage() {
    try {
        // Obtener datos de partida (mantener formato original del precio)
        let fechaCompra = document.getElementById('fechaCompra')?.value || null;
        const precioCompraRaw = document.getElementById('precioCompra')?.value || '';
        const cantidadPartida = parseFloat(document.getElementById('cantidadPartida')?.value) || 0;
        
        // Convertir fecha si es necesario
        if (fechaCompra && /^\d{2}\/\d{2}\/\d{4}$/.test(fechaCompra)) {
            fechaCompra = convertirFechaDDMMAAAAaYYYYMMDD(fechaCompra);
        }
        
        const datosPartida = {
            fechaCompra: fechaCompra,
            precioCompra: precioCompraRaw, // Mantener formato original (puede tener coma o punto)
            cantidadPartida: cantidadPartida
        };
        
        // Obtener datos de especie
        const datosEspecie = obtenerDatosEspecie();
        
        // Obtener cashflow
        const cashflow = obtenerDatosCashflow();
        
        const datos = {
            datosPartida: datosPartida,
            datosEspecie: datosEspecie,
            cashflow: cashflow
        };
        
        localStorage.setItem('calculadoraCER_datos', JSON.stringify(datos));
    } catch (error) {
        console.error('Error al guardar en localStorage:', error);
    }
}

// Cargar datos desde localStorage
function cargarDatosLocalStorage() {
    try {
        const datosGuardados = localStorage.getItem('calculadoraCER_datos');
        if (!datosGuardados) return;
        
        const datos = JSON.parse(datosGuardados);
        
        // Cargar datos de partida
        if (datos.datosPartida) {
            if (datos.datosPartida.fechaCompra) {
                const fechaCompraInput = document.getElementById('fechaCompra');
                if (fechaCompraInput) {
                    fechaCompraInput.value = convertirFechaYYYYMMDDaDDMMAAAA(datos.datosPartida.fechaCompra);
                    aplicarMascaraFecha(fechaCompraInput);
                }
            }
            if (datos.datosPartida.precioCompra !== undefined && datos.datosPartida.precioCompra !== '') {
                const precioCompraInput = document.getElementById('precioCompra');
                if (precioCompraInput) {
                    // Mantener el formato original guardado (puede tener coma o punto)
                    precioCompraInput.value = String(datos.datosPartida.precioCompra);
                }
            }
            if (datos.datosPartida.cantidadPartida !== undefined) {
                const cantidadPartidaInput = document.getElementById('cantidadPartida');
                if (cantidadPartidaInput) cantidadPartidaInput.value = datos.datosPartida.cantidadPartida;
            }
        }
        
        // Cargar datos de especie
        if (datos.datosEspecie) {
            if (datos.datosEspecie.ticker) {
                const tickerInput = document.getElementById('ticker');
                if (tickerInput) tickerInput.value = datos.datosEspecie.ticker;
            }
            if (datos.datosEspecie.fechaEmision) {
                const fechaEmisionInput = document.getElementById('fechaEmision');
                if (fechaEmisionInput) {
                    fechaEmisionInput.value = convertirFechaYYYYMMDDaDDMMAAAA(datos.datosEspecie.fechaEmision);
                    aplicarMascaraFecha(fechaEmisionInput);
                }
            }
            if (datos.datosEspecie.tipoInteresDias !== undefined) {
                const tipoInteresDiasInput = document.getElementById('tipoInteresDias');
                if (tipoInteresDiasInput) tipoInteresDiasInput.value = datos.datosEspecie.tipoInteresDias;
            }
            if (datos.datosEspecie.spread !== undefined) {
                const spreadInput = document.getElementById('spread');
                if (spreadInput) spreadInput.value = datos.datosEspecie.spread;
            }
            if (datos.datosEspecie.periodicidad) {
                const periodicidadInput = document.getElementById('periodicidad');
                if (periodicidadInput) periodicidadInput.value = datos.datosEspecie.periodicidad;
            }
            if (datos.datosEspecie.fechaPrimeraRenta) {
                const fechaPrimeraRentaInput = document.getElementById('fechaPrimeraRenta');
                if (fechaPrimeraRentaInput) {
                    fechaPrimeraRentaInput.value = convertirFechaYYYYMMDDaDDMMAAAA(datos.datosEspecie.fechaPrimeraRenta);
                    aplicarMascaraFecha(fechaPrimeraRentaInput);
                }
            }
            if (datos.datosEspecie.fechaAmortizacion) {
                const fechaAmortizacionInput = document.getElementById('fechaAmortizacion');
                if (fechaAmortizacionInput) {
                    fechaAmortizacionInput.value = convertirFechaYYYYMMDDaDDMMAAAA(datos.datosEspecie.fechaAmortizacion);
                    aplicarMascaraFecha(fechaAmortizacionInput);
                }
            }
            if (datos.datosEspecie.intervaloInicio !== undefined) {
                const intervaloInicioInput = document.getElementById('intervaloInicio');
                if (intervaloInicioInput) intervaloInicioInput.value = datos.datosEspecie.intervaloInicio;
            }
            if (datos.datosEspecie.intervaloFin !== undefined) {
                const intervaloFinInput = document.getElementById('intervaloFin');
                if (intervaloFinInput) intervaloFinInput.value = datos.datosEspecie.intervaloFin;
            }
        }
        
        // Cargar datos de la fila de inversión
        if (datos.cashflow && datos.cashflow.length > 0) {
            const filaInversion = datos.cashflow.find(row => row.tipo === 'inversion');
            if (filaInversion) {
                // fechaLiquidacion está en el input con id="fechaLiquidacion"
                if (filaInversion.fechaLiquidacion) {
                    const fechaLiquidacionInput = document.getElementById('fechaLiquidacion');
                    if (fechaLiquidacionInput) {
                        fechaLiquidacionInput.value = convertirFechaYYYYMMDDaDDMMAAAA(filaInversion.fechaLiquidacion);
                        // Aplicar máscara si es un campo date-input
                        if (fechaLiquidacionInput.classList.contains('date-input')) {
                            aplicarMascaraFecha(fechaLiquidacionInput);
                        }
                    }
                }
                // valorCER tiene id="valorCER"
                if (filaInversion.valorCER !== undefined) {
                    const valorCERInput = document.getElementById('valorCER');
                    if (valorCERInput) valorCERInput.value = filaInversion.valorCER || '';
                }
                // flujos tiene id="flujos"
                if (filaInversion.flujos !== undefined) {
                    const flujosInput = document.getElementById('flujos');
                    if (flujosInput) flujosInput.value = filaInversion.flujos || '';
                }
                // flujosDescFechaCompra tiene id="flujosDescFechaCompra"
                if (filaInversion.flujosDescFechaCompra !== undefined) {
                    const flujosDescFechaCompraInput = document.getElementById('flujosDescFechaCompra');
                    if (flujosDescFechaCompraInput) flujosDescFechaCompraInput.value = filaInversion.flujosDescFechaCompra || '';
                }
            }
        }
        
        // Cargar cupones desde localStorage
        if (datos.cashflow && datos.cashflow.length > 0) {
            // Limpiar cupones existentes (excepto la fila de inversión)
            const tbody = document.getElementById('cashflowBody');
            const filasCupones = tbody.querySelectorAll('tr[data-tipo="cupon"]');
            filasCupones.forEach(fila => fila.remove());
            cuponCount = 0;
            
            // Agregar cada cupón guardado
            for (const cupon of datos.cashflow) {
                if (cupon.tipo === 'cupon' && cupon.fechaInicio && cupon.fechaLiquidacion) {
                    cuponCount++;
                    
                    const row = document.createElement('tr');
                    row.setAttribute('data-cupon-id', cuponCount);
                    row.setAttribute('data-tipo', 'cupon');
                    
                    // Convertir fechas de YYYY-MM-DD a DD/MM/AAAA
                    const fechaInicioDDMM = convertirFechaYYYYMMDDaDDMMAAAA(cupon.fechaInicio);
                    const fechaLiquidacionDDMM = convertirFechaYYYYMMDDaDDMMAAAA(cupon.fechaLiquidacion);
                    
                    row.innerHTML = `
                        <td>
                            <div style="position: relative;">
                                <input type="text" class="input-table date-input fecha-inicio" id="fechaInicio${cuponCount}" value="${fechaInicioDDMM || ''}" style="padding-right: 40px;" placeholder="DD/MM/AAAA" maxlength="10" onchange="calcularDayCountFactor(this)" />
                                <button type="button" class="date-picker-icon" onclick="abrirDatePicker('fechaInicio${cuponCount}')" title="Seleccionar fecha" style="right: 4px;">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                                    </svg>
                                </button>
                                <div id="datePickerFechaInicio${cuponCount}" class="date-picker-popup" style="display: none;"></div>
                            </div>
                        </td>
                        <td>
                            <div style="position: relative;">
                                <input type="text" class="input-table date-input fecha-liquidacion" id="fechaLiquidacion${cuponCount}" value="${fechaLiquidacionDDMM || ''}" style="padding-right: 40px;" placeholder="DD/MM/AAAA" maxlength="10" onchange="calcularDayCountFactor(this)" />
                                <button type="button" class="date-picker-icon" onclick="abrirDatePicker('fechaLiquidacion${cuponCount}')" title="Seleccionar fecha" style="right: 4px;">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                                    </svg>
                                </button>
                                <div id="datePickerFechaLiquidacion${cuponCount}" class="date-picker-popup" style="display: none;"></div>
                            </div>
                        </td>
                        <td>
                            <div style="position: relative;">
                                <input type="text" class="input-table date-input fecha-inicio-cer" readonly style="padding-right: 40px;" placeholder="DD/MM/AAAA" maxlength="10" />
                            </div>
                        </td>
                        <td>
                            <div style="position: relative;">
                                <input type="text" class="input-table date-input fecha-final-cer" readonly style="padding-right: 40px;" placeholder="DD/MM/AAAA" maxlength="10" />
                            </div>
                        </td>
                        <td><input type="number" class="input-table" step="0.0001" value="${cupon.valorCER || ''}" /></td>
                        <td><input type="number" class="input-table day-count-factor" readonly value="${cupon.dayCountFactor || ''}" /></td>
                        <td><input type="number" class="input-table" step="0.01" value="${cupon.amortizacion || ''}" /></td>
                        <td><input type="number" class="input-table" step="0.01" value="${cupon.valorResidual || ''}" /></td>
                        <td><input type="number" class="input-table" step="0.01" value="${cupon.amortizacionAjustada || ''}" /></td>
                        <td><input type="number" class="input-table" step="0.01" value="${cupon.rentaNominal || ''}" /></td>
                        <td><input type="number" class="input-table" step="0.01" value="${cupon.rentaTNA || ''}" /></td>
                        <td><input type="number" class="input-table" step="0.01" value="${cupon.rentaAjustada || ''}" /></td>
                        <td><input type="number" class="input-table" step="0.0001" value="${cupon.factorActualizacion || ''}" /></td>
                        <td><input type="number" class="input-table" step="0.01" value="${cupon.pagosActualizados || ''}" /></td>
                        <td><input type="number" class="input-table" step="0.01" value="${cupon.flujos || ''}" /></td>
                        <td><input type="number" class="input-table" step="0.01" value="${cupon.flujosDescFechaCompra || ''}" /></td>
                        <td><input type="number" class="input-table" step="0.01" value="${cupon.flujosDescHoy || ''}" /></td>
                        <td>
                            <button onclick="eliminarCupon(${cuponCount})" class="btn" style="min-width: auto; padding: 6px 12px; height: 32px;" title="Eliminar cupón">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                </svg>
                            </button>
                        </td>
                    `;
                    
                    tbody.appendChild(row);
                    
                    // Aplicar máscara a los campos de fecha
                    const fechaInputs = row.querySelectorAll('.date-input');
                    fechaInputs.forEach(input => {
                        aplicarMascaraFecha(input);
                    });
                    
                    // Calcular Day Count Factor si hay fechas
                    const fechaInicioInput = row.querySelector('.fecha-inicio');
                    const fechaLiquidacionInput = row.querySelector('.fecha-liquidacion');
                    if (fechaInicioInput && fechaLiquidacionInput && fechaInicioInput.value && fechaLiquidacionInput.value) {
                        calcularDayCountFactor(fechaLiquidacionInput);
                    }
                }
            }
            
            // Calcular fechas CER después de cargar todos los cupones
            setTimeout(() => {
                calcularFechasCER();
            }, 100);
        }
        
    } catch (error) {
        console.error('Error al cargar desde localStorage:', error);
    }
}

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    console.log('Calculadora CER inicializada');
    
    // Cargar feriados y CER desde BD al iniciar
    cargarDatosDesdeBD();
    
    // Cargar datos guardados desde localStorage
    cargarDatosLocalStorage();
    
    // Aplicar máscara a todos los campos de fecha
    const fechaInputs = document.querySelectorAll('.date-input');
    fechaInputs.forEach(input => {
        aplicarMascaraFecha(input);
    });
    
    // Guardar datos automáticamente cuando cambian los campos
    const camposGuardar = [
        'fechaCompra', 'precioCompra', 'cantidadPartida',
        'ticker', 'fechaEmision', 'tipoInteresDias', 'spread', 
        'periodicidad', 'fechaPrimeraRenta', 'fechaAmortizacion',
        'intervaloInicio', 'intervaloFin'
    ];
    
    camposGuardar.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.addEventListener('input', () => {
                guardarDatosLocalStorage();
            });
            campo.addEventListener('change', () => {
                guardarDatosLocalStorage();
            });
        }
    });
    
    // Guardar cuando se agregan o eliminan cupones (con debounce para evitar demasiadas llamadas)
    let timeoutGuardar = null;
    const observer = new MutationObserver(() => {
        if (timeoutGuardar) clearTimeout(timeoutGuardar);
        timeoutGuardar = setTimeout(() => {
            guardarDatosLocalStorage();
        }, 500); // Esperar 500ms después del último cambio
    });
    
    const cashflowBody = document.getElementById('cashflowBody');
    if (cashflowBody) {
        observer.observe(cashflowBody, { childList: true, subtree: true });
    }
    
    // Guardar también cuando cambian valores en los inputs de la tabla
    if (cashflowBody) {
        cashflowBody.addEventListener('input', () => {
            if (timeoutGuardar) clearTimeout(timeoutGuardar);
            timeoutGuardar = setTimeout(() => {
                guardarDatosLocalStorage();
            }, 500);
        });
    }
    
    // Event listener para recalcular Day Count Factor cuando cambie tipoInteresDias
    const tipoInteresDiasInput = document.getElementById('tipoInteresDias');
    if (tipoInteresDiasInput) {
        tipoInteresDiasInput.addEventListener('change', () => {
            // Recalcular Day Count Factor en todas las filas
            const rows = document.querySelectorAll('#cashflowBody tr[data-tipo="cupon"]');
            rows.forEach(row => {
                const fechaLiquidacionInput = row.querySelector('.fecha-liquidacion');
                if (fechaLiquidacionInput && fechaLiquidacionInput.value) {
                    calcularDayCountFactor(fechaLiquidacionInput);
                }
            });
            guardarDatosLocalStorage();
        });
    }
    
    // Autocompletar fechaLiquidacion con fechaCompra
    const fechaCompraInput = document.getElementById('fechaCompra');
    const fechaLiquidacionInput = document.getElementById('fechaLiquidacion');
    if (fechaCompraInput && fechaLiquidacionInput) {
        fechaCompraInput.addEventListener('change', () => {
            if (fechaCompraInput.value && !fechaLiquidacionInput.value) {
                fechaLiquidacionInput.value = fechaCompraInput.value;
                aplicarMascaraFecha(fechaLiquidacionInput);
            }
        });
    }
    
    // Autoajustar columnas de la tabla según contenido
    function autoajustarColumnas() {
        const tabla = document.getElementById('cashflowTable');
        if (!tabla) return;
        
        const thead = tabla.querySelector('thead');
        const tbody = tabla.querySelector('tbody');
        if (!thead || !tbody) return;
        
        const headers = thead.querySelectorAll('th');
        const filas = tbody.querySelectorAll('tr');
        
        headers.forEach((header, colIndex) => {
            let maxWidth = 0;
            let tieneContenido = false;
            
            // Verificar ancho del header
            const headerText = header.textContent || '';
            if (headerText.trim() !== '') {
                tieneContenido = true;
                maxWidth = Math.max(maxWidth, headerText.length * 8 + 20);
            }
            
            // Verificar ancho de las celdas
            filas.forEach(fila => {
                const celda = fila.cells[colIndex];
                if (celda) {
                    const input = celda.querySelector('input');
                    const span = celda.querySelector('span');
                    const elemento = input || span;
                    if (elemento) {
                        const valor = elemento.value || elemento.textContent || '';
                        if (valor.trim() !== '') {
                            tieneContenido = true;
                            // Calcular ancho aproximado basado en contenido
                            const anchoAprox = Math.max(50, valor.length * 8 + 20);
                            maxWidth = Math.max(maxWidth, anchoAprox);
                        }
                    }
                }
            });
            
            // Aplicar ancho mínimo si no hay contenido, ancho calculado si hay
            if (!tieneContenido) {
                header.style.minWidth = '30px';
                header.style.width = '30px';
            } else {
                header.style.minWidth = Math.max(80, maxWidth) + 'px';
                header.style.width = 'auto';
            }
        });
    }
    
    // Ejecutar autoajuste al cargar y después de cambios
    setTimeout(autoajustarColumnas, 500);
    
    // Observar cambios en la tabla para reajustar
    const tabla = document.getElementById('cashflowTable');
    const tbody = tabla ? tabla.querySelector('tbody') : null;
    if (tbody) {
        const observerTabla = new MutationObserver(() => {
            setTimeout(autoajustarColumnas, 100);
        });
        observerTabla.observe(tbody, { childList: true, subtree: true });
    }
    
    // Función para truncar decimales a 8 (global)
    window.truncarDecimal = function(numero, decimales = 8) {
        if (numero === null || numero === undefined || numero === '') return numero;
        const num = parseFloat(numero);
        if (isNaN(num)) return numero;
        return parseFloat(num.toFixed(decimales));
    };
    
    // Aplicar truncado a inputs numéricos al cambiar
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('blur', () => {
            if (input.value && !isNaN(parseFloat(input.value))) {
                const valorTruncado = window.truncarDecimal ? window.truncarDecimal(input.value, 8) : parseFloat(parseFloat(input.value).toFixed(8));
                if (valorTruncado !== parseFloat(input.value)) {
                    input.value = valorTruncado;
                }
            }
        });
    });
    
    // Guardar datos cuando se cambia de solapa o se cierra la página
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            // Guardar datos antes de cambiar de solapa
            guardarDatosLocalStorage();
        }
    });
    
    // Guardar datos antes de cerrar la página
    window.addEventListener('beforeunload', () => {
        guardarDatosLocalStorage();
    });
    
    // Guardar datos periódicamente (cada 30 segundos) como respaldo
    setInterval(() => {
        guardarDatosLocalStorage();
    }, 30000);
    
    // No hacer llamadas automáticas a las APIs
});

