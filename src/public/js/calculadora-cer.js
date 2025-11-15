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
        <td><input type="date" class="input-table fecha-inicio" onchange="calcularDayCountFactor(this)" /></td>
        <td><input type="date" class="input-table fecha-liquidacion" onchange="calcularDayCountFactor(this)" /></td>
        <td><input type="date" class="input-table fecha-inicio-cer" readonly /></td>
        <td><input type="date" class="input-table fecha-final-cer" readonly /></td>
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

// Formatear fecha para input date (YYYY-MM-DD)
// Maneja correctamente las fechas sin problemas de zona horaria
function formatearFechaInput(fecha) {
    if (!fecha) return '';
    
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
    
    const inputs = row.querySelectorAll('input');
    const fechaInicioInput = inputs[0]; // Fecha Inicio
    const fechaLiquidacionInput = inputs[1]; // Fecha Liquidación
    const dayCountFactorInput = row.querySelector('.day-count-factor');
    
    if (!fechaInicioInput || !fechaLiquidacionInput || !dayCountFactorInput) return;
    
    const fechaInicio = fechaInicioInput.value;
    const fechaLiquidacion = fechaLiquidacionInput.value;
    
    if (!fechaInicio || !fechaLiquidacion) {
        dayCountFactorInput.value = '';
        return;
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
            const inputs = row.querySelectorAll('input');
            const fechaInicio = inputs[0]?.value;
            const fechaLiquidacion = inputs[1]?.value;
            
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
        const inputs = row.querySelectorAll('input');
        const fechaInicio = inputs[0]?.value;
        const fechaLiquidacion = inputs[1]?.value;
        
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
        const inputs = row.querySelectorAll('input');
        const fechaInicioInput = inputs[0]; // Fecha Inicio
        const fechaLiquidacionInput = inputs[1]; // Fecha Liquidación
        const fechaInicioCERInput = inputs[2]; // Inicio Intervalo
        const fechaFinalCERInput = inputs[3]; // Final
        
        if (!fechaInicioInput || !fechaLiquidacionInput || !fechaInicioCERInput || !fechaFinalCERInput) continue;
        
        const fechaInicio = fechaInicioInput.value;
        const fechaLiquidacion = fechaLiquidacionInput.value;
        
        if (!fechaInicio || !fechaLiquidacion) {
            fechaInicioCERInput.value = '';
            fechaFinalCERInput.value = '';
            continue;
        }
        
        // Calcular fechas CER usando días hábiles (síncrono, usa cache)
        const fechaInicioDate = crearFechaDesdeString(fechaInicio);
        const fechaLiquidacionDate = crearFechaDesdeString(fechaLiquidacion);
        
        if (fechaInicioDate && fechaLiquidacionDate) {
            // Fecha Inicio CER = Fecha Inicio + intervaloInicio días hábiles
            const fechaInicioCER = calcularFechaConDiasHabiles(fechaInicioDate, intervaloInicio, feriados);
            if (fechaInicioCER) {
                fechaInicioCERInput.value = formatearFechaInput(fechaInicioCER);
            }
            
            // Fecha Final CER = Fecha Liquidación + intervaloFin días hábiles
            const fechaFinalCER = calcularFechaConDiasHabiles(fechaLiquidacionDate, intervaloFin, feriados);
            if (fechaFinalCER) {
                fechaFinalCERInput.value = formatearFechaInput(fechaFinalCER);
            }
        }
    }
}

