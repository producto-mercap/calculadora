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
            <input type="text" class="input-table date-input fecha-inicio" id="fechaInicio${cuponCount}" placeholder="DD/MM/AAAA" maxlength="10" onchange="calcularDayCountFactor(this)" />
        </td>
        <td>
            <input type="text" class="input-table date-input fecha-liquidacion" id="fechaLiquidacion${cuponCount}" placeholder="DD/MM/AAAA" maxlength="10" onchange="calcularDayCountFactor(this)" />
        </td>
        <td>
            <input type="text" class="input-table date-input fecha-inicio-cer" readonly placeholder="DD/MM/AAAA" maxlength="10" />
        </td>
        <td>
            <input type="text" class="input-table date-input fecha-final-cer" readonly placeholder="DD/MM/AAAA" maxlength="10" />
        </td>
        <td class="cer-column"><input type="number" class="input-table valor-cer-inicio" step="0.0001" readonly /></td>
        <td class="cer-column"><input type="number" class="input-table valor-cer-final" step="0.0001" readonly /></td>
        <td><input type="number" class="input-table day-count-factor" readonly /></td>
        <td><input type="number" class="input-table amortizacion" step="0.01" onchange="recalcularCamposCupon(this)" /></td>
        <td><input type="number" class="input-table valor-residual" step="0.01" onchange="recalcularValorResidualSiguiente(this)" /></td>
        <td><input type="number" class="input-table amortizacion-ajustada" step="0.01" readonly /></td>
        <td><input type="number" class="input-table renta-nominal" step="0.01" readonly /></td>
        <td><input type="number" class="input-table renta-tna" step="0.01" onchange="calcularRentaNominal(this)" /></td>
        <td><input type="number" class="input-table renta-ajustada" step="0.01" readonly /></td>
        <td><input type="number" class="input-table factor-actualizacion" step="0.0001" readonly /></td>
        <td><input type="number" class="input-table pagos-actualizados" step="0.01" readonly /></td>
        <td class="flujos-column"><input type="number" class="input-table flujos" step="0.01" readonly /></td>
        <td class="flujos-column"><input type="number" class="input-table flujos-desc-fecha-compra" step="0.01" readonly /></td>
        <td>
            <button onclick="eliminarCupon(${cuponCount})" style="background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center;" title="Eliminar cupón">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#d93025">
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
    
    // Inicializar valor residual en 100 para el primer cupón
    const rows = document.querySelectorAll('#cashflowBody tr[data-tipo="cupon"]');
    if (rows.length === 1) {
        const valorResidualInput = row.querySelector('.valor-residual');
        if (valorResidualInput && !valorResidualInput.value) {
            valorResidualInput.value = 100;
        }
    }
    
    // Recalcular coeficientes CER después de agregar cupón
    setTimeout(() => {
        calcularCoeficientesCER();
        recalcularTodosCamposDependientes();
    }, 100);
    
    // Agregar listener para recalcular renta nominal cuando cambie Day Count Factor
    const dayCountFactorInput = row.querySelector('.day-count-factor');
    if (dayCountFactorInput) {
        dayCountFactorInput.addEventListener('change', () => {
            const rentaTNAInput = row.querySelector('.renta-tna');
            if (rentaTNAInput && rentaTNAInput.value) {
                calcularRentaNominal(rentaTNAInput);
            } else {
                // Si no hay renta TNA, igual recalcular flujos por si cambió el factor
                setTimeout(() => {
                    recalcularFlujos(row);
                }, 10);
            }
        });
    }
}

// Eliminar cupón
function eliminarCupon(cuponId) {
    if (confirm('¿Está seguro de eliminar este cupón?')) {
        const row = document.querySelector(`tr[data-cupon-id="${cuponId}"]`);
        if (row) {
            row.remove();
            // Recalcular coeficientes CER después de eliminar cupón
            setTimeout(() => {
                calcularCoeficientesCER();
            }, 100);
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
    
    // Obtener tipo de interés (base) - por defecto 0 (30/360)
    const tipoInteresDias = parseInt(document.getElementById('tipoInteresDias')?.value) || 0;
    
    // Usar calcularFraccionAnio que ya implementa todas las bases correctamente
    const factor = calcularFraccionAnio(fechaInicio, fechaLiquidacion, tipoInteresDias);
    dayCountFactorInput.value = factor.toFixed(12);
    
    // Recalcular renta nominal si hay renta TNA
    const rentaTNAInput = row.querySelector('.renta-tna');
    if (rentaTNAInput && rentaTNAInput.value) {
        calcularRentaNominal(rentaTNAInput);
    }
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
                // Normalizar fechas de feriados a formato YYYY-MM-DD
                cacheFeriados = resultFeriados.datos.map(f => {
                    let fecha = f.fecha || f.date || f;
                    // Si es un objeto Date, convertirlo a string YYYY-MM-DD
                    if (fecha instanceof Date) {
                        fecha = formatearFechaInput(fecha);
                    } else if (typeof fecha === 'string' && fecha.includes('T')) {
                        fecha = fecha.split('T')[0];
                    }
                    return fecha;
                });
                cacheFeriadosRango = { desde: fechaDesdeStr, hasta: fechaHastaStr };
                console.log(`✅ Feriados cargados desde BD: ${cacheFeriados.length} feriados en cache`);
                console.log('📊 Primeros 3 feriados:', cacheFeriados.slice(0, 3));
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
                // Normalizar fechas de CER a formato YYYY-MM-DD
                cacheCER = resultCER.datos.map(cer => {
                    let fecha = cer.fecha || cer.date || cer.fecha_cer;
                    // Si es un objeto Date, convertirlo a string YYYY-MM-DD
                    if (fecha instanceof Date) {
                        fecha = formatearFechaInput(fecha);
                    } else if (typeof fecha === 'string' && fecha.includes('T')) {
                        fecha = fecha.split('T')[0];
                    }
                    return {
                        ...cer,
                        fecha: fecha,
                        fecha_normalizada: fecha // Guardar también la fecha normalizada para búsqueda rápida
                    };
                });
                cacheCERRango = { desde: fechaDesdeStr, hasta: fechaHastaStr };
                console.log(`✅ CER cargado desde BD: ${cacheCER.length} registros en cache`);
                console.log('📊 Primeros 3 registros CER:', cacheCER.slice(0, 3).map(cer => ({
                    fecha: cer.fecha,
                    fecha_normalizada: cer.fecha_normalizada,
                    valor: cer.valor || cer.valor_cer || cer.value,
                    tipoFecha: typeof cer.fecha
                })));
            } else {
                console.log('ℹ️ No hay CER en BD para el rango solicitado');
            }
        } catch (error) {
            console.warn('⚠️ Error al cargar CER desde BD:', error);
        }
        
    } catch (error) {
        console.error('Error al cargar datos desde BD:', error);
    }
    
    // Retornar promesa resuelta para permitir usar .then()
    return Promise.resolve();
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
    // Normalizar fecha para comparación (asegurar formato YYYY-MM-DD)
    const fechaNormalizada = fechaStr.includes('T') ? fechaStr.split('T')[0] : fechaStr;
    
    // Verificar si la fecha está en el array de feriados (comparar con formato normalizado)
    const esFeriado = feriados.some(feriado => {
        let feriadoStr = feriado;
        // Si el feriado es un objeto Date, convertirlo a string
        if (feriado instanceof Date) {
            feriadoStr = formatearFechaInput(feriado);
        } else if (typeof feriado === 'string' && feriado.includes('T')) {
            feriadoStr = feriado.split('T')[0];
        }
        return feriadoStr === fechaNormalizada;
    });
    
    return esFeriado;
}

// Verificar si una fecha es día hábil (no es fin de semana ni feriado)
function esDiaHabil(fecha, feriados) {
    return !esFinDeSemana(fecha) && !esFeriado(fecha, feriados);
}

// Calcular fecha sumando/restando días hábiles (síncrono, usa cache)
function calcularFechaConDiasHabiles(fechaBase, dias, feriados) {
    if (!fechaBase) return null;
    
    // Crear una copia de la fecha para no modificar la original
    const fecha = new Date(fechaBase);
    fecha.setHours(12, 0, 0, 0); // Normalizar hora para evitar problemas de zona horaria
    
    let diasRestantes = Math.abs(dias);
    const direccion = dias >= 0 ? 1 : -1; // 1 = avanzar, -1 = retroceder
    
    console.log(`🔍 calcularFechaConDiasHabiles - Inicio: ${formatearFechaInput(fechaBase)}, días: ${dias}, dirección: ${direccion > 0 ? 'avanzar' : 'retroceder'}`);
    console.log(`📊 Feriados disponibles: ${feriados ? feriados.length : 0} feriados`);
    
    let iteraciones = 0;
    const maxIteraciones = 1000; // Protección contra loops infinitos
    
    while (diasRestantes > 0 && iteraciones < maxIteraciones) {
        fecha.setDate(fecha.getDate() + direccion);
        iteraciones++;
        
        const fechaStr = formatearFechaInput(fecha);
        const esHabil = esDiaHabil(fecha, feriados);
        
        if (esHabil) {
            diasRestantes--;
            console.log(`✅ Día hábil encontrado: ${fechaStr}, días restantes: ${diasRestantes}`);
        } else {
            const razon = esFinDeSemana(fecha) ? 'fin de semana' : 'feriado';
            console.log(`⏭️ Día no hábil (${razon}): ${fechaStr}, días restantes: ${diasRestantes}`);
        }
    }
    
    if (iteraciones >= maxIteraciones) {
        console.error('⚠️ calcularFechaConDiasHabiles - Se alcanzó el máximo de iteraciones');
        return null;
    }
    
    console.log(`✅ calcularFechaConDiasHabiles - Resultado: ${formatearFechaInput(fecha)}, iteraciones: ${iteraciones}`);
    return fecha;
}

// Calcular fechas CER basándose en intervalos (usando días hábiles desde cache)
function calcularFechasCER() {
    console.log('🔄 calcularFechasCER - Iniciando cálculo de fechas CER');
    const intervaloInicio = parseInt(document.getElementById('intervaloInicio')?.value) || 0;
    const intervaloFin = parseInt(document.getElementById('intervaloFin')?.value) || 0;
    
    console.log('📊 calcularFechasCER - Intervalos:', { inicio: intervaloInicio, fin: intervaloFin });
    console.log('📊 calcularFechasCER - CacheCER:', cacheCER ? cacheCER.length : 0, 'registros');
    console.log('📊 calcularFechasCER - CacheFeriados:', cacheFeriados ? cacheFeriados.length : 0, 'feriados');
    
    // Si no hay intervalos, limpiar campos
    if (intervaloInicio === 0 && intervaloFin === 0) {
        console.log('⚠️ calcularFechasCER - No hay intervalos configurados, limpiando campos');
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
    
    // Calcular fechas CER para cada fila de cupones
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
            
            // Buscar y autocompletar valores CER siempre (se calculan automáticamente)
            const valorCERInicioInput = row.querySelector('.valor-cer-inicio');
            const valorCERFinalInput = row.querySelector('.valor-cer-final');
            
            console.log('🔍 calcularFechasCER - Procesando fila:', {
                fechaInicio: fechaInicioInput?.value,
                fechaLiquidacion: fechaLiquidacionInput?.value,
                fechaInicioCER: fechaInicioCER ? formatearFechaInput(fechaInicioCER) : null,
                fechaFinalCER: fechaFinalCER ? formatearFechaInput(fechaFinalCER) : null
            });
            
            if (fechaInicioCER && valorCERInicioInput) {
                // Siempre autocompletar basándose en la fecha calculada
                const fechaInicioCERStr = formatearFechaInput(fechaInicioCER);
                console.log('🔍 calcularFechasCER - Buscando CER Inicio para:', fechaInicioCERStr);
                const cerInicio = obtenerValorCER(fechaInicioCERStr);
                if (cerInicio !== null) {
                    const valorTruncado = window.truncarDecimal ? window.truncarDecimal(cerInicio, 8) : parseFloat(cerInicio.toFixed(8));
                    valorCERInicioInput.value = valorTruncado;
                    console.log('✅ calcularFechasCER - CER Inicio asignado:', valorTruncado);
                } else {
                    valorCERInicioInput.value = '';
                    console.warn('⚠️ calcularFechasCER - No se encontró CER Inicio para:', fechaInicioCERStr);
                }
            }
            
            if (fechaFinalCER && valorCERFinalInput) {
                // Siempre autocompletar basándose en la fecha calculada
                const fechaFinalCERStr = formatearFechaInput(fechaFinalCER);
                console.log('🔍 calcularFechasCER - Buscando CER Final para:', fechaFinalCERStr);
                const cerFinal = obtenerValorCER(fechaFinalCERStr);
                if (cerFinal !== null) {
                    const valorTruncado = window.truncarDecimal ? window.truncarDecimal(cerFinal, 8) : parseFloat(cerFinal.toFixed(8));
                    valorCERFinalInput.value = valorTruncado;
                    console.log('✅ calcularFechasCER - CER Final asignado:', valorTruncado);
                    // Recalcular coeficientes CER cuando se actualiza un valor CER final
                    setTimeout(() => {
                        calcularCoeficientesCER();
                    }, 50);
                } else {
                    valorCERFinalInput.value = '';
                    console.warn('⚠️ calcularFechasCER - No se encontró CER Final para:', fechaFinalCERStr);
                }
            }
            
            // Recalcular renta nominal si hay valores
            const rentaTNAInput = row.querySelector('.renta-tna');
            if (rentaTNAInput && rentaTNAInput.value) {
                calcularRentaNominal(rentaTNAInput);
            }
        }
    }
    
    // Calcular fecha final intervalo y valor CER final para la fila de inversión
    const filaInversion = document.querySelector('tr[data-tipo="inversion"]');
    if (filaInversion) {
        const fechaLiquidacionInversion = document.getElementById('fechaLiquidacion');
        const fechaFinalIntervaloInput = document.getElementById('fechaFinalIntervaloInversion');
        const valorCERFinalInput = document.getElementById('valorCERFinal');
        
        if (fechaLiquidacionInversion && fechaLiquidacionInversion.value && intervaloFin !== 0) {
            let fechaLiquidacion = fechaLiquidacionInversion.value;
            
            // Convertir de DD/MM/AAAA a YYYY-MM-DD si es necesario
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaLiquidacion)) {
                fechaLiquidacion = convertirFechaDDMMAAAAaYYYYMMDD(fechaLiquidacion);
            }
            
            const fechaLiquidacionDate = crearFechaDesdeString(fechaLiquidacion);
            
            if (fechaLiquidacionDate) {
                // Fecha Final Intervalo = Fecha Liquidación + intervaloFin días hábiles
                const fechaFinalIntervalo = calcularFechaConDiasHabiles(fechaLiquidacionDate, intervaloFin, feriados);
                if (fechaFinalIntervalo && fechaFinalIntervaloInput) {
                    fechaFinalIntervaloInput.value = convertirFechaYYYYMMDDaDDMMAAAA(formatearFechaInput(fechaFinalIntervalo));
                    console.log('✅ calcularFechasCER - Fecha Final Intervalo Inversión:', formatearFechaInput(fechaFinalIntervalo));
                    
                    // Autocompletar valor CER final basándose en la fecha final intervalo
                    if (valorCERFinalInput) {
                        const fechaFinalIntervaloStr = formatearFechaInput(fechaFinalIntervalo);
                        console.log('🔍 calcularFechasCER - Buscando CER Final Inversión para:', fechaFinalIntervaloStr);
                        const cerFinal = obtenerValorCER(fechaFinalIntervaloStr);
                        if (cerFinal !== null) {
                            const valorTruncado = window.truncarDecimal ? window.truncarDecimal(cerFinal, 8) : parseFloat(cerFinal.toFixed(8));
                            valorCERFinalInput.value = valorTruncado;
                            console.log('✅ calcularFechasCER - CER Final Inversión asignado:', valorTruncado);
                            // Recalcular coeficientes CER cuando se actualiza el valor CER inversión
                            setTimeout(() => {
                                calcularCoeficientesCER();
                            }, 50);
                        } else {
                            valorCERFinalInput.value = '';
                            console.warn('⚠️ calcularFechasCER - No se encontró CER Final Inversión para:', fechaFinalIntervaloStr);
                        }
                    }
                }
            }
        }
    }
    
    // Calcular y mostrar coeficientes CER
    calcularCoeficientesCER();
    
    // Recalcular campos dependientes de los coeficientes
    recalcularTodosCamposDependientes();
}

// Función para recalcular todos los campos dependientes de los coeficientes
function recalcularTodosCamposDependientes() {
    const rows = document.querySelectorAll('#cashflowBody tr[data-tipo="cupon"]');
    rows.forEach(row => {
        recalcularAmortizacionAjustada(row);
        recalcularRentaAjustada(row);
    });
    
    // Recalcular flujos después de actualizar todos los campos dependientes
    setTimeout(() => {
        rows.forEach(row => {
            recalcularFlujos(row);
        });
        
        // Recalcular flujos de inversión
        const filaInversion = document.querySelector('tr[data-tipo="inversion"]');
        if (filaInversion) {
            recalcularFlujos(filaInversion);
        }
    }, 10);
    
    // Recalcular valores residuales
    recalcularValoresResiduales();
}

// Función para calcular y mostrar coeficientes CER
function calcularCoeficientesCER() {
    console.log('🔄 calcularCoeficientesCER - Iniciando cálculo de coeficientes');
    
    // Obtener valor CER final del último cupón
    const rows = document.querySelectorAll('#cashflowBody tr[data-tipo="cupon"]');
    let valorCERFinalUltimoCupon = null;
    
    if (rows.length > 0) {
        // Obtener el último cupón (último en el DOM)
        const ultimaRow = rows[rows.length - 1];
        const valorCERFinalInput = ultimaRow.querySelector('.valor-cer-final');
        if (valorCERFinalInput && valorCERFinalInput.value) {
            valorCERFinalUltimoCupon = parseFloat(valorCERFinalInput.value);
            console.log('📊 calcularCoeficientesCER - Valor CER Final último cupón:', valorCERFinalUltimoCupon);
        } else {
            console.log('⚠️ calcularCoeficientesCER - No hay valor CER final en el último cupón');
        }
    } else {
        console.log('⚠️ calcularCoeficientesCER - No hay cupones en la tabla');
    }
    
    // Calcular Coeficiente CER Emisión = Valor CER final último cupón / Valor CER emisión
    const valorCEREmisionInput = document.getElementById('valorCEREmision');
    const coeficienteCEREmisionDiv = document.getElementById('coeficienteCEREmision');
    if (valorCEREmisionInput && coeficienteCEREmisionDiv) {
        if (valorCERFinalUltimoCupon && valorCEREmisionInput.value) {
            const valorCEREmision = parseFloat(valorCEREmisionInput.value);
            console.log('📊 calcularCoeficientesCER - Valor CER Emisión:', valorCEREmision);
            if (valorCEREmision > 0) {
                const coeficiente = valorCERFinalUltimoCupon / valorCEREmision;
                const coeficienteTruncado = window.truncarDecimal ? window.truncarDecimal(coeficiente, 12) : parseFloat(coeficiente.toFixed(12));
                coeficienteCEREmisionDiv.textContent = coeficienteTruncado;
                console.log('✅ calcularCoeficientesCER - Coeficiente CER Emisión calculado:', coeficienteTruncado);
            } else {
                coeficienteCEREmisionDiv.textContent = '-';
                console.log('⚠️ calcularCoeficientesCER - Valor CER Emisión es 0 o inválido');
            }
        } else {
            coeficienteCEREmisionDiv.textContent = '-';
            console.log('⚠️ calcularCoeficientesCER - Faltan datos para calcular Coeficiente CER Emisión');
        }
    } else {
        if (coeficienteCEREmisionDiv) coeficienteCEREmisionDiv.textContent = '-';
    }
    
    // Calcular Coeficiente CER Compra = Valor CER final último cupón / Valor CER final inversión
    const valorCERFinalInversionInput = document.getElementById('valorCERFinal');
    const coeficienteCERCompraDiv = document.getElementById('coeficienteCERCompra');
    if (valorCERFinalInversionInput && coeficienteCERCompraDiv) {
        if (valorCERFinalUltimoCupon && valorCERFinalInversionInput.value) {
            const valorCERFinalInversion = parseFloat(valorCERFinalInversionInput.value);
            console.log('📊 calcularCoeficientesCER - Valor CER Final Inversión:', valorCERFinalInversion);
            if (valorCERFinalInversion > 0) {
                const coeficiente = valorCERFinalUltimoCupon / valorCERFinalInversion;
                const coeficienteTruncado = window.truncarDecimal ? window.truncarDecimal(coeficiente, 12) : parseFloat(coeficiente.toFixed(12));
                coeficienteCERCompraDiv.textContent = coeficienteTruncado;
                console.log('✅ calcularCoeficientesCER - Coeficiente CER Compra calculado:', coeficienteTruncado);
                // Recalcular flujos de inversión cuando se calcula el coeficiente
                setTimeout(() => {
                    const filaInversion = document.querySelector('tr[data-tipo="inversion"]');
                    if (filaInversion) {
                        recalcularFlujos(filaInversion);
                    }
                }, 50);
            } else {
                coeficienteCERCompraDiv.textContent = '-';
                console.log('⚠️ calcularCoeficientesCER - Valor CER Final Inversión es 0 o inválido');
            }
        } else {
            coeficienteCERCompraDiv.textContent = '-';
            console.log('⚠️ calcularCoeficientesCER - Faltan datos para calcular Coeficiente CER Compra');
            if (!valorCERFinalUltimoCupon) {
                console.log('  - No hay valor CER final del último cupón');
            }
            if (!valorCERFinalInversionInput || !valorCERFinalInversionInput.value) {
                console.log('  - No hay valor CER final de inversión');
            }
        }
    } else {
        if (coeficienteCERCompraDiv) coeficienteCERCompraDiv.textContent = '-';
        console.log('⚠️ calcularCoeficientesCER - No se encontró el input valorCERFinal o el div coeficienteCERCompra');
    }
}

// Función para recalcular campos del cupón cuando cambia amortización
function recalcularCamposCupon(input) {
    const row = input.closest('tr');
    if (!row) return;
    
    // Recalcular amortización ajustada
    recalcularAmortizacionAjustada(row);
    
    // Recalcular renta ajustada
    recalcularRentaAjustada(row);
    
    // Recalcular valor residual del siguiente cupón
    recalcularValorResidualSiguiente(input);
    
    // Recalcular flujos (importante: debe ser al final para usar los valores actualizados)
    setTimeout(() => {
        recalcularFlujos(row);
    }, 10);
}

// Función para recalcular amortización ajustada
function recalcularAmortizacionAjustada(row) {
    const amortizacionInput = row.querySelector('.amortizacion');
    const amortizacionAjustadaInput = row.querySelector('.amortizacion-ajustada');
    const coeficienteCEREmisionDiv = document.getElementById('coeficienteCEREmision');
    
    if (amortizacionInput && amortizacionAjustadaInput && coeficienteCEREmisionDiv) {
        const amortizacion = parseFloat(amortizacionInput.value) || 0;
        const coeficienteCEREmision = parseFloat(coeficienteCEREmisionDiv.textContent) || 0;
        
        if (coeficienteCEREmision > 0) {
            const amortizacionAjustada = amortizacion * coeficienteCEREmision;
            const valorTruncado = window.truncarDecimal ? window.truncarDecimal(amortizacionAjustada, 12) : parseFloat(amortizacionAjustada.toFixed(12));
            amortizacionAjustadaInput.value = valorTruncado;
            
            // Recalcular flujos después de actualizar amortización ajustada
            setTimeout(() => {
                recalcularFlujos(row);
            }, 10);
        } else {
            amortizacionAjustadaInput.value = '';
        }
    }
}