// Autocompletar cupones basándose en datos de especie
async function autocompletarCupones() {
    try {
        // Obtener datos necesarios
        const fechaEmision = document.getElementById('fechaEmision')?.value;
        const periodicidad = document.getElementById('periodicidad')?.value;
        const fechaPrimeraRenta = document.getElementById('fechaPrimeraRenta')?.value;
        const fechaAmortizacion = document.getElementById('fechaAmortizacion')?.value;
        const fechaCompra = document.getElementById('fechaCompra')?.value; // Opcional
        
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
            
            row.innerHTML = `
                <td><input type="date" class="input-table fecha-inicio" value="${fechaInicioStr}" onchange="calcularDayCountFactor(this)" /></td>
                <td><input type="date" class="input-table fecha-liquidacion" value="${fechaLiquidacionStr}" onchange="calcularDayCountFactor(this)" /></td>
                <td><input type="date" class="input-table fecha-inicio-cer" readonly /></td>
                <td><input type="date" class="input-table fecha-final-cer" readonly /></td>
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
            const inputs = row.querySelectorAll('input');
            if (inputs[0].value && inputs[1].value) {
                calcularDayCountFactor(inputs[1]);
                calcularFechasCER().catch(console.error);
            }
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
        const inputs = row.querySelectorAll('input');
        const tipo = row.getAttribute('data-tipo');
        
        const rowData = {
            tipo: tipo,
            fechaInicio: inputs[0]?.value || null,
            fechaLiquidacion: inputs[1]?.value || null,
            fechaInicioCER: inputs[2]?.value || null, // Inicio Intervalo
            fechaFinalCER: inputs[3]?.value || null, // Final
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
        
        datos.push(rowData);
    });
    
    return datos;
}

// Obtener datos de partida
function obtenerDatosPartida() {
    return {
        fechaCompra: document.getElementById('fechaCompra')?.value || null,
        precioCompra: parseFloat(document.getElementById('precioCompra')?.value) || 0,
        cantidadPartida: parseFloat(document.getElementById('cantidadPartida')?.value) || 0
    };
}

// Obtener datos de especie
function obtenerDatosEspecie() {
    return {
        ticker: document.getElementById('ticker')?.value || '',
        fechaEmision: document.getElementById('fechaEmision')?.value || null,
        tipoInteresDias: parseInt(document.getElementById('tipoInteresDias')?.value) || 360,
        spread: parseFloat(document.getElementById('spread')?.value) || 0,
        periodicidad: document.getElementById('periodicidad')?.value || '',
        fechaPrimeraRenta: document.getElementById('fechaPrimeraRenta')?.value || null,
        fechaAmortizacion: document.getElementById('fechaAmortizacion')?.value || null,
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

// Guardar calculadora (guardar o guardar copia)
async function guardarCalculadora(esCopia = false) {
    try {
        // Recopilar todos los datos
        const datos = recopilarDatosCalculadora();
        
        // Validar que haya datos mínimos
        if (!datos.datosPartida.fechaCompra && !datos.datosEspecie.ticker) {
            showError('Por favor complete al menos los datos de Partida o Especie');
            return;
        }
        
        // Si es copia, agregar indicador
        if (esCopia) {
            datos.esCopia = true;
            datos.nombre = datos.datosEspecie.ticker 
                ? `${datos.datosEspecie.ticker} - Copia ${new Date().toLocaleString()}`
                : `Calculadora - Copia ${new Date().toLocaleString()}`;
        }
        
        // Mostrar indicador de carga
        const btnGuardar = document.getElementById(esCopia ? 'btnGuardarCopia' : 'btnGuardar');
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
            showSuccess(esCopia ? 'Copia guardada exitosamente' : 'Calculadora guardada exitosamente');
            
            // Si no es copia y hay un ID, guardarlo para futuras actualizaciones
            if (!esCopia && result.id) {
                // Guardar ID en un atributo del botón para futuras actualizaciones
                btnGuardar.setAttribute('data-calculadora-id', result.id);
            }
        } else {
            showError(result.error || 'Error al guardar la calculadora');
        }
        
    } catch (error) {
        console.error('Error al guardar calculadora:', error);
        showError('Error al guardar: ' + error.message);
        
        // Restaurar botón en caso de error
        const btnGuardar = document.getElementById(esCopia ? 'btnGuardarCopia' : 'btnGuardar');
        if (btnGuardar) {
            btnGuardar.disabled = false;
        }
    }
}

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    console.log('Calculadora CER inicializada');
    
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
        });
    }
    
    // No hacer llamadas automáticas a las APIs
});