// Función para recalcular renta ajustada
function recalcularRentaAjustada(row) {
    const rentaNominalInput = row.querySelector('.renta-nominal');
    const rentaAjustadaInput = row.querySelector('.renta-ajustada');
    const coeficienteCEREmisionDiv = document.getElementById('coeficienteCEREmision');
    
    if (rentaNominalInput && rentaAjustadaInput && coeficienteCEREmisionDiv) {
        const rentaNominal = parseFloat(rentaNominalInput.value) || 0;
        const coeficienteCEREmision = parseFloat(coeficienteCEREmisionDiv.textContent) || 0;
        
        if (coeficienteCEREmision > 0) {
            const rentaAjustada = rentaNominal * coeficienteCEREmision;
            const valorTruncado = window.truncarDecimal ? window.truncarDecimal(rentaAjustada, 12) : parseFloat(rentaAjustada.toFixed(12));
            rentaAjustadaInput.value = valorTruncado;
            
            // Recalcular flujos después de actualizar renta ajustada
            setTimeout(() => {
                recalcularFlujos(row);
            }, 10);
        } else {
            rentaAjustadaInput.value = '';
        }
    }
}

// Función para recalcular valor residual
function recalcularValoresResiduales() {
    const rows = Array.from(document.querySelectorAll('#cashflowBody tr[data-tipo="cupon"]'));
    
    if (rows.length === 0) return;
    
    // Verificar si el último cupón amortiza 100%
    const ultimaRow = rows[rows.length - 1];
    const ultimaAmortizacion = parseFloat(ultimaRow.querySelector('.amortizacion')?.value) || 0;
    const amortiza100 = ultimaAmortizacion === 100;
    
    // Primer cupón siempre empieza en 100 (editable)
    if (rows.length > 0) {
        const primerValorResidualInput = rows[0].querySelector('.valor-residual');
        if (primerValorResidualInput && !primerValorResidualInput.value) {
            primerValorResidualInput.value = 100;
        }
    }
    
    // Para los siguientes cupones: valor residual anterior - amortización anterior
    for (let i = 1; i < rows.length; i++) {
        const rowAnterior = rows[i - 1];
        const rowActual = rows[i];
        
        const valorResidualAnterior = parseFloat(rowAnterior.querySelector('.valor-residual')?.value) || 0;
        const amortizacionAnterior = parseFloat(rowAnterior.querySelector('.amortizacion')?.value) || 0;
        const valorResidualInput = rowActual.querySelector('.valor-residual');
        
        if (valorResidualInput) {
            if (amortiza100 && i === rows.length - 1) {
                // Si el último cupón amortiza 100%, el valor residual siempre es 100
                valorResidualInput.value = 100;
            } else {
                const nuevoValorResidual = valorResidualAnterior - amortizacionAnterior;
                const valorTruncado = window.truncarDecimal ? window.truncarDecimal(nuevoValorResidual, 8) : parseFloat(nuevoValorResidual.toFixed(8));
                valorResidualInput.value = Math.max(0, valorTruncado);
            }
        }
    }
}

// Función para recalcular valor residual del siguiente cupón cuando cambia uno
function recalcularValorResidualSiguiente(input) {
    const row = input.closest('tr');
    if (!row) return;
    
    const rows = Array.from(document.querySelectorAll('#cashflowBody tr[data-tipo="cupon"]'));
    const currentIndex = rows.indexOf(row);
    
    if (currentIndex === -1) return;
    
    // Si cambió la amortización, recalcular todos los valores residuales desde este punto
    if (input.classList.contains('amortizacion')) {
        recalcularValoresResiduales();
    } else if (input.classList.contains('valor-residual')) {
        // Si cambió el valor residual, recalcular solo los siguientes
        for (let i = currentIndex + 1; i < rows.length; i++) {
            const rowAnterior = rows[i - 1];
            const rowActual = rows[i];
            
            const valorResidualAnterior = parseFloat(rowAnterior.querySelector('.valor-residual')?.value) || 0;
            const amortizacionAnterior = parseFloat(rowAnterior.querySelector('.amortizacion')?.value) || 0;
            const valorResidualInput = rowActual.querySelector('.valor-residual');
            
            if (valorResidualInput) {
                // Verificar si es el último cupón y amortiza 100%
                const ultimaRow = rows[rows.length - 1];
                const ultimaAmortizacion = parseFloat(ultimaRow.querySelector('.amortizacion')?.value) || 0;
                const amortiza100 = ultimaAmortizacion === 100;
                
                if (amortiza100 && i === rows.length - 1) {
                    valorResidualInput.value = 100;
                } else {
                    const nuevoValorResidual = valorResidualAnterior - amortizacionAnterior;
                    const valorTruncado = window.truncarDecimal ? window.truncarDecimal(nuevoValorResidual, 8) : parseFloat(nuevoValorResidual.toFixed(8));
                    valorResidualInput.value = Math.max(0, valorTruncado);
                }
            }
        }
    }
}

// Función para recalcular flujos
function recalcularFlujos(row) {
    const tipo = row.getAttribute('data-tipo');
    
    // Para la fila de inversión, usar ID específico
    let flujosInput;
    if (tipo === 'inversion') {
        flujosInput = document.getElementById('flujos');
    } else {
        flujosInput = row.querySelector('.flujos');
    }
    
    if (!flujosInput) {
        console.log('⚠️ recalcularFlujos - No se encontró input de flujos para tipo:', tipo);
        return;
    }
    
    const cantidadPartida = parseFloat(document.getElementById('cantidadPartida')?.value) || 0;
    const precioCompra = parseFloat(convertirNumeroDecimal(document.getElementById('precioCompra')?.value)) || 0;
    
    console.log('🔄 recalcularFlujos - Tipo:', tipo, 'Cantidad:', cantidadPartida, 'Precio:', precioCompra);
    
    if (tipo === 'inversion') {
        // Flujos inversión: -(Cantidad partida × Precio partida × Coeficiente CER Compra) (negativo)
        const coeficienteCERCompraDiv = document.getElementById('coeficienteCERCompra');
        const coeficienteCERCompra = parseFloat(coeficienteCERCompraDiv?.textContent) || 0;
        
        console.log('🔄 recalcularFlujos - Coeficiente CER Compra:', coeficienteCERCompra);
        
        if (coeficienteCERCompra > 0 && cantidadPartida > 0 && precioCompra > 0) {
            const flujos = -(cantidadPartida * precioCompra * coeficienteCERCompra); // Negativo
            const valorTruncado = window.truncarDecimal ? window.truncarDecimal(flujos, 12) : parseFloat(flujos.toFixed(12));
            flujosInput.value = valorTruncado;
            console.log('✅ recalcularFlujos - Flujo inversión calculado:', valorTruncado);
        } else {
            flujosInput.value = '';
            console.log('⚠️ recalcularFlujos - Faltan datos para calcular flujo inversión');
        }
    } else if (tipo === 'cupon') {
        // Flujos cupones: Cantidad partida × (Amortiz ajustada / 100 + Renta ajustada / 100)
        const amortizacionAjustada = parseFloat(row.querySelector('.amortizacion-ajustada')?.value) || 0;
        const rentaAjustada = parseFloat(row.querySelector('.renta-ajustada')?.value) || 0;
        
        const flujos = cantidadPartida * (amortizacionAjustada / 100 + rentaAjustada / 100);
        const valorTruncado = window.truncarDecimal ? window.truncarDecimal(flujos, 12) : parseFloat(flujos.toFixed(12));
        flujosInput.value = valorTruncado;
    }
}

// Función para recalcular todos los flujos
function recalcularTodosFlujos() {
    console.log('🔄 recalcularTodosFlujos - Recalculando todos los flujos');
    
    // Recalcular flujo de inversión primero
    const filaInversion = document.querySelector('tr[data-tipo="inversion"]');
    if (filaInversion) {
        recalcularFlujos(filaInversion);
    }
    
    // Recalcular flujos de cupones
    const rows = document.querySelectorAll('#cashflowBody tr[data-tipo="cupon"]');
    rows.forEach(row => {
        recalcularFlujos(row);
    });
}

// Función para obtener valor CER de una fecha específica
function obtenerValorCER(fecha) {
    console.log('🔍 obtenerValorCER - Buscando CER para fecha:', fecha);
    console.log('📊 CacheCER disponible:', cacheCER ? cacheCER.length : 0, 'registros');
    
    if (!cacheCER || cacheCER.length === 0) {
        console.warn('⚠️ obtenerValorCER - CacheCER vacío o no disponible');
        return null;
    }
    
    // Buscar el valor CER para la fecha exacta
    // Normalizar formato de fecha para comparación
    let fechaNormalizada = fecha;
    if (typeof fecha === 'string') {
        fechaNormalizada = fecha.includes('T') ? fecha.split('T')[0] : fecha;
    } else if (fecha instanceof Date) {
        fechaNormalizada = formatearFechaInput(fecha);
    }
    
    console.log('🔍 obtenerValorCER - Fecha normalizada a buscar:', fechaNormalizada);
    
    const cerEncontrado = cacheCER.find(cer => {
        // Usar fecha_normalizada si existe, sino normalizar fecha
        let cerFecha = cer.fecha_normalizada || cer.fecha || cer.date || cer.fecha_cer;
        // Si ya está normalizada, usarla directamente
        if (cer.fecha_normalizada) {
            const coincide = cer.fecha_normalizada === fechaNormalizada;
            if (coincide) {
                console.log('✅ obtenerValorCER - Coincidencia encontrada (normalizada):', cer.fecha_normalizada, '===', fechaNormalizada);
            }
            return coincide;
        }
        // Normalizar formato de fecha del CER si no está normalizada
        if (cerFecha) {
            // Si es un objeto Date, convertirlo a string YYYY-MM-DD
            if (cerFecha instanceof Date) {
                cerFecha = formatearFechaInput(cerFecha);
            } else if (typeof cerFecha === 'string') {
                // Si tiene T (timestamp), extraer solo la fecha
                if (cerFecha.includes('T')) {
                    cerFecha = cerFecha.split('T')[0];
                }
            }
            // Comparar fechas normalizadas
            const coincide = cerFecha === fechaNormalizada;
            if (coincide) {
                console.log('✅ obtenerValorCER - Coincidencia encontrada:', cerFecha, '===', fechaNormalizada);
            }
            return coincide;
        }
        return false;
    });
    
    if (cerEncontrado) {
        const valor = parseFloat(cerEncontrado.valor || cerEncontrado.valor_cer || cerEncontrado.value) || null;
        console.log('✅ obtenerValorCER - Encontrado exacto:', fecha, '=', valor);
        return valor;
    }
    
    // Si no se encuentra exacto, buscar el más cercano anterior
    const fechaDate = crearFechaDesdeString(fecha);
    if (!fechaDate) {
        console.warn('⚠️ obtenerValorCER - Fecha inválida:', fecha);
        return null;
    }
    
    let cerMasCercano = null;
    let diferenciaMinima = Infinity;
    
    cacheCER.forEach(cer => {
        let cerFechaStr = cer.fecha || cer.date || cer.fecha_cer;
        // Normalizar formato de fecha
        if (cerFechaStr) {
            // Si es un objeto Date, convertirlo a string YYYY-MM-DD
            if (cerFechaStr instanceof Date) {
                cerFechaStr = formatearFechaInput(cerFechaStr);
            } else if (typeof cerFechaStr === 'string' && cerFechaStr.includes('T')) {
                cerFechaStr = cerFechaStr.split('T')[0];
            }
        }
        const cerFecha = crearFechaDesdeString(cerFechaStr);
        if (cerFecha && cerFecha <= fechaDate) {
            const diferencia = fechaDate - cerFecha;
            if (diferencia < diferenciaMinima) {
                diferenciaMinima = diferencia;
                cerMasCercano = cer;
            }
        }
    });
    
    if (cerMasCercano) {
        const valor = parseFloat(cerMasCercano.valor || cerMasCercano.valor_cer || cerMasCercano.value) || null;
        const fechaMasCercana = cerMasCercano.fecha || cerMasCercano.date || cerMasCercano.fecha_cer;
        console.log('✅ obtenerValorCER - Encontrado más cercano:', fechaMasCercana, '=', valor, '(diferencia:', Math.floor(diferenciaMinima / (1000 * 60 * 60 * 24)), 'días)');
        return valor;
    }
    
    console.warn('⚠️ obtenerValorCER - No se encontró CER para fecha:', fecha);
    return null;
}

// Función para calcular renta nominal automáticamente
function calcularRentaNominal(input) {
    const row = input.closest('tr');
    if (!row) return;
    
    const rentaTNA = parseFloat(input.value) || 0;
    const dayCountFactorInput = row.querySelector('.day-count-factor');
    const dayCountFactor = parseFloat(dayCountFactorInput?.value) || 0;
    
    const rentaNominalInput = row.querySelector('.renta-nominal');
    if (rentaNominalInput) {
        const rentaNominal = rentaTNA * dayCountFactor;
        rentaNominalInput.value = window.truncarDecimal ? window.truncarDecimal(rentaNominal, 12) : parseFloat(rentaNominal.toFixed(12));
        
        // Recalcular renta ajustada y flujos después de actualizar renta nominal
        setTimeout(() => {
            recalcularRentaAjustada(row);
            recalcularFlujos(row);
        }, 10);
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
                    <input type="text" class="input-table date-input fecha-inicio" id="fechaInicio${cuponCount}" value="${fechaInicioDDMM}" placeholder="DD/MM/AAAA" maxlength="10" onchange="calcularDayCountFactor(this)" />
                </td>
                <td>
                    <input type="text" class="input-table date-input fecha-liquidacion" id="fechaLiquidacion${cuponCount}" value="${fechaLiquidacionDDMM}" placeholder="DD/MM/AAAA" maxlength="10" onchange="calcularDayCountFactor(this)" />
                </td>
                <td>
                    <input type="text" class="input-table date-input fecha-inicio-cer" readonly placeholder="DD/MM/AAAA" maxlength="10" />
                </td>
                <td>
                    <input type="text" class="input-table date-input fecha-final-cer" readonly placeholder="DD/MM/AAAA" maxlength="10" />
                </td>
                <td class="cer-column"><input type="number" class="input-table valor-cer-inicio" step="0.0001" readonly /></td>
                <td class="cer-column"><input type="number" class="input-table valor-cer-final" step="0.0001" readonly /></td>
                <td><input type="number" class="input-table day-count-factor" readonly /></td>
                <td><input type="number" class="input-table" step="0.01" /></td>
                <td><input type="number" class="input-table" step="0.01" /></td>
                <td><input type="number" class="input-table" step="0.01" /></td>
                <td><input type="number" class="input-table renta-nominal" step="0.01" readonly /></td>
                <td><input type="number" class="input-table renta-tna" step="0.01" onchange="calcularRentaNominal(this)" /></td>
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
                
                // Recalcular renta nominal si hay valores
                const rentaTNAInput = row.querySelector('.renta-tna');
                if (rentaTNAInput && rentaTNAInput.value) {
                    calcularRentaNominal(rentaTNAInput);
                }
            }
            
            // Agregar listener para recalcular renta nominal cuando cambie Day Count Factor
            const dayCountFactorInput = row.querySelector('.day-count-factor');
            if (dayCountFactorInput) {
                dayCountFactorInput.addEventListener('change', () => {
                    const rentaTNAInput = row.querySelector('.renta-tna');
                    if (rentaTNAInput && rentaTNAInput.value) {
                        calcularRentaNominal(rentaTNAInput);
                    } else {
                        // Si no hay renta TNA, igual recalcular flujos por si cambió el factor
                        setTimeout(() => {
                            recalcularFlujos(row);
                        }, 10);
                    }
                });
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
            const valorCERFinalInput = document.getElementById('valorCERFinal');
            const flujosInput = document.getElementById('flujos');
            const flujosDescFechaCompraInput = document.getElementById('flujosDescFechaCompra');
            
            rowData = {
            tipo: tipo,
                fechaInicio: null,
                fechaLiquidacion: fechaLiquidacion,
                // No guardar fechaInicioCER, fechaFinalCER, valorCER, valorCERFinal, dayCountFactor - se autocompletan
                amortizacion: 0,
                valorResidual: 0,
                amortizacionAjustada: 0,
                rentaNominal: 0,
                rentaTNA: 0,
                rentaAjustada: 0,
                factorActualizacion: 0,
                pagosActualizados: 0,
                flujos: parseFloat(flujosInput?.value) || 0,
                flujosDescFechaCompra: parseFloat(flujosDescFechaCompraInput?.value) || 0
            };
            
            // Log para debug
            console.log(`🔍 obtenerDatosCashflow - Inversión: flujosInput=${flujosInput?.value}, flujos=${rowData.flujos}`);
        } else {
            const valorCERInicioInput = row.querySelector('.valor-cer-inicio');
            const valorCERFinalInput = row.querySelector('.valor-cer-final');
            
            // Usar selectores de clase en lugar de índices para mayor robustez
            const flujosInput = row.querySelector('.flujos');
            const flujosDescFechaCompraInput = row.querySelector('.flujos-desc-fecha-compra');
            
            rowData = {
                tipo: tipo,
                fechaInicio: fechaInicio,
                fechaLiquidacion: fechaLiquidacion,
                // No guardar fechaInicioCER, fechaFinalCER, valorCER, valorCERFinal, dayCountFactor - se autocompletan
                // Estructura de inputs: [0]fechaInicio, [1]fechaLiquidacion, [2]fechaInicioCER, [3]fechaFinalCER, 
                // [4]valorCERInicio, [5]valorCERFinal, [6]dayCountFactor, [7]amortizacion, [8]valorResidual, [9]amortizacionAjustada
                amortizacion: parseFloat(inputs[7]?.value) || 0,
                valorResidual: parseFloat(inputs[8]?.value) || 0,
                amortizacionAjustada: parseFloat(inputs[9]?.value) || 0,
                rentaNominal: parseFloat(row.querySelector('.renta-nominal')?.value) || 0,
                rentaTNA: parseFloat(row.querySelector('.renta-tna')?.value) || 0,
            rentaAjustada: parseFloat(inputs[11]?.value) || 0,
            factorActualizacion: parseFloat(inputs[12]?.value) || 0,
            pagosActualizados: parseFloat(inputs[13]?.value) || 0,
                flujos: parseFloat(flujosInput?.value) || 0,
                flujosDescFechaCompra: parseFloat(flujosDescFechaCompraInput?.value) || 0
            };
            
            // Log para debug
            console.log(`🔍 obtenerDatosCashflow - Cupón: flujosInput=${flujosInput?.value}, flujos=${rowData.flujos}`);
        }
        
        // Truncar valores decimales a 12 decimales para campos específicos que afectan TIR
        const camposPrecision12 = ['dayCountFactor', 'amortizacionAjustada', 'rentaNominal', 'rentaTNA', 'rentaAjustada', 
                                   'factorActualizacion', 'pagosActualizados', 'flujos', 'flujosDescFechaCompra'];
        Object.keys(rowData).forEach(key => {
            if (typeof rowData[key] === 'number' && !isNaN(rowData[key]) && rowData[key] !== 0) {
                // Usar 12 decimales para campos que afectan TIR, 8 para el resto
                const decimales = camposPrecision12.includes(key) ? 12 : 8;
                rowData[key] = window.truncarDecimal ? window.truncarDecimal(rowData[key], decimales) : parseFloat(rowData[key].toFixed(decimales));
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
        tipoInteresDias: parseInt(document.getElementById('tipoInteresDias')?.value) || 0,
        spread: parseFloat(document.getElementById('spread')?.value) || 0,
        periodicidad: document.getElementById('periodicidad')?.value || '',
        fechaPrimeraRenta: fechaPrimeraRenta,
        fechaAmortizacion: fechaAmortizacion,
        intervaloInicio: parseInt(document.getElementById('intervaloInicio')?.value) || 0,
        intervaloFin: parseInt(document.getElementById('intervaloFin')?.value) || 0
    };
}

// Función auxiliar: Calcular días según base 30/360 (US NASD)
function calcularDias30360(fechaInicio, fechaFin) {
    const fechaInicioDate = crearFechaDesdeString(fechaInicio);
    const fechaFinDate = crearFechaDesdeString(fechaFin);
    
    let Y1 = fechaInicioDate.getFullYear();
    let M1 = fechaInicioDate.getMonth() + 1; // Mes 1-12
    let D1 = fechaInicioDate.getDate();
    
    let Y2 = fechaFinDate.getFullYear();
    let M2 = fechaFinDate.getMonth() + 1; // Mes 1-12
    let D2 = fechaFinDate.getDate();
    
    // Reglas 30/360 US NASD:
    // Si D1 = 31, entonces D1 = 30
    if (D1 === 31) {
        D1 = 30;
    }
    
    // Si D2 = 31 y D1 = 30 o 31, entonces D2 = 30
    if (D2 === 31 && (D1 === 30 || D1 === 31)) {
        D2 = 30;
    }
    
    // Si D1 es el último día de febrero, entonces D1 = 30
    const esUltimoDiaFebrero1 = (M1 === 2 && D1 === new Date(Y1, 2, 0).getDate());
    if (esUltimoDiaFebrero1) {
        D1 = 30;
    }
    
    // Si D2 es el último día de febrero y D1 es el último día de febrero, entonces D2 = 30
    const esUltimoDiaFebrero2 = (M2 === 2 && D2 === new Date(Y2, 2, 0).getDate());
    const esUltimoDiaFebrero1Original = (M1 === 2 && fechaInicioDate.getDate() === new Date(Y1, 2, 0).getDate());
    if (esUltimoDiaFebrero2 && esUltimoDiaFebrero1Original) {
        D2 = 30;
    }
    
    // Calcular días: (Y2 - Y1) * 360 + (M2 - M1) * 30 + (D2 - D1)
    const dias = (Y2 - Y1) * 360 + (M2 - M1) * 30 + (D2 - D1);
    
    return dias;
}

// Función auxiliar: Verificar si un año es bisiesto
function esAnioBisiesto(anio) {
    return (anio % 4 === 0 && anio % 100 !== 0) || (anio % 400 === 0);
}

// Función auxiliar: Calcular días reales en un año
function diasRealesEnAnio(anio) {
    return esAnioBisiesto(anio) ? 366 : 365;
}

// Función para calcular fracción de año entre dos fechas usando base de conteo de días
function calcularFraccionAnio(fechaInicio, fechaFin, tipoInteresDias = null) {
    if (!fechaInicio || !fechaFin) {
        console.log('⚠️ calcularFraccionAnio - Fechas faltantes:', { fechaInicio, fechaFin });
        return 0;
    }
    
    // Obtener tipoInteresDias (base) si no se proporciona
    if (tipoInteresDias === null) {
        tipoInteresDias = parseInt(document.getElementById('tipoInteresDias')?.value) || 0;
    }
    
    // Convertir fechas a formato YYYY-MM-DD si están en DD/MM/AAAA
    let fechaInicioStr = fechaInicio;
    let fechaFinStr = fechaFin;
    
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaInicioStr)) {
        fechaInicioStr = convertirFechaDDMMAAAAaYYYYMMDD(fechaInicioStr);
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaFinStr)) {
        fechaFinStr = convertirFechaDDMMAAAAaYYYYMMDD(fechaFinStr);
    }
    
    const fechaInicioDate = crearFechaDesdeString(fechaInicioStr);
    const fechaFinDate = crearFechaDesdeString(fechaFinStr);
    
    if (!fechaInicioDate || !fechaFinDate) {
        console.log('⚠️ calcularFraccionAnio - Error al crear fechas:', { fechaInicioStr, fechaFinStr });
        return 0;
    }
    
    let fraccionAnio = 0;
    let dias = 0;
    let denominador = 0;
    
    // Calcular según la base seleccionada
    switch (tipoInteresDias) {
        case 0: // US (NASD) 30/360
            dias = calcularDias30360(fechaInicioStr, fechaFinStr);
            denominador = 360;
            fraccionAnio = dias / denominador;
            console.log(`📊 calcularFraccionAnio [30/360] - ${fechaInicioStr} a ${fechaFinStr}: ${dias} días / ${denominador} = ${fraccionAnio.toFixed(12)}`);
            break;
            
        case 1: // Real/real (Actual/actual)
            // Días reales entre fechas
            const diffMs = fechaFinDate - fechaInicioDate;
            dias = diffMs / (1000 * 60 * 60 * 24);
            
            // Calcular días reales en el año de la fecha de inicio
            const anioInicio = fechaInicioDate.getFullYear();
            denominador = diasRealesEnAnio(anioInicio);
            fraccionAnio = dias / denominador;
            console.log(`📊 calcularFraccionAnio [Real/Real] - ${fechaInicioStr} a ${fechaFinStr}: ${dias.toFixed(2)} días reales / ${denominador} días en año ${anioInicio} = ${fraccionAnio.toFixed(12)}`);
            break;
            
        case 2: // Real/360 (Actual/360)
            const diffMs2 = fechaFinDate - fechaInicioDate;
            dias = diffMs2 / (1000 * 60 * 60 * 24);
            denominador = 360;
            fraccionAnio = dias / denominador;
            console.log(`📊 calcularFraccionAnio [Real/360] - ${fechaInicioStr} a ${fechaFinStr}: ${dias.toFixed(2)} días reales / ${denominador} = ${fraccionAnio.toFixed(12)}`);
            break;
            
        case 3: // Real/365 (Actual/365)
            const diffMs3 = fechaFinDate - fechaInicioDate;
            dias = diffMs3 / (1000 * 60 * 60 * 24);
            denominador = 365;
            fraccionAnio = dias / denominador;
            console.log(`📊 calcularFraccionAnio [Real/365] - ${fechaInicioStr} a ${fechaFinStr}: ${dias.toFixed(2)} días reales / ${denominador} = ${fraccionAnio.toFixed(12)}`);
            break;
            
        default:
            // Por defecto, usar 30/360
            dias = calcularDias30360(fechaInicioStr, fechaFinStr);
            denominador = 360;
            fraccionAnio = dias / denominador;
            console.log(`📊 calcularFraccionAnio [30/360 por defecto] - ${fechaInicioStr} a ${fechaFinStr}: ${dias} días / ${denominador} = ${fraccionAnio.toFixed(12)}`);
            break;
    }
    
    return fraccionAnio;
}

// Función para calcular TIR usando método solver por iteración
function calcularTIRLocal(flujos, fechas, fechaCompra) {
    // Obtener tipoInteresDias (base) para calcular fracciones de año
    const tipoInteresDias = parseInt(document.getElementById('tipoInteresDias')?.value) || 0;
    
    console.log('🔢 calcularTIRLocal - Iniciando cálculo TIR');
    console.log('📊 calcularTIRLocal - Tipo Interés Días:', tipoInteresDias);
    console.log('📊 calcularTIRLocal - Fecha Compra:', fechaCompra);
    console.log('📊 calcularTIRLocal - Flujos:', flujos);
    console.log('📊 calcularTIRLocal - Fechas:', fechas);
    
    // Función para calcular la sumatoria de flujos descontados para una tasa dada
    // IMPORTANTE: Usar valores completos sin truncar para máxima precisión
    function calcularSumatoriaFlujos(tasa) {
        let sumatoria = 0;
        
        for (let i = 0; i < flujos.length; i++) {
            // Usar valores completos sin truncar
            const flujoCompleto = Number(flujos[i]);
            const fraccionAnio = calcularFraccionAnio(fechaCompra, fechas[i], tipoInteresDias);
            let flujoDescontado;
            
            if (fraccionAnio > 0) {
                // Calcular con máxima precisión usando Math.pow
                flujoDescontado = flujoCompleto / Math.pow(1 + tasa, fraccionAnio);
            } else {
                flujoDescontado = flujoCompleto;
            }
            
            // Acumular sin truncar hasta el final
            sumatoria += flujoDescontado;
        }
        
        return sumatoria;
    }
    
    // Método solver: empezar desde 0% y ajustar según el signo de la sumatoria
    const maxIteraciones = 1000;
    const tolerancia = 0.000000000001; // Tolerancia para considerar sumatoria = 0 (12 decimales de precisión)
    const pasoInicial = 0.01; // Paso inicial de 1%
    const factorReduccion = 0.5; // Reducir paso a la mitad cuando cambia de signo
    
    let tasa = 0.0; // Empezar desde 0%
    let paso = pasoInicial;
    let sumatoria = calcularSumatoriaFlujos(tasa);
    
    console.log('🔍 calcularTIRLocal - Buscando TIR empezando desde 0%');
    console.log(`  📊 TIR inicial: ${(tasa * 100).toFixed(4)}%`);
    console.log(`  📊 Sumatoria inicial: ${sumatoria.toFixed(12)}`);
    
    // Si la sumatoria ya es 0 (o muy cercana), retornar 0%
    if (Math.abs(sumatoria) < tolerancia) {
        console.log(`✅ calcularTIRLocal - TIR encontrada: 0% (sumatoria ya es 0)`);
        return tasa;
    }
    
    // Determinar dirección inicial: si sumatoria es positiva, aumentar TIR; si es negativa, disminuir
    let direccion = sumatoria > 0 ? 1 : -1; // 1 = aumentar, -1 = disminuir
    let ultimaSumatoria = sumatoria;
    let ultimaTasa = tasa;
    let cambioSigno = false;
    
    console.log(`  📊 Dirección inicial: ${direccion > 0 ? 'Aumentar TIR' : 'Disminuir TIR'}`);
    
    // Iterar ajustando la TIR
    for (let i = 0; i < maxIteraciones; i++) {
        // Ajustar tasa según dirección
        tasa += direccion * paso;
        
        // Limitar tasa a un rango razonable
        if (tasa < -0.99) {
            tasa = -0.99;
            console.log(`  ⚠️ Tasa limitada a -99%`);
        }
        if (tasa > 10) {
            tasa = 10;
            console.log(`  ⚠️ Tasa limitada a 1000%`);
        }
        
        sumatoria = calcularSumatoriaFlujos(tasa);
        
        // Si encontramos la solución (sumatoria ≈ 0 con 12 decimales de precisión)
        if (Math.abs(sumatoria) < tolerancia) {
            console.log(`✅ calcularTIRLocal - TIR encontrada en iteración ${i + 1}: ${(tasa * 100).toFixed(4)}%`);
            console.log(`  📊 Sumatoria final: ${sumatoria.toFixed(12)} (debe ser 0.000000000000)`);
            // Validar que la sumatoria sea exactamente 0.000000000000 (12 decimales)
            const sumatoriaTruncada = window.truncarDecimal ? window.truncarDecimal(sumatoria, 12) : parseFloat(sumatoria.toFixed(12));
            if (Math.abs(sumatoriaTruncada) !== 0) {
                console.warn(`⚠️ Sumatoria no es exactamente 0: ${sumatoriaTruncada.toFixed(12)}`);
            } else {
                console.log(`✅ Sumatoria validada: exactamente 0.000000000000`);
            }
            return tasa;
        }
        
        // Detectar cambio de signo
        if (i > 0 && (ultimaSumatoria * sumatoria < 0)) {
            // Cambió el signo, estamos cerca de la solución
            cambioSigno = true;
            paso *= factorReduccion; // Reducir paso
            direccion *= -1; // Cambiar dirección
            console.log(`  🔄 Iteración ${i + 1}: Cambio de signo detectado. Reduciendo paso a ${(paso * 100).toFixed(4)}%`);
            
            // Si el paso es muy pequeño, usar bisección
            if (paso < 0.0001) {
                console.log(`  🔄 Cambiando a método de bisección...`);
                // Usar bisección entre ultimaTasa y tasa actual
                let tasaMin = Math.min(ultimaTasa, tasa);
                let tasaMax = Math.max(ultimaTasa, tasa);
                
                for (let j = 0; j < 100; j++) {
                    const tasaBiseccion = (tasaMin + tasaMax) / 2;
                    const sumatoriaBiseccion = calcularSumatoriaFlujos(tasaBiseccion);
                    
                    if (Math.abs(sumatoriaBiseccion) < tolerancia) {
                        console.log(`✅ calcularTIRLocal - TIR encontrada con bisección: ${(tasaBiseccion * 100).toFixed(4)}%`);
                        console.log(`  📊 Sumatoria final: ${sumatoriaBiseccion.toFixed(12)} (debe ser 0.000000000000)`);
                        // Validar que la sumatoria sea exactamente 0.000000000000 (12 decimales)
                        const sumatoriaTruncada = window.truncarDecimal ? window.truncarDecimal(sumatoriaBiseccion, 12) : parseFloat(sumatoriaBiseccion.toFixed(12));
                        if (Math.abs(sumatoriaTruncada) !== 0) {
                            console.warn(`⚠️ Sumatoria no es exactamente 0: ${sumatoriaTruncada.toFixed(12)}`);
                        } else {
                            console.log(`✅ Sumatoria validada: exactamente 0.000000000000`);
                        }
                        return tasaBiseccion;
                    }
                    
                    if (sumatoriaBiseccion > 0) {
                        tasaMin = tasaBiseccion;
                    } else {
                        tasaMax = tasaBiseccion;
                    }
                    
                    if (Math.abs(tasaMax - tasaMin) < 0.000000000001) {
                        break;
                    }
                }
                
                tasa = (tasaMin + tasaMax) / 2;
                const sumatoriaFinal = calcularSumatoriaFlujos(tasa);
                console.log(`✅ calcularTIRLocal - TIR convergida con bisección: ${(tasa * 100).toFixed(4)}%`);
                console.log(`  📊 Sumatoria final: ${sumatoriaFinal.toFixed(12)} (debe ser 0.000000000000)`);
                // Validar que la sumatoria sea exactamente 0.000000000000 (12 decimales)
                const sumatoriaTruncada = window.truncarDecimal ? window.truncarDecimal(sumatoriaFinal, 12) : parseFloat(sumatoriaFinal.toFixed(12));
                if (Math.abs(sumatoriaTruncada) !== 0) {
                    console.warn(`⚠️ Sumatoria no es exactamente 0: ${sumatoriaTruncada.toFixed(12)}`);
                } else {
                    console.log(`✅ Sumatoria validada: exactamente 0.000000000000`);
                }
                return tasa;
            }
        } else {
            // No cambió el signo, continuar en la misma dirección
            if (cambioSigno) {
                // Si ya habíamos detectado cambio de signo pero ahora no, volver a reducir paso
                paso *= factorReduccion;
            }
        }
        
        ultimaSumatoria = sumatoria;
        ultimaTasa = tasa;
        
        // Log cada 50 iteraciones o cuando cambia el signo
        if (i % 50 === 0 || cambioSigno) {
            console.log(`  🔄 Iteración ${i + 1}: TIR=${(tasa * 100).toFixed(4)}%, Sumatoria=${sumatoria.toFixed(12)}, Paso=${(paso * 100).toFixed(4)}%`);
        }
    }
    
    console.log(`⚠️ calcularTIRLocal - Máximo de iteraciones alcanzado. TIR aproximada: ${(tasa * 100).toFixed(4)}%`);
    console.log(`  📊 Sumatoria final: ${sumatoria.toFixed(12)}`);
    // Validar que la sumatoria sea lo más cercana posible a 0.000000000000 (12 decimales)
    const sumatoriaTruncada = window.truncarDecimal ? window.truncarDecimal(sumatoria, 12) : parseFloat(sumatoria.toFixed(12));
    console.log(`  📊 Sumatoria truncada a 12 decimales: ${sumatoriaTruncada.toFixed(12)}`);
    if (Math.abs(sumatoriaTruncada) !== 0) {
        console.warn(`⚠️ Sumatoria no es exactamente 0: ${sumatoriaTruncada.toFixed(12)}`);
    }
    return tasa;
}

// Calcular TIR
async function calcularTIR() {
    try {
        // Obtener fecha de compra
        const fechaCompraInput = document.getElementById('fechaCompra');
        const fechaCompra = fechaCompraInput?.value;
        
        if (!fechaCompra) {
            showError('Debe ingresar la fecha de compra');
            return;
        }
        
        // Obtener todos los datos
        const cashflow = obtenerDatosCashflow();
        
        // Validar que haya al menos la inversión inicial
        if (cashflow.length === 0) {
            showError('Debe agregar al menos la inversión inicial');
            return;
        }
        
        // Validar que todos los flujos estén ingresados (inversión y cupones)
        const filaInversion = cashflow.find(row => row.tipo === 'inversion');
        const cupones = cashflow.filter(row => row.tipo === 'cupon');
        
        if (!filaInversion || filaInversion.flujos === undefined || filaInversion.flujos === null || filaInversion.flujos === '') {
            showError('Debe ingresar el flujo de inversión');
            return;
        }
        
        if (cupones.length === 0) {
            showError('Debe agregar al menos un cupón con flujo');
            return;
        }
        
        // Validar que todos los cupones tengan flujos
        const cuponesSinFlujo = cupones.filter(cupon => 
            cupon.flujos === undefined || cupon.flujos === null || cupon.flujos === ''
        );
        
        if (cuponesSinFlujo.length > 0) {
            showError(`Faltan flujos en ${cuponesSinFlujo.length} cupón(es). Complete todos los flujos antes de calcular la TIR.`);
            return;
        }
        
        // Obtener tipoInteresDias (base) para los cálculos
        const tipoInteresDias = parseInt(document.getElementById('tipoInteresDias')?.value) || 0;
        console.log('📊 calcularTIR - Tipo Interés Días:', tipoInteresDias);
        
        // Preparar flujos y fechas para el cálculo desde la columna "Flujos"
        // IMPORTANTE: Obtener valores directamente de los inputs sin pasar por obtenerDatosCashflow
        // para evitar truncado y mantener máxima precisión (12 decimales)
        const flujos = [];
        const fechas = [];
        
        console.log('📊 calcularTIR - Obteniendo flujos directamente de los inputs (precisión completa)');
        const cashflowRowsForTIR = document.querySelectorAll('#cashflowBody tr');
        cashflowRowsForTIR.forEach((row, index) => {
            const tipo = row.getAttribute('data-tipo');
            if (!tipo) return;
            
            // Obtener flujo directamente del input sin truncar
            let flujosInput;
            if (tipo === 'inversion') {
                flujosInput = document.getElementById('flujos');
            } else {
                flujosInput = row.querySelector('.flujos');
            }
            
            // Obtener fecha liquidación
            let fechaLiqInput;
            if (tipo === 'inversion') {
                fechaLiqInput = document.getElementById('fechaLiquidacion');
            } else {
                fechaLiqInput = row.querySelector('.fecha-liquidacion');
            }
            
            if (flujosInput && flujosInput.value && fechaLiqInput && fechaLiqInput.value) {
                // Usar Number() para mantener máxima precisión (12 decimales)
                const flujoCompleto = Number(flujosInput.value) || 0;
                let fechaLiq = fechaLiqInput.value;
                
                // Convertir fecha a YYYY-MM-DD si está en DD/MM/AAAA
                if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaLiq)) {
                    fechaLiq = convertirFechaDDMMAAAAaYYYYMMDD(fechaLiq);
                }
                
                flujos.push(flujoCompleto);
                fechas.push(fechaLiq);
                console.log(`  💰 Fila ${index + 1} (${tipo}): Flujo=${flujoCompleto} (12 decimales), Fecha=${fechaLiq}`);
            }
        });
        
        console.log('📊 calcularTIR - Total flujos preparados:', flujos.length);
        console.log('📊 calcularTIR - Flujos:', flujos);
        console.log('📊 calcularTIR - Fechas:', fechas);
        
        if (flujos.length === 0) {
            showError('No hay flujos para calcular la TIR');
            return;
        }
        
        // Calcular TIR usando método solver por iteración
        console.log('🚀 calcularTIR - Iniciando cálculo de TIR...');
        const tir = calcularTIRLocal(flujos, fechas, fechaCompra);
        const tirPorcentaje = (tir * 100).toFixed(8);
        console.log(`✅ calcularTIR - TIR calculada: ${tirPorcentaje}%`);
        
        // Calcular flujos descontados a fecha de compra usando la TIR encontrada
        console.log('📊 calcularTIR - Calculando flujos descontados a fecha de compra...');
        const cashflowRows = document.querySelectorAll('#cashflowBody tr');
        let flujoIndex = 0;
        
        cashflowRows.forEach((row, rowIndex) => {
            // Para la fila de inversión, usar ID específico
            let flujosInput;
            const tipo = row.getAttribute('data-tipo');
            if (tipo === 'inversion') {
                flujosInput = document.getElementById('flujos');
        } else {
                flujosInput = row.querySelector('.flujos');
            }
            
            if (flujosInput && flujosInput.value && flujoIndex < flujos.length) {
                // Para la fila de inversión, usar ID específico; para cupones, usar clase
                let flujosDescFechaCompraInput;
                if (tipo === 'inversion') {
                    flujosDescFechaCompraInput = document.getElementById('flujosDescFechaCompra');
                } else {
                    flujosDescFechaCompraInput = row.querySelector('.flujos-desc-fecha-compra');
                }
                
                if (flujosDescFechaCompraInput) {
                    const fraccionAnio = calcularFraccionAnio(fechaCompra, fechas[flujoIndex], tipoInteresDias);
                    const flujoOriginal = flujos[flujoIndex];
                    
                    console.log(`  💰 Fila ${rowIndex + 1} (${tipo}): Flujo original=${flujoOriginal.toFixed(8)}, Fracción año=${fraccionAnio.toFixed(8)}`);
                    
                    if (fraccionAnio > 0) {
                        const flujoDescontado = flujoOriginal / Math.pow(1 + tir, fraccionAnio);
                        const valorTruncado = window.truncarDecimal ? window.truncarDecimal(flujoDescontado, 12) : parseFloat(flujoDescontado.toFixed(12));
                        flujosDescFechaCompraInput.value = valorTruncado;
                        console.log(`    ✅ Flujo descontado: ${flujoOriginal.toFixed(8)} / (1 + ${(tir * 100).toFixed(8)}%)^${fraccionAnio.toFixed(8)} = ${valorTruncado.toFixed(8)}`);
                    } else {
                        flujosDescFechaCompraInput.value = flujoOriginal;
                        console.log(`    ✅ Flujo sin descuento (fracción = 0): ${flujoOriginal.toFixed(8)}`);
                    }
                }
                flujoIndex++;
            }
        });
        
        console.log('✅ calcularTIR - Flujos descontados calculados y actualizados');
        
        // Validar que la sumatoria de flujos descontados sea exactamente 0.000000000000 (12 decimales)
        let sumatoriaFinal = 0;
        cashflowRows.forEach((row) => {
            const tipo = row.getAttribute('data-tipo');
            let flujosDescFechaCompraInput;
            if (tipo === 'inversion') {
                flujosDescFechaCompraInput = document.getElementById('flujosDescFechaCompra');
            } else {
                flujosDescFechaCompraInput = row.querySelector('.flujos-desc-fecha-compra');
            }
            if (flujosDescFechaCompraInput && flujosDescFechaCompraInput.value) {
                const flujoDescontado = Number(flujosDescFechaCompraInput.value) || 0;
                sumatoriaFinal += flujoDescontado;
            }
        });
        
        // Truncar a 8 decimales para mostrar (como en Excel)
        const sumatoriaMostrar = window.truncarDecimal ? window.truncarDecimal(sumatoriaFinal, 8) : parseFloat(sumatoriaFinal.toFixed(8));
        const sumatoriaTruncada = window.truncarDecimal ? window.truncarDecimal(sumatoriaFinal, 12) : parseFloat(sumatoriaFinal.toFixed(12));
        
        // Mostrar sumatoria en el footer
        const sumatoriaFlujosDesc = document.getElementById('sumatoriaFlujosDesc');
        const cashflowFooter = document.getElementById('cashflowFooter');
        if (sumatoriaFlujosDesc) {
            sumatoriaFlujosDesc.textContent = sumatoriaMostrar.toFixed(8);
        }
        if (cashflowFooter) {
            cashflowFooter.style.display = 'table-footer-group';
        }
        
        console.log(`📊 calcularTIR - Sumatoria final de flujos descontados: ${sumatoriaFinal.toFixed(12)}`);
        console.log(`📊 calcularTIR - Sumatoria truncada a 12 decimales: ${sumatoriaTruncada.toFixed(12)}`);
        console.log(`📊 calcularTIR - Sumatoria mostrada (8 decimales): ${sumatoriaMostrar.toFixed(8)}`);
        
        if (Math.abs(sumatoriaTruncada) === 0) {
            console.log(`✅ calcularTIR - Validación exitosa: Sumatoria = 0.000000000000 (12 decimales)`);
        } else {
            console.warn(`⚠️ calcularTIR - Sumatoria no es exactamente 0: ${sumatoriaTruncada.toFixed(12)}`);
            console.warn(`⚠️ calcularTIR - Diferencia: ${Math.abs(sumatoriaTruncada).toFixed(12)}`);
        }
        
        // Mostrar resultado de TIR con color según si es positivo o negativo
        const resultadoTIRDiv = document.getElementById('resultadoTIR');
        if (resultadoTIRDiv) {
            resultadoTIRDiv.textContent = tirPorcentaje + '%';
            // Verde si es positivo, rojo si es negativo
            if (tir >= 0) {
                resultadoTIRDiv.style.color = '#1e8e3e'; // Verde
            } else {
                resultadoTIRDiv.style.color = '#d93025'; // Rojo
            }
        }
        
        showSuccess(`TIR calculada: ${tirPorcentaje}%`);
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
        const resultadoTitulo = await pedirTituloModal();
        
        if (!resultadoTitulo || (typeof resultadoTitulo === 'string' && resultadoTitulo.trim() === '') || (typeof resultadoTitulo === 'object' && !resultadoTitulo.titulo)) {
            return; // Usuario canceló o no ingresó título
        }
        
        // Obtener título y flag de sobreescribir
        const titulo = typeof resultadoTitulo === 'string' ? resultadoTitulo.trim() : resultadoTitulo.titulo.trim();
        const sobreescribir = typeof resultadoTitulo === 'object' ? resultadoTitulo.sobreescribir : false;
        
        // Agregar título y flag de sobreescribir a los datos
        datos.titulo = titulo;
        datos.sobreescribir = sobreescribir;
        
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
                calculadorasExistentes = Array.from(calculadorasUnicas.values()).sort((a, b) => {
                    const fechaA = new Date(a.fecha_actualizacion || a.fecha_creacion);
                    const fechaB = new Date(b.fecha_actualizacion || b.fecha_creacion);
                    return fechaB - fechaA;
                });
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
        
        // Variable para indicar si se está sobreescribiendo
        let sobreescribir = false;
        
        // Agregar event listeners a calculadoras existentes
        modal.querySelectorAll('.calculadora-existente').forEach(item => {
            item.addEventListener('click', () => {
                const titulo = item.getAttribute('data-titulo');
                const inputTitulo = document.getElementById('inputTitulo');
                if (inputTitulo && titulo) {
                    inputTitulo.value = titulo;
                    inputTitulo.disabled = true;
                    inputTitulo.style.background = '#f1f3f4';
                    inputTitulo.style.cursor = 'not-allowed';
                    sobreescribir = true;
                    
                    // Mostrar mensaje indicando que se sobreescribirá
                    let mensajeSobreescribir = document.getElementById('mensajeSobreescribir');
                    if (!mensajeSobreescribir) {
                        mensajeSobreescribir = document.createElement('div');
                        mensajeSobreescribir.id = 'mensajeSobreescribir';
                        mensajeSobreescribir.style.cssText = 'font-size: 12px; color: var(--primary-color); margin-top: 4px; font-weight: 500;';
                        inputTitulo.parentElement.appendChild(mensajeSobreescribir);
                    }
                    mensajeSobreescribir.textContent = '✓ Se sobreescribirá la calculadora existente';
                }
            });
        });
        
        const inputTitulo = document.getElementById('inputTitulo');
        if (inputTitulo) {
            inputTitulo.focus();
            inputTitulo.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !inputTitulo.disabled) {
                    confirmarTitulo();
                } else if (e.key === 'Escape') {
                    cerrarModalTitulo(null);
                }
            });
            
            // Permitir habilitar el input si el usuario quiere escribir manualmente
            inputTitulo.addEventListener('input', () => {
                if (inputTitulo.disabled) {
                    inputTitulo.disabled = false;
                    inputTitulo.style.background = '';
                    inputTitulo.style.cursor = '';
                    sobreescribir = false;
                    const mensaje = document.getElementById('mensajeSobreescribir');
                    if (mensaje) mensaje.remove();
                }
            });
        }
        
        window.confirmarTitulo = () => {
            const titulo = inputTitulo?.value?.trim() || '';
            if (titulo) {
                cerrarModalTitulo({ titulo, sobreescribir });
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
// Función global para abrir modal de cargar (optimizada: solo carga títulos)
async function abrirModalCargar() {
    const modal = document.getElementById('modalCargar');
    if (!modal) {
        console.error('⚠️ Modal de cargar no encontrado');
        return;
    }
    
    modal.style.display = 'flex';
    
    // Cargar solo la lista de títulos (sin datos completos) para mejor rendimiento
    await cargarListaCalculadoras();
}

// Hacer función global para que esté disponible en onclick
window.abrirModalCargar = abrirModalCargar;

// Cerrar modal de cargar
function cerrarModalCargar() {
    const modal = document.getElementById('modalCargar');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Cargar lista de calculadoras guardadas
// Función optimizada: solo carga títulos y fechas, no datos completos
async function cargarListaCalculadoras() {
    const lista = document.getElementById('calculadorasLista');
    if (!lista) return;
    
    try {
        lista.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">Cargando calculadoras...</div>';
        
        console.log('📥 cargarListaCalculadoras - Cargando solo títulos (optimizado)...');
        const inicioTiempo = performance.now();
        
        // Endpoint optimizado: solo devuelve títulos, ticker y fechas (sin datos completos)
        const response = await fetch('/api/calculadora/listar');
        const result = await response.json();
        
        const tiempoCarga = performance.now() - inicioTiempo;
        console.log(`✅ cargarListaCalculadoras - Lista cargada en ${tiempoCarga.toFixed(2)}ms`);
        
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
        // Solo cargar datos completos cuando se seleccione una calculadora (optimización)
        const calculadoraItems = lista.querySelectorAll('.calculadora-item');
        calculadoraItems.forEach(item => {
            item.addEventListener('click', async () => {
                const titulo = item.getAttribute('data-titulo');
                if (titulo) {
                    // Mostrar indicador de carga
                    item.style.opacity = '0.6';
                    item.style.pointerEvents = 'none';
                    const textoOriginal = item.innerHTML;
                    item.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">Cargando calculadora...</div>';
                    
                    try {
                        console.log(`📥 Cargando datos completos de calculadora: ${titulo}`);
                        const inicioCarga = performance.now();
                        
                        await cargarCalculadora(titulo);
                        
                        const tiempoCarga = performance.now() - inicioCarga;
                        console.log(`✅ Calculadora cargada en ${tiempoCarga.toFixed(2)}ms`);
                        
                        cerrarModalCargar();
                    } catch (error) {
                        console.error('Error al cargar calculadora:', error);
                        item.innerHTML = textoOriginal;
                        item.style.opacity = '1';
                        item.style.pointerEvents = 'auto';
                        showError('Error al cargar la calculadora: ' + error.message);
                    }
                }
            });
        });
        
    } catch (error) {
        console.error('Error al cargar lista de calculadoras:', error);
        lista.innerHTML = `<div style="text-align: center; padding: 40px; color: #d93025;">Error al cargar calculadoras: ${error.message}</div>`;
    }
}

// Cargar una calculadora específica (carga datos completos solo cuando se selecciona)
async function cargarCalculadora(titulo) {
    try {
        console.log('📥 Cargando calculadora (datos completos):', titulo);
        const inicioCarga = performance.now();
        
        // Codificar el título correctamente
        const tituloCodificado = encodeURIComponent(titulo);
        const response = await fetch(`/api/calculadora/${tituloCodificado}`);
        
        const tiempoFetch = performance.now() - inicioCarga;
        console.log(`⏱️ Fetch completado en ${tiempoFetch.toFixed(2)}ms`);
        
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
        
        const tiempoProcesamiento = performance.now() - inicioCarga;
        console.log(`⏱️ Datos recibidos en ${tiempoProcesamiento.toFixed(2)}ms`);
        
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
                if (tipoInteresDiasInput) {
                    // Convertir valores antiguos (360, 365, 366) a nuevas bases (0, 1, 2, 3)
                    let base = datos.datosEspecie.tipo_interes_dias;
                    if (base === 360) base = 0;  // US 30/360
                    else if (base === 365) base = 3;  // Real/365
                    else if (base === 366) base = 1;  // Real/real
                    // Si ya es 0, 1, 2, o 3, mantenerlo
                    tipoInteresDiasInput.value = base;
                }
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
            // Si no tiene fecha_inicio pero tiene fecha_liquidacion, es inversión
            // Si tiene fecha_inicio y fecha_liquidacion, es cupón
            const filaInversion = datos.cashflow.find(row => !row.fecha_inicio && row.fecha_liquidacion);
            const cupones = datos.cashflow.filter(row => row.fecha_inicio && row.fecha_liquidacion);
            
            // Cargar fila de inversión si existe
            if (filaInversion) {
                if (filaInversion.fecha_liquidacion) {
                    const fechaLiquidacionInput = document.getElementById('fechaLiquidacion');
                    if (fechaLiquidacionInput) {
                        fechaLiquidacionInput.value = convertirFechaYYYYMMDDaDDMMAAAA(filaInversion.fecha_liquidacion);
                        aplicarMascaraFecha(fechaLiquidacionInput);
                    }
                }
                // No cargar valorCER y valorCERFinal desde BD - se autocompletan
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
                        <input type="text" class="input-table date-input fecha-inicio" id="fechaInicio${cuponCount}" value="${fechaInicioStr || ''}" placeholder="DD/MM/AAAA" maxlength="10" onchange="calcularDayCountFactor(this)" />
                    </td>
                    <td>
                        <input type="text" class="input-table date-input fecha-liquidacion" id="fechaLiquidacion${cuponCount}" value="${fechaLiquidacionStr || ''}" placeholder="DD/MM/AAAA" maxlength="10" onchange="calcularDayCountFactor(this)" />
                    </td>
                    <td>
                        <input type="text" class="input-table date-input fecha-inicio-cer" readonly placeholder="DD/MM/AAAA" maxlength="10" />
                    </td>
                    <td>
                        <input type="text" class="input-table date-input fecha-final-cer" readonly placeholder="DD/MM/AAAA" maxlength="10" />
                    </td>
                    <td class="cer-column"><input type="number" class="input-table valor-cer-inicio" step="0.0001" readonly /></td>
                    <td class="cer-column"><input type="number" class="input-table valor-cer-final" step="0.0001" readonly /></td>
                    <td><input type="number" class="input-table day-count-factor" readonly /></td>
                    <td><input type="number" class="input-table amortizacion" step="0.01" value="${cupon.amortizacion || ''}" onchange="recalcularCamposCupon(this)" /></td>
                    <td><input type="number" class="input-table valor-residual" step="0.01" onchange="recalcularValorResidualSiguiente(this)" /></td>
                    <td><input type="number" class="input-table amortizacion-ajustada" step="0.01" readonly /></td>
                    <td><input type="number" class="input-table renta-nominal" step="0.01" readonly value="${cupon.renta_nominal || ''}" /></td>
                    <td><input type="number" class="input-table renta-tna" step="0.01" value="${cupon.renta_tna || ''}" onchange="calcularRentaNominal(this)" /></td>
                    <td><input type="number" class="input-table renta-ajustada" step="0.01" readonly /></td>
                    <td><input type="number" class="input-table factor-actualizacion" step="0.0001" readonly /></td>
                    <td><input type="number" class="input-table pagos-actualizados" step="0.01" readonly /></td>
        <td class="flujos-column"><input type="number" class="input-table flujos" step="0.01" readonly /></td>
        <td class="flujos-column"><input type="number" class="input-table flujos-desc-fecha-compra" step="0.01" readonly /></td>
                    <td>
                        <button onclick="eliminarCupon(${cuponCount})" style="background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center;" title="Eliminar cupón">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#d93025">
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
            
            // Calcular fechas CER solo si no están ya cargadas desde BD
            // Esto evita sobrescribir valores que ya existen
            setTimeout(() => {
                calcularFechasCER();
                // Recalcular coeficientes después de que se completen los valores CER
                setTimeout(() => {
                    calcularCoeficientesCER();
                }, 300);
            }, 100);
        }
        
        // Autocompletar valor CER emisión si existe fechaEmision
        const fechaEmisionInput = document.getElementById('fechaEmision');
        if (fechaEmisionInput && fechaEmisionInput.value) {
            // Disparar el evento change para autocompletar valor CER emisión
            setTimeout(() => {
                fechaEmisionInput.dispatchEvent(new Event('change'));
            }, 200);
        }
        
        // Aplicar máscaras a todos los campos de fecha después de cargar
        const fechaInputs = document.querySelectorAll('.date-input');
        fechaInputs.forEach(input => {
            aplicarMascaraFecha(input);
        });
        
        // Guardar en localStorage después de cargar
        guardarDatosLocalStorage();
        
        const tiempoTotal = performance.now() - inicioCarga;
        console.log(`✅ Calculadora cargada completamente en ${tiempoTotal.toFixed(2)}ms`);
        
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
                if (tipoInteresDiasInput) {
                    // Convertir valores antiguos (360, 365, 366) a nuevas bases (0, 1, 2, 3)
                    let base = datos.datosEspecie.tipoInteresDias;
                    if (base === 360) base = 0;  // US 30/360
                    else if (base === 365) base = 3;  // Real/365
                    else if (base === 366) base = 1;  // Real/real
                    // Si ya es 0, 1, 2, o 3, mantenerlo
                    tipoInteresDiasInput.value = base;
                }
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
                // valorCERFinal tiene id="valorCERFinal"
                if (filaInversion.valorCERFinal !== undefined) {
                    const valorCERFinalInput = document.getElementById('valorCERFinal');
                    if (valorCERFinalInput) valorCERFinalInput.value = filaInversion.valorCERFinal || '';
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
                            <input type="text" class="input-table date-input fecha-inicio" id="fechaInicio${cuponCount}" value="${fechaInicioDDMM || ''}" placeholder="DD/MM/AAAA" maxlength="10" onchange="calcularDayCountFactor(this)" />
                        </td>
                        <td>
                            <input type="text" class="input-table date-input fecha-liquidacion" id="fechaLiquidacion${cuponCount}" value="${fechaLiquidacionDDMM || ''}" placeholder="DD/MM/AAAA" maxlength="10" onchange="calcularDayCountFactor(this)" />
                        </td>
                        <td>
                            <input type="text" class="input-table date-input fecha-inicio-cer" readonly placeholder="DD/MM/AAAA" maxlength="10" />
                        </td>
                        <td>
                            <input type="text" class="input-table date-input fecha-final-cer" readonly placeholder="DD/MM/AAAA" maxlength="10" />
                        </td>
                        <td class="cer-column"><input type="number" class="input-table valor-cer-inicio" step="0.0001" readonly /></td>
                        <td class="cer-column"><input type="number" class="input-table valor-cer-final" step="0.0001" readonly /></td>
                        <td><input type="number" class="input-table day-count-factor" readonly /></td>
                        <td><input type="number" class="input-table amortizacion" step="0.01" value="${cupon.amortizacion || ''}" onchange="recalcularCamposCupon(this)" /></td>
                        <td><input type="number" class="input-table valor-residual" step="0.01" value="${cupon.valorResidual || ''}" onchange="recalcularValorResidualSiguiente(this)" /></td>
                        <td><input type="number" class="input-table amortizacion-ajustada" step="0.01" readonly value="${cupon.amortizacionAjustada || ''}" /></td>
                        <td><input type="number" class="input-table renta-nominal" step="0.01" readonly value="${cupon.rentaNominal || ''}" /></td>
                        <td><input type="number" class="input-table renta-tna" step="0.01" value="${cupon.rentaTNA || ''}" onchange="calcularRentaNominal(this)" /></td>
                        <td><input type="number" class="input-table renta-ajustada" step="0.01" readonly value="${cupon.rentaAjustada || ''}" /></td>
                        <td><input type="number" class="input-table factor-actualizacion" step="0.0001" readonly value="${cupon.factorActualizacion || ''}" /></td>
                        <td><input type="number" class="input-table pagos-actualizados" step="0.01" readonly value="${cupon.pagosActualizados || ''}" /></td>
                        <td><input type="number" class="input-table flujos" step="0.01" readonly value="${cupon.flujos || ''}" /></td>
                        <td><input type="number" class="input-table flujos-desc-fecha-compra" step="0.01" readonly value="${cupon.flujosDescFechaCompra || ''}" /></td>
                        <td>
                            <button onclick="eliminarCupon(${cuponCount})" style="background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center;" title="Eliminar cupón">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#d93025">
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
            
            // Inicializar valor residual en 100 para el primer cupón si no tiene valor
            const rowsCupones = document.querySelectorAll('#cashflowBody tr[data-tipo="cupon"]');
            if (rowsCupones.length > 0) {
                const primerValorResidualInput = rowsCupones[0].querySelector('.valor-residual');
                if (primerValorResidualInput && !primerValorResidualInput.value) {
                    primerValorResidualInput.value = 100;
                }
            }
            
            // Calcular fechas CER y autocompletar valores CER después de cargar todos los cupones
            // Esperar un poco más para asegurar que todos los datos estén cargados
            setTimeout(() => {
                calcularFechasCER();
                // Recalcular coeficientes después de que se completen los valores CER
                setTimeout(() => {
                    calcularCoeficientesCER();
                    recalcularTodosCamposDependientes();
                }, 300);
            }, 300);
        }
        
        // Autocompletar valor CER emisión si existe fechaEmision
        const fechaEmisionInput = document.getElementById('fechaEmision');
        if (fechaEmisionInput && fechaEmisionInput.value) {
            // Disparar el evento change para autocompletar valor CER emisión
            setTimeout(() => {
                fechaEmisionInput.dispatchEvent(new Event('change'));
            }, 200);
        }
        
    } catch (error) {
        console.error('Error al cargar desde localStorage:', error);
    }
}

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    console.log('Calculadora CER inicializada');
    
    // Cargar feriados y CER desde BD al iniciar (NO cargar calculadora automáticamente)
    cargarDatosDesdeBD();
    
    // Aplicar máscara a todos los campos de fecha
    const fechaInputs = document.querySelectorAll('.date-input');
    fechaInputs.forEach(input => {
        aplicarMascaraFecha(input);
    });
    
    // Agregar listener para calcular fecha final intervalo cuando cambia fechaLiquidacion de inversión
    const fechaLiquidacionInversionInput = document.getElementById('fechaLiquidacion');
    if (fechaLiquidacionInversionInput) {
        fechaLiquidacionInversionInput.addEventListener('change', () => {
            // Calcular fechas CER cuando cambia la fecha de liquidación de inversión
            setTimeout(() => {
                calcularFechasCER();
            }, 100);
        });
    }
    
    // Agregar listeners para recalcular fechas CER cuando cambian los intervalos
    const intervaloInicioInput = document.getElementById('intervaloInicio');
    const intervaloFinInput = document.getElementById('intervaloFin');
    if (intervaloInicioInput) {
        intervaloInicioInput.addEventListener('change', () => {
            setTimeout(() => {
                calcularFechasCER();
            }, 100);
        });
    }
    if (intervaloFinInput) {
        intervaloFinInput.addEventListener('change', () => {
            setTimeout(() => {
                calcularFechasCER();
            }, 100);
        });
    }
    
    // Agregar listeners para recalcular flujos cuando cambien cantidadPartida o precioCompra
    const cantidadPartidaInput = document.getElementById('cantidadPartida');
    const precioCompraInput = document.getElementById('precioCompra');
    
    if (cantidadPartidaInput) {
        cantidadPartidaInput.addEventListener('change', () => {
            console.log('🔄 cantidadPartida cambió, recalculando flujos');
            recalcularTodosFlujos();
        });
        cantidadPartidaInput.addEventListener('input', () => {
            // También recalcular mientras se escribe (con debounce)
            setTimeout(() => {
                recalcularTodosFlujos();
            }, 300);
        });
    }
    
    if (precioCompraInput) {
        precioCompraInput.addEventListener('change', () => {
            console.log('🔄 precioCompra cambió, recalculando flujos');
            recalcularTodosFlujos();
        });
        precioCompraInput.addEventListener('input', () => {
            // También recalcular mientras se escribe (con debounce)
            setTimeout(() => {
                recalcularTodosFlujos();
            }, 300);
        });
    }
    
    // Observar cambios en los coeficientes CER para recalcular campos dependientes
    const coeficienteCEREmisionDiv = document.getElementById('coeficienteCEREmision');
    const coeficienteCERCompraDiv = document.getElementById('coeficienteCERCompra');
    
    if (coeficienteCEREmisionDiv) {
        const observerEmision = new MutationObserver(() => {
            recalcularTodosCamposDependientes();
        });
        observerEmision.observe(coeficienteCEREmisionDiv, { childList: true, characterData: true, subtree: true });
    }
    
    if (coeficienteCERCompraDiv) {
        const observerCompra = new MutationObserver(() => {
            console.log('🔄 Coeficiente CER Compra cambió, recalculando flujos');
            recalcularTodosFlujos();
        });
        observerCompra.observe(coeficienteCERCompraDiv, { childList: true, characterData: true, subtree: true });
    }
    
    // Recalcular flujos inicialmente si ya hay datos disponibles (después de cargar CER y feriados)
    setTimeout(() => {
        const cantidadPartida = parseFloat(document.getElementById('cantidadPartida')?.value) || 0;
        const precioCompra = parseFloat(convertirNumeroDecimal(document.getElementById('precioCompra')?.value)) || 0;
        const coeficienteCERCompra = parseFloat(document.getElementById('coeficienteCERCompra')?.textContent) || 0;
        
        console.log('🔄 Verificando datos iniciales - Cantidad:', cantidadPartida, 'Precio:', precioCompra, 'Coef:', coeficienteCERCompra);
        
        if (cantidadPartida > 0 && precioCompra > 0 && coeficienteCERCompra > 0) {
            console.log('✅ Datos iniciales disponibles, recalculando flujos');
            recalcularTodosFlujos();
        } else {
            console.log('⚠️ Faltan datos iniciales para calcular flujos');
        }
    }, 2000);
    
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
    
    // Autocompletar valor CER emisión cuando cambia fechaEmision
    const fechaEmisionInput = document.getElementById('fechaEmision');
    const valorCEREmisionInput = document.getElementById('valorCEREmision');
    if (fechaEmisionInput && valorCEREmisionInput) {
        fechaEmisionInput.addEventListener('change', () => {
            if (fechaEmisionInput.value) {
                let fechaEmision = fechaEmisionInput.value;
                // Convertir de DD/MM/AAAA a YYYY-MM-DD si es necesario
                if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaEmision)) {
                    fechaEmision = convertirFechaDDMMAAAAaYYYYMMDD(fechaEmision);
                }
                const fechaEmisionDate = crearFechaDesdeString(fechaEmision);
                if (fechaEmisionDate) {
                    // Obtener intervaloFin para calcular fecha final intervalo
                    const intervaloFin = parseInt(document.getElementById('intervaloFin')?.value) || 0;
                    // Obtener feriados del cache
                    const intervaloInicio = parseInt(document.getElementById('intervaloInicio')?.value) || 0;
                    const fechaMin = new Date(fechaEmisionDate);
                    const fechaMax = new Date(fechaEmisionDate);
                    const diasExtras = Math.max(Math.abs(intervaloInicio), Math.abs(intervaloFin)) + 10;
                    fechaMin.setDate(fechaMin.getDate() - diasExtras);
                    fechaMax.setDate(fechaMax.getDate() + diasExtras);
                    const fechaDesdeStr = formatearFechaInput(fechaMin);
                    const fechaHastaStr = formatearFechaInput(fechaMax);
                    const feriados = obtenerFeriadosCache(fechaDesdeStr, fechaHastaStr);
                    
                    // Calcular fecha final intervalo desde fecha emisión
                    const fechaFinalIntervaloEmision = calcularFechaConDiasHabiles(fechaEmisionDate, intervaloFin, feriados);
                    if (fechaFinalIntervaloEmision) {
                        const fechaFinalIntervaloEmisionStr = formatearFechaInput(fechaFinalIntervaloEmision);
                        const cerEmision = obtenerValorCER(fechaFinalIntervaloEmisionStr);
                        if (cerEmision !== null) {
                            const valorTruncado = window.truncarDecimal ? window.truncarDecimal(cerEmision, 8) : parseFloat(cerEmision.toFixed(8));
                            valorCEREmisionInput.value = valorTruncado;
                            console.log('✅ Valor CER Emisión asignado:', valorTruncado);
                            // Recalcular coeficientes CER cuando se actualiza el valor CER emisión
                            setTimeout(() => {
                                calcularCoeficientesCER();
                            }, 50);
                        } else {
                            valorCEREmisionInput.value = '';
                            console.warn('⚠️ No se encontró CER para fecha de emisión');
                        }
                    }
                }
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
            
            // Verificar ancho del header (ahora puede tener dos líneas, así que es más pequeño)
            const headerText = header.textContent || '';
            if (headerText.trim() !== '') {
                tieneContenido = true;
                // Headers con dos líneas son más angostos
                const lineas = headerText.split('\n');
                const anchoHeader = Math.max(...lineas.map(l => l.length)) * 7 + 16;
                maxWidth = Math.max(maxWidth, anchoHeader);
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
                            const anchoAprox = Math.max(50, valor.length * 7 + 16);
                            maxWidth = Math.max(maxWidth, anchoAprox);
                        }
                    }
                }
            });
            
            // Aplicar ancho mínimo si no hay contenido, ancho calculado si hay
            if (!tieneContenido) {
                header.style.minWidth = '40px';
                header.style.width = '40px';
                header.style.maxWidth = '40px';
            } else {
                // Usar un ancho más pequeño ya que los headers son de dos líneas
                header.style.minWidth = Math.max(60, Math.min(120, maxWidth)) + 'px';
                header.style.width = 'auto';
                header.style.maxWidth = 'none';
            }
        });
    }
    
    // Desactivar autoajuste ya que todas las columnas tienen ancho fijo de 12ch
    // setTimeout(autoajustarColumnas, 500);
    
    // Observar cambios en la tabla (solo para otras funcionalidades, no para reajustar ancho)
    // const tabla = document.getElementById('cashflowTable');
    // const tbody = tabla ? tabla.querySelector('tbody') : null;
    // if (tbody) {
    //     const observerTabla = new MutationObserver(() => {
    //         // No reajustar ancho, mantener 12ch fijo
    //     });
    //     observerTabla.observe(tbody, { childList: true, subtree: true });
    // }
    
    // Función para truncar decimales (global, por defecto 12 para mayor precisión en TIR)
    window.truncarDecimal = function(numero, decimales = 12) {
        if (numero === null || numero === undefined || numero === '') return numero;
        const num = parseFloat(numero);
        if (isNaN(num)) return numero;
        return parseFloat(num.toFixed(decimales));
    };
    
    // Aplicar truncado a inputs numéricos al cambiar y agregar tooltip con valor completo
    const numericInputs = document.querySelectorAll('input[type="number"]');
    numericInputs.forEach(input => {
        // Determinar decimales según el tipo de campo
        const esCampoPrecision12 = input.classList.contains('day-count-factor') || 
                                  input.classList.contains('amortizacion-ajustada') ||
                                  input.classList.contains('renta-nominal') ||
                                  input.classList.contains('renta-tna') ||
                                  input.classList.contains('renta-ajustada') ||
                                  input.classList.contains('factor-actualizacion') ||
                                  input.classList.contains('pagos-actualizados') ||
                                  input.classList.contains('flujos') ||
                                  input.classList.contains('flujos-desc-fecha-compra');
        
        // Función para actualizar tooltip con valor completo
        const actualizarTooltip = () => {
            if (input.value && !isNaN(parseFloat(input.value))) {
                const valorCompleto = parseFloat(input.value).toFixed(12);
                input.setAttribute('title', valorCompleto);
            } else {
                input.removeAttribute('title');
            }
        };
        
        // Actualizar tooltip cuando cambia el valor
        input.addEventListener('input', actualizarTooltip);
        input.addEventListener('change', actualizarTooltip);
        
        input.addEventListener('blur', () => {
            if (input.value && !isNaN(parseFloat(input.value))) {
                const decimales = esCampoPrecision12 ? 12 : 8;
                const valorTruncado = window.truncarDecimal ? window.truncarDecimal(input.value, decimales) : parseFloat(parseFloat(input.value).toFixed(decimales));
                if (valorTruncado !== parseFloat(input.value)) {
                    input.value = valorTruncado;
                }
                actualizarTooltip();
            }
        });
        
        // Inicializar tooltip
        actualizarTooltip();
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

