// JavaScript para la calculadora Variable (TAMAR/BADLAR)

// Contador de cupones
let cuponCount = 0;

// Cache de feriados
let cacheFeriados = [];
let cacheFeriadosRango = null;

// Cache de datos TAMAR/BADLAR
let cacheTAMAR = [];
let cacheBADLAR = [];
let cacheTAMARRango = null;
let cacheBADLARRango = null;

// Variable global para almacenar la última TIR calculada
let ultimaTIRCalculada = null;

// Función global para abrir modal de cargar (definida al inicio para estar disponible inmediatamente)
window.abrirModalCargar = async function() {
    const modal = document.getElementById('modalCargar');
    if (!modal) {
        console.error('⚠️ Modal de cargar no encontrado');
        return;
    }
    
    modal.style.display = 'flex';
    
    // Cargar lista de calculadoras (solo títulos, optimizado)
    if (typeof cargarListaCalculadoras === 'function') {
        await cargarListaCalculadoras();
    } else {
        console.warn('⚠️ cargarListaCalculadoras no está disponible aún');
    }
};

// Agregar nuevo cupón a la tabla
function agregarCupon() {
    cuponCount++;
    const tbody = document.getElementById('cashflowBody');
    
    const row = document.createElement('tr');
    row.setAttribute('data-cupon-id', cuponCount);
    row.setAttribute('data-tipo', 'cupon');
    
    // Calcular número de cupón (contar cupones existentes + 1)
    const cuponesExistentes = tbody.querySelectorAll('tr[data-tipo="cupon"]').length;
    const numeroCupon = cuponesExistentes + 1;
    
    // Obtener tipo de tasa seleccionada
    const tasaSeleccionada = document.getElementById('tasa')?.value || '';
    const tipoTasa = tasaSeleccionada === 'badlar' ? 'badlar' : 'tamar';
    
    row.innerHTML = `
        <td style="text-align: center; font-weight: 600; color: var(--text-primary);">${numeroCupon}</td>
        <td>
            <input type="text" class="input-table date-input fecha-inicio" id="fechaInicio${cuponCount}" placeholder="DD/MM/AAAA" maxlength="10" onchange="calcularDayCountFactor(this)" />
        </td>
        <td>
            <input type="text" class="input-table date-input fecha-liquidacion" id="fechaLiquidacion${cuponCount}" placeholder="DD/MM/AAAA" maxlength="10" onchange="calcularDayCountFactor(this)" />
        </td>
        <td class="autocomplete-column">
            <input type="text" class="input-table date-input fecha-inicio-cer" readonly placeholder="DD/MM/AAAA" maxlength="10" />
        </td>
        <td class="autocomplete-column">
            <input type="text" class="input-table date-input fecha-final-cer" readonly placeholder="DD/MM/AAAA" maxlength="10" />
        </td>
        <td class="autocomplete-column"><input type="number" class="input-table day-count-factor" readonly /></td>
        <td><input type="number" class="input-table amortizacion" step="0.01" onchange="recalcularCamposCupon(this); recalcularFlujos(this.closest('tr'));" /></td>
        <td><input type="number" class="input-table valor-residual" step="0.01" onchange="recalcularValorResidualSiguiente(this)" /></td>
        <td><input type="text" class="input-table renta-nominal" readonly /></td>
        <td><input type="text" class="input-table renta-tna" onchange="calcularRentaNominal(this); recalcularFlujos(this.closest('tr'));" onblur="convertirNumeroDecimal(this)" /></td>
        <td><input type="number" class="input-table factor-actualizacion" step="0.0001" readonly /></td>
        <td><input type="number" class="input-table pagos-actualizados" step="0.01" readonly /></td>
        <td class="flujos-column"><input type="number" class="input-table flujos" step="0.01" readonly /></td>
        <td class="flujos-column"><input type="number" class="input-table flujos-desc-fecha-compra" step="0.01" readonly /></td>
        <td style="display: flex; gap: 4px; align-items: center; justify-content: center;">
            <button onclick="abrirTasaConFiltros('${tipoTasa}', ${cuponCount})" style="background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center;" title="Ver ${tipoTasa.toUpperCase()}">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#5f6368">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
            </button>
            <button onclick="eliminarCupon(${cuponCount})" style="background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center;" title="Eliminar cupón">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#d93025">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
            </button>
        </td>
    `;
    
    tbody.appendChild(row);
    
    // Agregar event listeners programáticamente para asegurar que funcionen
    const amortizacionInput = row.querySelector('.amortizacion');
    const valorResidualInput = row.querySelector('.valor-residual');
    
    if (amortizacionInput) {
        amortizacionInput.addEventListener('change', function() {
            recalcularCamposCupon(this);
        });
        amortizacionInput.addEventListener('input', function() {
            // También recalcular en tiempo real si es necesario
            setTimeout(() => {
                recalcularCamposCupon(this);
            }, 100);
        });
    }
    
    if (valorResidualInput) {
        valorResidualInput.addEventListener('change', function() {
            recalcularValorResidualSiguiente(this);
        });
    }
    
    // Calcular Day Count Factor para la nueva fila
    const inputs = row.querySelectorAll('input');
    if (inputs[0].value && inputs[1].value) {
        calcularDayCountFactor(inputs[1]);
    }
    
    // Inicializar valor residual en 100 para el primer cupón
    const rows = document.querySelectorAll('#cashflowBody tr[data-tipo="cupon"]');
    if (rows.length === 1) {
        const valorResidualInput2 = row.querySelector('.valor-residual');
        if (valorResidualInput2 && !valorResidualInput2.value) {
            valorResidualInput2.value = 100;
        }
    }
    
    // Recalcular campos después de agregar cupón
    setTimeout(() => {
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
            // Recalcular campos después de eliminar cupón
            setTimeout(() => {
                recalcularTodosCamposDependientes();
            }, 100);
        }
    }
}

// Cambiar fórmula seleccionada
function cambiarFormula() {
    const formula = document.getElementById('formula')?.value || '';
    const rentaTNAInput = document.getElementById('rentaTNA');
    
    if (!rentaTNAInput) return;
    
    if (formula === 'tasa-fija') {
        // Tasa fija: habilitar input manual
        rentaTNAInput.readOnly = false;
        rentaTNAInput.placeholder = 'Ej: 0.05';
    } else if (formula === 'promedio-aritmetico') {
        // Promedio aritmético: calcular automáticamente
        rentaTNAInput.readOnly = true;
        rentaTNAInput.placeholder = 'Se autocompleta';
        calcularPromedioAritmetico();
    } else {
        // Promedio N tasas: por ahora igual que promedio aritmético
        rentaTNAInput.readOnly = true;
        rentaTNAInput.placeholder = 'Se autocompleta';
        calcularPromedioAritmetico();
    }
}

// Cambiar tasa seleccionada
function cambiarTasa() {
    // Recalcular promedio si la fórmula es promedio aritmético
    const formula = document.getElementById('formula')?.value || '';
    if (formula === 'promedio-aritmetico' || formula === 'promedio-n-tasas') {
        calcularPromedioAritmetico();
    }
}

// Verificar y replicar renta TNA para cupones con fecha inicio > fecha valuación
function verificarYReplicarRentaTNA() {
    const fechaValuacionInput = document.getElementById('fechaValuacion');
    if (!fechaValuacionInput || !fechaValuacionInput.value) return;
    
    const fechaValuacionStr = convertirFechaDDMMAAAAaYYYYMMDD(fechaValuacionInput.value);
    if (!fechaValuacionStr) return;
    
    const fechaValuacionDate = crearFechaDesdeString(fechaValuacionStr);
    if (!fechaValuacionDate) return;
    
    const rows = document.querySelectorAll('#cashflowBody tr[data-tipo="cupon"]');
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const fechaInicioInput = row.querySelector('.fecha-inicio');
        const rentaTNAInputCupon = row.querySelector('.renta-tna');
        
        if (!fechaInicioInput || !rentaTNAInputCupon || !fechaInicioInput.value) continue;
        
        const fechaInicioStr = convertirFechaDDMMAAAAaYYYYMMDD(fechaInicioInput.value);
        if (!fechaInicioStr) continue;
        
        const fechaInicioDate = crearFechaDesdeString(fechaInicioStr);
        if (!fechaInicioDate) continue;
        
        // Si fecha inicio > fecha valuación y hay cupón anterior, replicar renta TNA
        if (fechaInicioDate > fechaValuacionDate && i > 0) {
            const cuponAnterior = rows[i - 1];
            const rentaTNAAnterior = cuponAnterior.querySelector('.renta-tna');
            if (rentaTNAAnterior && rentaTNAAnterior.value) {
                rentaTNAInputCupon.value = rentaTNAAnterior.value;
                calcularRentaNominal(rentaTNAInputCupon);
                recalcularFlujos(row);
                console.log(`🔄 verificarYReplicarRentaTNA - Cupón ${i + 1}: Renta TNA replicada del cupón anterior`);
            }
        }
    }
}

// Calcular renta TNA con spread
function calcularRentaTNAConSpread() {
    const spreadInput = document.getElementById('spread');
    const rentaTNAInput = document.getElementById('rentaTNA');
    
    if (!spreadInput || !rentaTNAInput) return;
    
    const spread = parseFloat(spreadInput.value) || 0;
    const rentaTNAActual = parseFloat(rentaTNAInput.value) || 0;
    
    // Si hay spread, sumarlo a la renta TNA
    if (spread !== 0 && rentaTNAActual !== 0) {
        const nuevaRentaTNA = rentaTNAActual + spread;
        rentaTNAInput.value = nuevaRentaTNA.toFixed(8);
        
        // Recalcular renta nominal en todos los cupones
        const rows = document.querySelectorAll('#cashflowBody tr[data-tipo="cupon"]');
        rows.forEach(row => {
            const rentaTNAInputCupon = row.querySelector('.renta-tna');
            if (rentaTNAInputCupon) {
                calcularRentaNominal(rentaTNAInputCupon);
            }
        });
    }
}

// Calcular promedio aritmético de TAMAR/BADLAR
async function calcularPromedioAritmetico() {
    const formula = document.getElementById('formula')?.value || '';
    const tasa = document.getElementById('tasa')?.value || '';
    const intervaloInicio = parseInt(document.getElementById('intervaloInicio')?.value) || 0;
    const intervaloFin = parseInt(document.getElementById('intervaloFin')?.value) || 0;
    const rentaTNAInput = document.getElementById('rentaTNA');
    
    if (!formula || !tasa || !rentaTNAInput) return;
    
    if (formula !== 'promedio-aritmetico' && formula !== 'promedio-n-tasas') return;
    
    // Obtener todas las filas de cupones
    const rows = document.querySelectorAll('#cashflowBody tr[data-tipo="cupon"]');
    
    if (rows.length === 0) return;
    
    // Obtener fecha de valuación para comparar
    const fechaValuacionInput = document.getElementById('fechaValuacion');
    let fechaValuacionDate = null;
    if (fechaValuacionInput && fechaValuacionInput.value) {
        const fechaValuacionStr = convertirFechaDDMMAAAAaYYYYMMDD(fechaValuacionInput.value);
        if (fechaValuacionStr) {
            fechaValuacionDate = crearFechaDesdeString(fechaValuacionStr);
        }
    }
    
    // Calcular promedio para cada cupón
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const fechaInicioInput = row.querySelector('.fecha-inicio');
        const fechaInicioCERInput = row.querySelector('.fecha-inicio-cer');
        const fechaFinalCERInput = row.querySelector('.fecha-final-cer');
        const rentaTNAInputCupon = row.querySelector('.renta-tna');
        
        if (!fechaInicioInput || !fechaInicioCERInput || !fechaFinalCERInput || !rentaTNAInputCupon) continue;
        
        const fechaInicio = fechaInicioInput.value;
        const fechaInicioCER = fechaInicioCERInput.value;
        const fechaFinalCER = fechaFinalCERInput.value;
        
        if (!fechaInicio) continue;
        
        // Verificar si fecha de inicio del cupón es mayor que fecha de valuación
        const fechaInicioDate = crearFechaDesdeString(convertirFechaDDMMAAAAaYYYYMMDD(fechaInicio));
        const debeReplicar = fechaValuacionDate && fechaInicioDate && fechaInicioDate > fechaValuacionDate;
        
        if (debeReplicar && i > 0) {
            // Replicar renta TNA del cupón anterior
            const cuponAnterior = rows[i - 1];
            const rentaTNAAnterior = cuponAnterior.querySelector('.renta-tna');
            if (rentaTNAAnterior && rentaTNAAnterior.value) {
                rentaTNAInputCupon.value = rentaTNAAnterior.value;
                calcularRentaNominal(rentaTNAInputCupon);
                console.log(`🔄 calcularPromedioAritmetico - Cupón ${i + 1}: Renta TNA replicada del cupón anterior (fecha inicio > fecha valuación)`);
                continue;
            }
        }
        
        // Si no hay fechas CER, no se puede calcular el promedio
        if (!fechaInicioCER || !fechaFinalCER) continue;
        
        // Convertir fechas de DD/MM/AAAA a YYYY-MM-DD (igual que en la lupa)
        // La lupa usa las fechas SIN ajustar, así que usamos las fechas originales
        const fechaDesdeStr = convertirFechaDDMMAAAAaYYYYMMDD(fechaInicioCER);
        const fechaHastaStr = convertirFechaDDMMAAAAaYYYYMMDD(fechaFinalCER);
        
        if (!fechaDesdeStr || !fechaHastaStr) continue;
        
        console.log(`📊 calcularPromedioAritmetico - Intervalo: ${fechaInicioCER} a ${fechaFinalCER} (${fechaDesdeStr} a ${fechaHastaStr})`);
        
        // Obtener valores usando las fechas originales (igual que la lupa)
        let valores = [];
        if (tasa === 'badlar') {
            valores = await obtenerValoresBADLAR(fechaDesdeStr, fechaHastaStr);
        } else if (tasa === 'tamar') {
            valores = await obtenerValoresTAMAR(fechaDesdeStr, fechaHastaStr);
        }
        
        if (valores.length === 0) {
            console.warn('⚠️ No se encontraron valores de', tasa.toUpperCase(), 'para el intervalo');
            continue;
        }
        
        // Calcular promedio aritmético (igual que en tamar.js/badlar.js)
        // Filtrar valores null/undefined antes de calcular
        const valoresValidos = valores.filter(item => {
            const valor = item.valor;
            return valor !== null && valor !== undefined && !isNaN(parseFloat(valor));
        });
        
        if (valoresValidos.length === 0) {
            console.warn('⚠️ No hay valores válidos para calcular el promedio');
            continue;
        }
        
        // Sumar solo valores válidos (igual que en tamar.js)
        let suma = 0;
        valoresValidos.forEach(item => {
            suma += parseFloat(item.valor);
        });
        
        const promedio = suma / valoresValidos.length;
        
        // Aplicar spread si existe
        const spread = parseFloat(document.getElementById('spread')?.value) || 0;
        const rentaTNA = promedio + spread;
        
        // Actualizar renta TNA del cupón
        rentaTNAInputCupon.value = rentaTNA.toFixed(8);
        
        // Recalcular renta nominal
        calcularRentaNominal(rentaTNAInputCupon);
    }
    
    // Actualizar renta TNA global con el promedio del primer cupón (si existe)
    if (rows.length > 0) {
        const primerCupon = rows[0];
        const rentaTNACupon = primerCupon.querySelector('.renta-tna');
        if (rentaTNACupon && rentaTNACupon.value) {
            rentaTNAInput.value = rentaTNACupon.value;
        }
    }
}

// Obtener valores TAMAR desde cache o API
async function obtenerValoresTAMAR(fechaDesde, fechaHasta) {
    // Verificar cache primero
    if (cacheTAMARRango && 
        cacheTAMARRango.desde <= fechaDesde && 
        cacheTAMARRango.hasta >= fechaHasta &&
        cacheTAMAR.length > 0) {
        return cacheTAMAR.filter(item => {
            const fechaItem = item.fecha.split('T')[0];
            // Incluir solo fechas dentro del rango (>= y <= para incluir los extremos del rango ajustado)
            return fechaItem >= fechaDesde && fechaItem <= fechaHasta;
        });
    }
    
    // Si no hay cache, obtener desde API
    try {
        const response = await fetch(`/api/tamar?desde=${encodeURIComponent(fechaDesde)}&hasta=${encodeURIComponent(fechaHasta)}`);
        const result = await response.json();
        
        if (result.success && result.datos) {
            // Actualizar cache
            cacheTAMAR = result.datos;
            cacheTAMARRango = { desde: fechaDesde, hasta: fechaHasta };
            return result.datos;
        }
    } catch (error) {
        console.error('Error al obtener TAMAR:', error);
    }
    
    return [];
}

// Obtener valores BADLAR desde cache o API
async function obtenerValoresBADLAR(fechaDesde, fechaHasta) {
    // Verificar cache primero
    if (cacheBADLARRango && 
        cacheBADLARRango.desde <= fechaDesde && 
        cacheBADLARRango.hasta >= fechaHasta &&
        cacheBADLAR.length > 0) {
        return cacheBADLAR.filter(item => {
            const fechaItem = item.fecha.split('T')[0];
            // Incluir solo fechas dentro del rango (>= y <= para incluir los extremos del rango ajustado)
            return fechaItem >= fechaDesde && fechaItem <= fechaHasta;
        });
    }
    
    // Si no hay cache, obtener desde API
    try {
        const response = await fetch(`/api/badlar?desde=${encodeURIComponent(fechaDesde)}&hasta=${encodeURIComponent(fechaHasta)}`);
        const result = await response.json();
        
        if (result.success && result.datos) {
            // Actualizar cache
            cacheBADLAR = result.datos;
            cacheBADLARRango = { desde: fechaDesde, hasta: fechaHasta };
            return result.datos;
        }
    } catch (error) {
        console.error('Error al obtener BADLAR:', error);
    }
    
    return [];
}

// Abrir página TAMAR/BADLAR con filtros desde un cupón
function abrirTasaConFiltros(tipoTasa, cuponId) {
    const row = document.querySelector(`tr[data-cupon-id="${cuponId}"]`);
    if (!row) return;
    
    const fechaInicioCERInput = row.querySelector('.fecha-inicio-cer');
    const fechaFinalCERInput = row.querySelector('.fecha-final-cer');
    
    if (!fechaInicioCERInput || !fechaFinalCERInput || !fechaInicioCERInput.value || !fechaFinalCERInput.value) {
        alert('Complete las fechas de intervalo primero');
        return;
    }
    
    // Convertir fechas de DD/MM/AAAA a DD-MM-AAAA (formato usado en las páginas TAMAR/BADLAR)
    const fechaDesde = fechaInicioCERInput.value.replace(/\//g, '-');
    const fechaHasta = fechaFinalCERInput.value.replace(/\//g, '-');
    
    // Guardar las fechas en sessionStorage para que se establezcan al cargar la página
    sessionStorage.setItem(`${tipoTasa}_fechaDesde`, fechaDesde);
    sessionStorage.setItem(`${tipoTasa}_fechaHasta`, fechaHasta);
    sessionStorage.setItem(`${tipoTasa}_autoFiltrar`, 'true');
    
    // Redirigir a la página correspondiente
    const url = `/${tipoTasa}`;
    window.open(url, '_blank');
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
    
    // Verificar si fecha inicio > fecha valuación y replicar renta TNA del cupón anterior
    if (row.getAttribute('data-tipo') === 'cupon') {
        const fechaValuacionInput = document.getElementById('fechaValuacion');
        if (fechaValuacionInput && fechaValuacionInput.value) {
            const fechaValuacionStr = convertirFechaDDMMAAAAaYYYYMMDD(fechaValuacionInput.value);
            if (fechaValuacionStr) {
                const fechaValuacionDate = crearFechaDesdeString(fechaValuacionStr);
                const fechaInicioDate = crearFechaDesdeString(fechaInicio);
                
                if (fechaValuacionDate && fechaInicioDate && fechaInicioDate > fechaValuacionDate) {
                    // Buscar el cupón anterior
                    const allRows = Array.from(document.querySelectorAll('#cashflowBody tr[data-tipo="cupon"]'));
                    const currentIndex = allRows.indexOf(row);
                    
                    if (currentIndex > 0) {
                        const cuponAnterior = allRows[currentIndex - 1];
                        const rentaTNAAnterior = cuponAnterior.querySelector('.renta-tna');
                        const rentaTNAInputCupon = row.querySelector('.renta-tna');
                        
                        if (rentaTNAAnterior && rentaTNAAnterior.value && rentaTNAInputCupon) {
                            rentaTNAInputCupon.value = rentaTNAAnterior.value;
                            calcularRentaNominal(rentaTNAInputCupon);
                            recalcularFlujos(row);
                            console.log(`🔄 calcularDayCountFactor - Cupón ${currentIndex + 1}: Renta TNA replicada del cupón anterior (fecha inicio > fecha valuación)`);
                            return; // Salir temprano ya que no necesitamos recalcular renta nominal de nuevo
                        }
                    }
                }
            }
        }
    }
    
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
    // Si no hay cache, devolver array vacío
    if (!cacheFeriados || cacheFeriados.length === 0) {
        return [];
    }
    
    // Si hay cache pero no hay rango definido, devolver todos los feriados del cache
    // (esto puede pasar si el cache se cargó de otra manera)
    if (!cacheFeriadosRango) {
        console.log('⚠️ obtenerFeriadosCache - No hay rango definido, usando todos los feriados del cache');
        return cacheFeriados;
    }
    
    // Filtrar feriados que estén dentro del rango solicitado
    // Normalizar fechas para comparación
    const fechaDesdeDate = crearFechaDesdeString(fechaDesde);
    const fechaHastaDate = crearFechaDesdeString(fechaHasta);
    
    if (!fechaDesdeDate || !fechaHastaDate) {
        console.warn('⚠️ obtenerFeriadosCache - Fechas inválidas, devolviendo todos los feriados del cache');
        return cacheFeriados;
    }
    
    // Filtrar feriados dentro del rango
    const feriadosFiltrados = cacheFeriados.filter(feriado => {
        let fechaFeriado;
        
        // Si el feriado es un string, convertirlo a Date
        if (typeof feriado === 'string') {
            fechaFeriado = crearFechaDesdeString(feriado);
        } else if (feriado instanceof Date) {
            fechaFeriado = feriado;
        } else if (feriado.fecha) {
            // Si es un objeto con propiedad fecha
            fechaFeriado = crearFechaDesdeString(feriado.fecha);
        } else {
            return false;
        }
        
        if (!fechaFeriado) return false;
        
        // Normalizar hora para comparación
        fechaFeriado.setHours(12, 0, 0, 0);
        fechaDesdeDate.setHours(12, 0, 0, 0);
        fechaHastaDate.setHours(12, 0, 0, 0);
        
        return fechaFeriado >= fechaDesdeDate && fechaFeriado <= fechaHastaDate;
    });
    
    console.log(`📊 obtenerFeriadosCache - Rango solicitado: ${fechaDesde} a ${fechaHasta}, Feriados encontrados: ${feriadosFiltrados.length} de ${cacheFeriados.length}`);
    
    return feriadosFiltrados;
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
        // Calcular rango amplio (últimos 10 años para asegurar que incluya fechas antiguas)
        const hoy = new Date();
        const hace10Anos = new Date();
        hace10Anos.setFullYear(hoy.getFullYear() - 10);
        
        // Validar fechas antes de formatear
        if (isNaN(hace10Anos.getTime()) || isNaN(hoy.getTime())) {
            console.error('❌ Fechas inválidas para cargar desde BD');
            return;
        }
        
        const fechaDesdeStr = formatearFechaInput(hace10Anos);
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
                    let fechaNormalizada = null;
                    
                    // Normalizar fecha a formato YYYY-MM-DD
                    if (fecha) {
                        // Si es un objeto Date, convertirlo a string YYYY-MM-DD
                        if (fecha instanceof Date) {
                            fechaNormalizada = formatearFechaInput(fecha);
                        } else if (typeof fecha === 'string') {
                            // Si tiene T (timestamp ISO), extraer solo la fecha
                            if (fecha.includes('T')) {
                                fechaNormalizada = fecha.split('T')[0];
                            } else if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
                                // Ya está en formato YYYY-MM-DD
                                fechaNormalizada = fecha;
                            } else {
                                // Intentar convertir otros formatos (DD/MM/YYYY, etc.)
                                const fechaDate = crearFechaDesdeString(fecha);
                                if (fechaDate && !isNaN(fechaDate.getTime())) {
                                    fechaNormalizada = formatearFechaInput(fechaDate);
                                } else {
                                    // Si no se puede convertir, intentar extraer fecha de string
                                    const match = fecha.match(/(\d{4})-(\d{2})-(\d{2})/);
                                    if (match) {
                                        fechaNormalizada = match[0];
                                    } else {
                                        console.warn('⚠️ No se pudo normalizar fecha CER:', fecha);
                                        fechaNormalizada = fecha; // Fallback
                                    }
                                }
                            }
                        } else {
                            // Si es un número o otro tipo, intentar convertirlo
                            try {
                                const fechaDate = new Date(fecha);
                                if (!isNaN(fechaDate.getTime())) {
                                    fechaNormalizada = formatearFechaInput(fechaDate);
                                } else {
                                    fechaNormalizada = String(fecha);
                                }
                            } catch (e) {
                                fechaNormalizada = String(fecha);
                            }
                        }
                    }
                    
                    // Asegurar que fechaNormalizada esté en formato YYYY-MM-DD
                    if (fechaNormalizada && !/^\d{4}-\d{2}-\d{2}$/.test(fechaNormalizada)) {
                        console.warn('⚠️ Fecha normalizada no está en formato YYYY-MM-DD:', fechaNormalizada, 'de fecha original:', fecha);
                    }
                    
                    return {
                        ...cer,
                        fecha: fechaNormalizada || fecha,
                        fecha_normalizada: fechaNormalizada || fecha // Guardar también la fecha normalizada para búsqueda rápida
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
                
                // Verificar si hay CER para 2020-08-21 específicamente
                const cer20200821 = cacheCER.find(cer => 
                    cer.fecha_normalizada === '2020-08-21' || 
                    cer.fecha === '2020-08-21' ||
                    (typeof cer.fecha === 'string' && cer.fecha.includes('2020-08-21'))
                );
                if (cer20200821) {
                    console.log('✅ CER encontrado para 2020-08-21:', cer20200821);
                } else {
                    console.log('⚠️ CER NO encontrado para 2020-08-21 en cache');
                    // Buscar fechas cercanas
                    const fechasCercanas = cacheCER.filter(cer => {
                        const fecha = cer.fecha_normalizada || cer.fecha;
                        return fecha && (fecha.includes('2020-08-2') || fecha.includes('2020/08/2'));
                    }).slice(0, 5);
                    console.log('📊 Fechas cercanas a 2020-08-21:', fechasCercanas.map(cer => ({
                        fecha: cer.fecha,
                        fecha_normalizada: cer.fecha_normalizada,
                        valor: cer.valor || cer.valor_cer || cer.value
                    })));
                }
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

// Obtener el siguiente día hábil a partir de una fecha
function obtenerSiguienteDiaHabil(fecha, feriados) {
    if (!fecha) return null;
    
    // Crear una copia de la fecha para no modificar la original
    let fechaActual = new Date(fecha);
    fechaActual.setHours(12, 0, 0, 0); // Normalizar hora para evitar problemas de zona horaria
    
    // Si la fecha actual ya es hábil, retornarla
    if (esDiaHabil(fechaActual, feriados)) {
        return fechaActual;
    }
    
    // Avanzar día por día hasta encontrar un día hábil
    let iteraciones = 0;
    const maxIteraciones = 365; // Protección contra loops infinitos
    
    while (iteraciones < maxIteraciones) {
        fechaActual.setDate(fechaActual.getDate() + 1);
        iteraciones++;
        
        if (esDiaHabil(fechaActual, feriados)) {
            console.log(`✅ obtenerSiguienteDiaHabil - Fecha original: ${formatearFechaInput(fecha)}, Fecha hábil encontrada: ${formatearFechaInput(fechaActual)}`);
            return fechaActual;
        }
    }
    
    console.error('⚠️ obtenerSiguienteDiaHabil - Se alcanzó el máximo de iteraciones');
    return fechaActual; // Retornar la última fecha calculada como fallback
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
        console.warn('⚠️ calcularFechasCER - No hay feriados en cache para el rango solicitado.');
        console.warn('💡 Use el botón "Actualizar CER y Feriados" para cargar los datos.');
        console.log('📊 CacheFeriados disponible:', cacheFeriados ? cacheFeriados.length : 0, 'feriados');
        console.log('📊 CacheFeriadosRango:', cacheFeriadosRango);
    } else {
        console.log(`✅ calcularFechasCER - Usando ${feriados.length} feriados del cache para cálculos`);
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
            console.log(`🔍 calcularFechasCER - Calculando Inicio Intervalo: Fecha Inicio ${formatearFechaInput(fechaInicioDate)}, Intervalo: ${intervaloInicio}, Feriados disponibles: ${feriados.length}`);
            let fechaInicioCER = calcularFechaConDiasHabiles(fechaInicioDate, intervaloInicio, feriados);
            
            // Validar contra fecha valuación (se hará después de calcular Final Intervalo también)
            if (fechaInicioCER) {
                fechaInicioCERInput.value = convertirFechaYYYYMMDDaDDMMAAAA(formatearFechaInput(fechaInicioCER));
                console.log(`✅ calcularFechasCER - Inicio Intervalo calculado: ${formatearFechaInput(fechaInicioCER)}`);
            } else {
                console.warn(`⚠️ calcularFechasCER - No se pudo calcular Inicio Intervalo`);
            }
            
            // Fecha Final CER = Fecha Liquidación + intervaloFin días hábiles
            console.log(`🔍 calcularFechasCER - Calculando Final Intervalo: Fecha Liquidación ${formatearFechaInput(fechaLiquidacionDate)}, Intervalo: ${intervaloFin}, Feriados disponibles: ${feriados.length}`);
            let fechaFinalCER = calcularFechaConDiasHabiles(fechaLiquidacionDate, intervaloFin, feriados);
            
            // Validar contra fecha valuación
            const fechaValuacionInput = document.getElementById('fechaValuacion');
            if (fechaValuacionInput && fechaValuacionInput.value) {
                let fechaValuacionStr = fechaValuacionInput.value;
                if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaValuacionStr)) {
                    fechaValuacionStr = convertirFechaDDMMAAAAaYYYYMMDD(fechaValuacionStr);
                }
                const fechaValuacionDate = crearFechaDesdeString(fechaValuacionStr);
                
                if (fechaValuacionDate) {
                    // Validar Inicio Intervalo: si es mayor que fecha valuación, calcular como fecha valuación + intervaloInicio
                    if (fechaInicioCER && fechaInicioCER > fechaValuacionDate) {
                        console.log(`⚠️ calcularFechasCER - Inicio Intervalo (${formatearFechaInput(fechaInicioCER)}) es mayor que Fecha Valuación (${formatearFechaInput(fechaValuacionDate)}), recalculando desde fecha valuación...`);
                        fechaInicioCER = calcularFechaConDiasHabiles(fechaValuacionDate, intervaloInicio, feriados);
                        if (fechaInicioCER) {
                            fechaInicioCERInput.value = convertirFechaYYYYMMDDaDDMMAAAA(formatearFechaInput(fechaInicioCER));
                            fechaInicioCERInput.classList.add('intervalo-ajustado');
                        }
                    } else if (fechaInicioCER) {
                        fechaInicioCERInput.classList.remove('intervalo-ajustado');
                    }
                    
                    // Validar Final Intervalo: si es mayor que fecha valuación, calcular como fecha valuación + intervaloFin
                    if (fechaFinalCER && fechaFinalCER > fechaValuacionDate) {
                        console.log(`⚠️ calcularFechasCER - Final Intervalo (${formatearFechaInput(fechaFinalCER)}) es mayor que Fecha Valuación (${formatearFechaInput(fechaValuacionDate)}), recalculando desde fecha valuación...`);
                        fechaFinalCER = calcularFechaConDiasHabiles(fechaValuacionDate, intervaloFin, feriados);
                        if (fechaFinalCER) {
                            fechaFinalCERInput.value = convertirFechaYYYYMMDDaDDMMAAAA(formatearFechaInput(fechaFinalCER));
                            fechaFinalCERInput.classList.add('intervalo-ajustado');
                        }
                    } else if (fechaFinalCER) {
                        fechaFinalCERInput.classList.remove('intervalo-ajustado');
                    }
                }
            }
            
            if (fechaFinalCER) {
                fechaFinalCERInput.value = convertirFechaYYYYMMDDaDDMMAAAA(formatearFechaInput(fechaFinalCER));
                console.log(`✅ calcularFechasCER - Final Intervalo calculado: ${formatearFechaInput(fechaFinalCER)}`);
            } else {
                console.warn(`⚠️ calcularFechasCER - No se pudo calcular Final Intervalo`);
            }
            
            console.log('🔍 calcularFechasCER - Procesando fila:', {
                fechaInicio: fechaInicioInput?.value,
                fechaLiquidacion: fechaLiquidacionInput?.value,
                fechaInicioCER: fechaInicioCER ? formatearFechaInput(fechaInicioCER) : null,
                fechaFinalCER: fechaFinalCER ? formatearFechaInput(fechaFinalCER) : null
            });
            
            // En calculadora variable, no se autocompletan valores CER, solo se calculan las fechas
            // Las fechas se usan para calcular el promedio aritmético de TAMAR/BADLAR
            if (fechaInicioCER && fechaFinalCER) {
                // Recalcular promedio aritmético si la fórmula lo requiere
                const formula = document.getElementById('formula')?.value || '';
                if (formula === 'promedio-aritmetico' || formula === 'promedio-n-tasas') {
                    setTimeout(() => {
                        calcularPromedioAritmetico();
                    }, 100);
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
                console.log(`🔍 calcularFechasCER - Calculando Final Intervalo Inversión: Fecha Liquidación ${formatearFechaInput(fechaLiquidacionDate)}, Intervalo: ${intervaloFin}, Feriados disponibles: ${feriados.length}`);
                let fechaFinalIntervalo = calcularFechaConDiasHabiles(fechaLiquidacionDate, intervaloFin, feriados);
                
                // Validar contra fecha valuación
                const fechaValuacionInput = document.getElementById('fechaValuacion');
                if (fechaValuacionInput && fechaValuacionInput.value) {
                    let fechaValuacionStr = fechaValuacionInput.value;
                    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaValuacionStr)) {
                        fechaValuacionStr = convertirFechaDDMMAAAAaYYYYMMDD(fechaValuacionStr);
                    }
                    const fechaValuacionDate = crearFechaDesdeString(fechaValuacionStr);
                    
                    if (fechaValuacionDate && fechaFinalIntervalo && fechaFinalIntervalo > fechaValuacionDate) {
                        console.log(`⚠️ calcularFechasCER - Final Intervalo Inversión (${formatearFechaInput(fechaFinalIntervalo)}) es mayor que Fecha Valuación (${formatearFechaInput(fechaValuacionDate)}), recalculando desde fecha valuación...`);
                        fechaFinalIntervalo = calcularFechaConDiasHabiles(fechaValuacionDate, intervaloFin, feriados);
                        if (fechaFinalIntervalo && fechaFinalIntervaloInput) {
                            fechaFinalIntervaloInput.classList.add('intervalo-ajustado');
                        }
                    } else if (fechaFinalIntervaloInput) {
                        fechaFinalIntervaloInput.classList.remove('intervalo-ajustado');
                    }
                }
                
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

// Variable para evitar bucles infinitos en el autocompletado
let intentandoAutocompletarCEREmision = false;

// Función para calcular y mostrar coeficientes CER
function calcularCoeficientesCER() {
    console.log('🔄 calcularCoeficientesCER - Iniciando cálculo de coeficientes');
    
    // Obtener valor CER final del último cupón
    const rows = document.querySelectorAll('#cashflowBody tr[data-tipo="cupon"]');
    let valorCERFinalUltimoCupon = null;
    
    if (rows.length > 0) {
        // Obtener el último cupón (último en el DOM)
        const ultimaRow = rows[rows.length - 1];
        const fechaFinalCERInput = ultimaRow.querySelector('.fecha-final-cer');
        if (fechaFinalCERInput && fechaFinalCERInput.value) {
            // En calculadora variable, no hay valor CER final, solo fecha final
            console.log('📊 calcularCoeficientesCER - Fecha Final CER último cupón:', fechaFinalCERInput.value);
        } else {
            console.log('⚠️ calcularCoeficientesCER - No hay fecha final CER en el último cupón');
        }
    } else {
        console.log('⚠️ calcularCoeficientesCER - No hay cupones en la tabla');
    }
    
    // Calcular Coeficiente CER Emisión = Valor CER final último cupón / Valor CER emisión
    const valorCEREmisionInput = document.getElementById('valorCEREmision');
    const coeficienteCEREmisionDiv = document.getElementById('coeficienteCEREmision');
    
    console.log('🔍 calcularCoeficientesCER - Verificando valorCEREmisionInput:', {
        existe: !!valorCEREmisionInput,
        valor: valorCEREmisionInput?.value,
        tieneValor: !!(valorCEREmisionInput?.value)
    });
    
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
            if (!valorCERFinalUltimoCupon) {
                console.log('  - No hay valor CER final del último cupón');
            }
            if (!valorCEREmisionInput || !valorCEREmisionInput.value) {
                console.log('  - No hay valor CER emisión');
                // Solo intentar autocompletar si no estamos ya en proceso de autocompletar
                if (!intentandoAutocompletarCEREmision) {
                    const fechaEmisionInput = document.getElementById('fechaEmision');
                    if (fechaEmisionInput && fechaEmisionInput.value) {
                        console.log('  - Hay fechaEmision, intentando autocompletar una vez...');
                        intentandoAutocompletarCEREmision = true;
                        setTimeout(() => {
                            if (typeof window.autocompletarValorCEREmision === 'function') {
                                window.autocompletarValorCEREmision();
                                // Esperar un poco y luego recalcular (solo una vez)
                                setTimeout(() => {
                                    intentandoAutocompletarCEREmision = false;
                                    // Solo recalcular si ahora sí hay valor
                                    if (valorCEREmisionInput.value) {
                                        calcularCoeficientesCER();
                                    }
                                }, 500);
                            } else {
                                intentandoAutocompletarCEREmision = false;
                            }
                        }, 100);
                    } else {
                        console.log('  - No hay fechaEmision para autocompletar');
                    }
                } else {
                    console.log('  - Ya se está intentando autocompletar, evitando bucle infinito');
                }
            }
        }
    } else {
        if (coeficienteCEREmisionDiv) coeficienteCEREmisionDiv.textContent = '-';
        if (!valorCEREmisionInput) {
            console.warn('⚠️ calcularCoeficientesCER - No se encontró el elemento valorCEREmision');
        }
        if (!coeficienteCEREmisionDiv) {
            console.warn('⚠️ calcularCoeficientesCER - No se encontró el elemento coeficienteCEREmision');
        }
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
    
    // Recalcular amortización ajustada para esta fila
    recalcularAmortizacionAjustada(row);
    
    // Si cambió la amortización, recalcular todos los valores residuales
    if (input.classList.contains('amortizacion')) {
        // Recalcular todos los valores residuales desde el principio
        recalcularValoresResiduales();
        
        // Recalcular renta nominal para todas las filas (porque depende del valor residual)
        setTimeout(() => {
            const rows = Array.from(document.querySelectorAll('#cashflowBody tr[data-tipo="cupon"]'));
            rows.forEach(r => {
                const rentaTNAInput = r.querySelector('.renta-tna');
                if (rentaTNAInput && rentaTNAInput.value) {
                    calcularRentaNominal(rentaTNAInput);
                }
            });
        }, 50);
    }
    
    // Recalcular renta ajustada para esta fila
    recalcularRentaAjustada(row);
    
    // Recalcular flujos (importante: debe ser al final para usar los valores actualizados)
    setTimeout(() => {
        recalcularFlujos(row);
    }, 100);
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
            // Renta Ajustada = Renta Nominal × Coeficiente CER emisión
            // (El valor residual ya está incluido en la renta nominal)
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
    
    // Recalcular renta nominal y renta ajustada para todas las filas después de actualizar valores residuales
    setTimeout(() => {
        rows.forEach(r => {
            // Recalcular amortización ajustada
            recalcularAmortizacionAjustada(r);
            
            // Recalcular renta nominal (depende del valor residual)
            const rentaTNAInput = r.querySelector('.renta-tna');
            if (rentaTNAInput && rentaTNAInput.value) {
                calcularRentaNominal(rentaTNAInput);
            }
            
            // Recalcular renta ajustada
            recalcularRentaAjustada(r);
        });
    }, 50);
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
        // Recalcular renta ajustada para todas las filas afectadas
        rows.forEach(r => {
            setTimeout(() => {
                recalcularRentaAjustada(r);
            }, 10);
        });
    } else if (input.classList.contains('valor-residual')) {
        // Si cambió el valor residual manualmente, recalcular renta nominal para esta fila
        const rentaTNAInput = row.querySelector('.renta-tna');
        if (rentaTNAInput && rentaTNAInput.value) {
            setTimeout(() => {
                calcularRentaNominal(rentaTNAInput);
            }, 10);
        }
        
        // Recalcular renta ajustada para esta fila
        setTimeout(() => {
            recalcularRentaAjustada(row);
        }, 10);
        
        // Recalcular solo los siguientes
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
                
                // Recalcular renta nominal para la fila actualizada
                const rentaTNAInputActual = rowActual.querySelector('.renta-tna');
                if (rentaTNAInputActual && rentaTNAInputActual.value) {
                    setTimeout(() => {
                        calcularRentaNominal(rentaTNAInputActual);
                    }, 10);
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
    
    // Solo loguear si hay un problema o es la primera vez
    const DEBUG_FLUJOS = false; // Cambiar a true para debug detallado
    
    if (DEBUG_FLUJOS) {
        console.log('🔄 recalcularFlujos - Tipo:', tipo, 'Cantidad:', cantidadPartida, 'Precio:', precioCompra);
    }
    
    if (tipo === 'inversion') {
        // Flujos inversión: -(Precio compra × Cantidad partida) (negativo)
        if (cantidadPartida > 0 && precioCompra > 0) {
            const flujos = -(precioCompra * cantidadPartida); // Negativo
            const valorTruncado = window.truncarDecimal ? window.truncarDecimal(flujos, 12) : parseFloat(flujos.toFixed(12));
            flujosInput.value = valorTruncado;
            if (DEBUG_FLUJOS) {
                console.log('✅ recalcularFlujos - Flujo inversión calculado:', valorTruncado);
            }
        } else {
            flujosInput.value = '';
            console.warn('⚠️ recalcularFlujos - Faltan datos para calcular flujo inversión');
        }
    } else if (tipo === 'cupon') {
        // Flujos cupones: Cantidad partida × (Renta nominal / 100 + Amortización / 100)
        const rentaNominal = parseFloat(row.querySelector('.renta-nominal')?.value) || 0;
        const amortizacion = parseFloat(row.querySelector('.amortizacion')?.value) || 0;
        
        const flujos = cantidadPartida * (rentaNominal / 100 + amortizacion / 100);
        const valorTruncado = window.truncarDecimal ? window.truncarDecimal(flujos, 12) : parseFloat(flujos.toFixed(12));
        flujosInput.value = valorTruncado;
    }
    
    // Actualizar flujos descontados y sumatoria si hay una TIR calculada
    if (ultimaTIRCalculada !== null) {
        setTimeout(() => {
            actualizarFlujosDescontadosYSumatoria();
        }, 10);
    }
    
    // Recalcular factor actualización y pagos actualizados
    if (tipo === 'cupon') {
        setTimeout(() => {
            recalcularFactorActualizacion(row);
            recalcularPagosActualizados(row);
        }, 10);
    }
}

// Función para recalcular todos los flujos
function recalcularTodosFlujos() {
    const DEBUG_FLUJOS = false; // Cambiar a true para debug detallado
    if (DEBUG_FLUJOS) {
        console.log('🔄 recalcularTodosFlujos - Recalculando todos los flujos');
    }
    
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
    
    // Actualizar flujos descontados y sumatoria si hay una TIR calculada
    if (ultimaTIRCalculada !== null) {
        actualizarFlujosDescontadosYSumatoria();
    }
    
    // Recalcular factor actualización y pagos actualizados para todos los cupones
    rows.forEach(row => {
        recalcularFactorActualizacion(row);
        recalcularPagosActualizados(row);
    });
}

// Función para actualizar flujos descontados y sumatoria usando la última TIR calculada
function actualizarFlujosDescontadosYSumatoria() {
    if (ultimaTIRCalculada === null) {
        console.log('⚠️ actualizarFlujosDescontadosYSumatoria - No hay TIR calculada');
        return;
    }
    
    console.log('🔄 actualizarFlujosDescontadosYSumatoria - Actualizando con TIR:', (ultimaTIRCalculada * 100).toFixed(8) + '%');
    
    const fechaCompraInput = document.getElementById('fechaCompra');
    const fechaCompra = fechaCompraInput?.value;
    
    if (!fechaCompra) {
        console.log('⚠️ actualizarFlujosDescontadosYSumatoria - No hay fecha de compra');
        return;
    }
    
    // Obtener tipoInteresDias (base) para los cálculos
    const tipoInteresDias = parseInt(document.getElementById('tipoInteresDias')?.value) || 0;
    
    // Convertir fecha de compra a YYYY-MM-DD si está en DD/MM/AAAA
    let fechaCompraYYYYMMDD = fechaCompra;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaCompra)) {
        fechaCompraYYYYMMDD = convertirFechaDDMMAAAAaYYYYMMDD(fechaCompra);
    }
    
    const cashflowRows = document.querySelectorAll('#cashflowBody tr');
    let sumatoria = 0;
    
    cashflowRows.forEach((row) => {
        const tipo = row.getAttribute('data-tipo');
        if (!tipo) return;
        
        // Obtener flujo
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
            const flujo = Number(flujosInput.value) || 0;
            let fechaLiq = fechaLiqInput.value;
            
            // Convertir fecha a YYYY-MM-DD si está en DD/MM/AAAA
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaLiq)) {
                fechaLiq = convertirFechaDDMMAAAAaYYYYMMDD(fechaLiq);
            }
            
            // Obtener input de flujo descontado
            let flujosDescFechaCompraInput;
            if (tipo === 'inversion') {
                flujosDescFechaCompraInput = document.getElementById('flujosDescFechaCompra');
            } else {
                flujosDescFechaCompraInput = row.querySelector('.flujos-desc-fecha-compra');
            }
            
            if (flujosDescFechaCompraInput) {
                const fraccionAnio = calcularFraccionAnio(fechaCompraYYYYMMDD, fechaLiq, tipoInteresDias);
                
                if (fraccionAnio > 0) {
                    const flujoDescontado = flujo / Math.pow(1 + ultimaTIRCalculada, fraccionAnio);
                    const valorTruncado = window.truncarDecimal ? window.truncarDecimal(flujoDescontado, 12) : parseFloat(flujoDescontado.toFixed(12));
                    flujosDescFechaCompraInput.value = valorTruncado;
                    sumatoria += valorTruncado;
                } else {
                    flujosDescFechaCompraInput.value = flujo;
                    sumatoria += flujo;
                }
            }
        }
    });
    
    // Actualizar sumatoria en el footer
    const sumatoriaFlujosDesc = document.getElementById('sumatoriaFlujosDesc');
    const cashflowFooter = document.getElementById('cashflowFooter');
    if (sumatoriaFlujosDesc) {
        const sumatoriaMostrar = window.truncarDecimal ? window.truncarDecimal(sumatoria, 8) : parseFloat(sumatoria.toFixed(8));
        sumatoriaFlujosDesc.textContent = sumatoriaMostrar.toFixed(8);
    }
    if (cashflowFooter) {
        cashflowFooter.style.display = 'table-footer-group';
    }
    
    console.log('✅ actualizarFlujosDescontadosYSumatoria - Sumatoria actualizada:', sumatoria.toFixed(8));
    
        // Recalcular factor actualización y pagos actualizados para todos los cupones
        const cashflowRowsCupones = document.querySelectorAll('#cashflowBody tr[data-tipo="cupon"]');
        cashflowRowsCupones.forEach(row => {
            recalcularFactorActualizacion(row);
            recalcularPagosActualizados(row);
        });
        
        // Recalcular sumatoria de pagos actualizados y todos los precios después de calcular TIR
        setTimeout(() => {
            calcularSumatoriaPagosActualizados();
            recalcularTodosPrecios();
        }, 100);
    }

// Función para recalcular factor actualización
function recalcularFactorActualizacion(row) {
    if (!row || row.getAttribute('data-tipo') !== 'cupon') return;
    
    const factorActualizacionInput = row.querySelector('.factor-actualizacion');
    if (!factorActualizacionInput) return;
    
    // Verificar que haya TIR calculada
    if (ultimaTIRCalculada === null) {
        factorActualizacionInput.value = '';
        return;
    }
    
    // Obtener fecha liquidación del cupón
    const fechaLiquidacionInput = row.querySelector('.fecha-liquidacion');
    if (!fechaLiquidacionInput || !fechaLiquidacionInput.value) {
        factorActualizacionInput.value = '';
        return;
    }
    
    // Obtener fecha valuación
    const fechaValuacionInput = document.getElementById('fechaValuacion');
    if (!fechaValuacionInput || !fechaValuacionInput.value) {
        factorActualizacionInput.value = '';
        return;
    }
    
    // Convertir fechas a formato YYYY-MM-DD
    let fechaLiquidacionStr = fechaLiquidacionInput.value;
    let fechaValuacionStr = fechaValuacionInput.value;
    
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaLiquidacionStr)) {
        fechaLiquidacionStr = convertirFechaDDMMAAAAaYYYYMMDD(fechaLiquidacionStr);
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaValuacionStr)) {
        fechaValuacionStr = convertirFechaDDMMAAAAaYYYYMMDD(fechaValuacionStr);
    }
    
    // Validar que las fechas sean válidas
    if (!fechaLiquidacionStr || !fechaValuacionStr) {
        factorActualizacionInput.value = '';
        return;
    }
    
    // Verificar que fecha liquidación < fecha valuación
    const fechaLiquidacionDate = new Date(fechaLiquidacionStr);
    const fechaValuacionDate = new Date(fechaValuacionStr);
    
    if (fechaLiquidacionDate >= fechaValuacionDate) {
        // Si fecha liquidación >= fecha valuación, dejar en null
        factorActualizacionInput.value = '';
        return;
    }
    
    // Obtener tipoInteresDias (base) para calcular fracción de año
    const tipoInteresDias = parseInt(document.getElementById('tipoInteresDias')?.value) || 0;
    
    // Calcular fracción de año entre fecha liquidación y fecha valuación
    // Pasar los strings directamente, calcularFraccionAnio los convertirá internamente
    const fraccionAnio = calcularFraccionAnio(fechaLiquidacionStr, fechaValuacionStr, tipoInteresDias);
    
    // Calcular factor actualización: (1 + TIR) ^ fracción año
    const factorActualizacion = Math.pow(1 + ultimaTIRCalculada, fraccionAnio);
    const valorTruncado = window.truncarDecimal ? window.truncarDecimal(factorActualizacion, 12) : parseFloat(factorActualizacion.toFixed(12));
    factorActualizacionInput.value = valorTruncado;
}

// Función para recalcular pagos actualizados
function recalcularPagosActualizados(row) {
    if (!row || row.getAttribute('data-tipo') !== 'cupon') return;
    
    const pagosActualizadosInput = row.querySelector('.pagos-actualizados');
    if (!pagosActualizadosInput) return;
    
    // Verificar que fecha liquidación < fecha valuación
    const fechaLiquidacionInput = row.querySelector('.fecha-liquidacion');
    const fechaValuacionInput = document.getElementById('fechaValuacion');
    
    if (!fechaLiquidacionInput || !fechaLiquidacionInput.value || !fechaValuacionInput || !fechaValuacionInput.value) {
        pagosActualizadosInput.value = '';
        return;
    }
    
    // Convertir fechas a formato YYYY-MM-DD
    let fechaLiquidacionStr = fechaLiquidacionInput.value;
    let fechaValuacionStr = fechaValuacionInput.value;
    
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaLiquidacionStr)) {
        fechaLiquidacionStr = convertirFechaDDMMAAAAaYYYYMMDD(fechaLiquidacionStr);
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaValuacionStr)) {
        fechaValuacionStr = convertirFechaDDMMAAAAaYYYYMMDD(fechaValuacionStr);
    }
    
    // Verificar que fecha liquidación < fecha valuación
    const fechaLiquidacionDate = new Date(fechaLiquidacionStr);
    const fechaValuacionDate = new Date(fechaValuacionStr);
    
    if (fechaLiquidacionDate >= fechaValuacionDate) {
        // Si fecha liquidación >= fecha valuación, dejar en null
        pagosActualizadosInput.value = '';
        return;
    }
    
    // Obtener factor actualización
    const factorActualizacionInput = row.querySelector('.factor-actualizacion');
    const factorActualizacion = parseFloat(factorActualizacionInput?.value) || 0;
    
    // Obtener flujo del cupón
    const flujosInput = row.querySelector('.flujos');
    const flujoCupon = parseFloat(flujosInput?.value) || 0;
    
    // Obtener cantidad partida
    const cantidadPartida = parseFloat(document.getElementById('cantidadPartida')?.value) || 0;
    
    if (factorActualizacion > 0 && flujoCupon !== 0 && cantidadPartida > 0) {
        // Pagos Actualizados = Factor Actualización × Flujo cupón / Cantidad partida
        const pagosActualizados = (factorActualizacion * flujoCupon) / cantidadPartida;
        const valorTruncado = window.truncarDecimal ? window.truncarDecimal(pagosActualizados, 12) : parseFloat(pagosActualizados.toFixed(12));
        pagosActualizadosInput.value = valorTruncado;
        
        // Actualizar sumatoria de pagos actualizados
        calcularSumatoriaPagosActualizados();
    } else {
        pagosActualizadosInput.value = '';
        // Actualizar sumatoria de pagos actualizados
        calcularSumatoriaPagosActualizados();
    }
}

// Función para calcular sumatoria de pagos actualizados
function calcularSumatoriaPagosActualizados() {
    const rows = document.querySelectorAll('#cashflowBody tr[data-tipo="cupon"]');
    let sumatoria = 0;
    
    rows.forEach(row => {
        const pagosActualizadosInput = row.querySelector('.pagos-actualizados');
        if (pagosActualizadosInput && pagosActualizadosInput.value) {
            const valor = parseFloat(pagosActualizadosInput.value) || 0;
            sumatoria += valor;
        }
    });
    
    const pagosEfectActualizadosDiv = document.getElementById('pagosEfectActualizados');
    if (pagosEfectActualizadosDiv) {
        const valorTruncado = window.truncarDecimal ? window.truncarDecimal(sumatoria, 12) : parseFloat(sumatoria.toFixed(12));
        pagosEfectActualizadosDiv.textContent = valorTruncado.toFixed(8);
    }
}

// Función para calcular Precio C+T
function calcularPrecioCT() {
    const precioCompraInput = document.getElementById('precioCompra');
    const fechaCompraInput = document.getElementById('fechaCompra');
    const fechaValuacionInput = document.getElementById('fechaValuacion');
    const tipoInteresDiasInput = document.getElementById('tipoInteresDias');
    
    if (!precioCompraInput || !precioCompraInput.value || 
        !fechaCompraInput || !fechaCompraInput.value ||
        !fechaValuacionInput || !fechaValuacionInput.value ||
        ultimaTIRCalculada === null) {
        const precioCTDiv = document.getElementById('precioCT');
        if (precioCTDiv) precioCTDiv.textContent = '-';
        return;
    }
    
    const precioCompra = parseFloat(convertirNumeroDecimal(precioCompraInput.value)) || 0;
    
    // Convertir fechas a formato YYYY-MM-DD
    let fechaCompraStr = fechaCompraInput.value;
    let fechaValuacionStr = fechaValuacionInput.value;
    
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaCompraStr)) {
        fechaCompraStr = convertirFechaDDMMAAAAaYYYYMMDD(fechaCompraStr);
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaValuacionStr)) {
        fechaValuacionStr = convertirFechaDDMMAAAAaYYYYMMDD(fechaValuacionStr);
    }
    
    if (!fechaCompraStr || !fechaValuacionStr) {
        const precioCTDiv = document.getElementById('precioCT');
        if (precioCTDiv) precioCTDiv.textContent = '-';
        return;
    }
    
    const tipoInteresDias = parseInt(tipoInteresDiasInput?.value) || 0;
    
    // Calcular fracción de año entre fecha compra y fecha valuación
    const fraccionAnio = calcularFraccionAnio(fechaCompraStr, fechaValuacionStr, tipoInteresDias);
    
    // Precio C+T = precioCompra × (1 + TIR) ^ fracción año
    const precioCT = precioCompra * Math.pow(1 + ultimaTIRCalculada, fraccionAnio);
    const valorTruncado = window.truncarDecimal ? window.truncarDecimal(precioCT, 12) : parseFloat(precioCT.toFixed(12));
    
    const precioCTDiv = document.getElementById('precioCT');
    if (precioCTDiv) {
        precioCTDiv.textContent = valorTruncado.toFixed(8);
    }
}

// Función para calcular Precio C+T Ajustado
function calcularPrecioCTAjustado() {
    const precioCTDiv = document.getElementById('precioCT');
    const valorCERValuacionInput = document.getElementById('valorCERValuacion');
    const valorCERFinalInput = document.getElementById('valorCERFinal');
    
    if (!precioCTDiv || precioCTDiv.textContent === '-' || !valorCERValuacionInput || !valorCERFinalInput) {
        const precioCTHoyAjustadoDiv = document.getElementById('precioCTHoyAjustado');
        if (precioCTHoyAjustadoDiv) precioCTHoyAjustadoDiv.textContent = '-';
        return;
    }
    
    const precioCT = parseFloat(precioCTDiv.textContent) || 0;
    const valorCERValuacion = parseFloat(valorCERValuacionInput.value) || 0;
    const valorCERFinal = parseFloat(valorCERFinalInput.value) || 0;
    
    if (valorCERFinal === 0) {
        const precioCTHoyAjustadoDiv = document.getElementById('precioCTHoyAjustado');
        if (precioCTHoyAjustadoDiv) precioCTHoyAjustadoDiv.textContent = '-';
        return;
    }
    
    // Precio C+T Ajustado = Precio C+T × valorCERValuacion / valorCERFinal
    const precioCTAjustado = precioCT * (valorCERValuacion / valorCERFinal);
    const valorTruncado = window.truncarDecimal ? window.truncarDecimal(precioCTAjustado, 12) : parseFloat(precioCTAjustado.toFixed(12));
    
    const precioCTHoyAjustadoDiv = document.getElementById('precioCTHoyAjustado');
    if (precioCTHoyAjustadoDiv) {
        precioCTHoyAjustadoDiv.textContent = valorTruncado.toFixed(8);
    }
}

// Función para calcular Precio Ajustado - Pagos
function calcularPrecioAjustadoPagos() {
    const precioCTHoyAjustadoDiv = document.getElementById('precioCTHoyAjustado');
    const pagosEfectActualizadosDiv = document.getElementById('pagosEfectActualizados');
    
    if (!precioCTHoyAjustadoDiv || precioCTHoyAjustadoDiv.textContent === '-' ||
        !pagosEfectActualizadosDiv || pagosEfectActualizadosDiv.textContent === '-') {
        const precioCTAjustPagosDiv = document.getElementById('precioCTAjustPagos');
        if (precioCTAjustPagosDiv) precioCTAjustPagosDiv.textContent = '-';
        return;
    }
    
    const precioCTAjustado = parseFloat(precioCTHoyAjustadoDiv.textContent) || 0;
    const pagosEfectActualizados = parseFloat(pagosEfectActualizadosDiv.textContent) || 0;
    
    // Precio Ajustado - Pagos = Precio C+T Ajustado - Pagos Efect. Actualizados
    const precioAjustadoPagos = precioCTAjustado - pagosEfectActualizados;
    const valorTruncado = window.truncarDecimal ? window.truncarDecimal(precioAjustadoPagos, 12) : parseFloat(precioAjustadoPagos.toFixed(12));
    
    const precioCTAjustPagosDiv = document.getElementById('precioCTAjustPagos');
    if (precioCTAjustPagosDiv) {
        precioCTAjustPagosDiv.textContent = valorTruncado.toFixed(8);
    }
}

// Función para calcular Precio Técnico Vencimiento
function calcularPrecioTecnicoVencimiento() {
    const fechaValuacionInput = document.getElementById('fechaValuacion');
    const precioTecnicoVencimientoDiv = document.getElementById('precioTecnicoVencimiento');
    
    if (!fechaValuacionInput || !fechaValuacionInput.value) {
        if (precioTecnicoVencimientoDiv) precioTecnicoVencimientoDiv.textContent = '-';
        return;
    }
    
    // Obtener último cupón
    const rows = Array.from(document.querySelectorAll('#cashflowBody tr[data-tipo="cupon"]'));
    if (rows.length === 0) {
        if (precioTecnicoVencimientoDiv) precioTecnicoVencimientoDiv.textContent = '-';
        return;
    }
    
    const ultimaRow = rows[rows.length - 1];
    const fechaLiquidacionInput = ultimaRow.querySelector('.fecha-liquidacion');
    
    if (!fechaLiquidacionInput || !fechaLiquidacionInput.value) {
        if (precioTecnicoVencimientoDiv) precioTecnicoVencimientoDiv.textContent = '-';
        return;
    }
    
    // Convertir fechas a formato YYYY-MM-DD
    let fechaValuacionStr = fechaValuacionInput.value;
    let fechaLiquidacionStr = fechaLiquidacionInput.value;
    
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaValuacionStr)) {
        fechaValuacionStr = convertirFechaDDMMAAAAaYYYYMMDD(fechaValuacionStr);
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaLiquidacionStr)) {
        fechaLiquidacionStr = convertirFechaDDMMAAAAaYYYYMMDD(fechaLiquidacionStr);
    }
    
    // Normalizar fechas para comparación (solo fecha, sin hora)
    const fechaValuacionDate = new Date(fechaValuacionStr);
    const fechaLiquidacionDate = new Date(fechaLiquidacionStr);
    
    fechaValuacionDate.setHours(0, 0, 0, 0);
    fechaLiquidacionDate.setHours(0, 0, 0, 0);
    
    // Solo mostrar si fecha valuación = fecha liquidación último cupón
    if (fechaValuacionDate.getTime() !== fechaLiquidacionDate.getTime()) {
        if (precioTecnicoVencimientoDiv) precioTecnicoVencimientoDiv.textContent = '-';
        return;
    }
    
    // Calcular: renta nominal / 100 + amortización / 100
    const rentaNominalInput = ultimaRow.querySelector('.renta-nominal');
    const amortizacionInput = ultimaRow.querySelector('.amortizacion');
    
    const rentaNominal = parseFloat(rentaNominalInput?.value) || 0;
    const amortizacion = parseFloat(amortizacionInput?.value) || 0;
    
    const precioTecnicoVenc = (rentaNominal / 100) + (amortizacion / 100);
    const valorTruncado = window.truncarDecimal ? window.truncarDecimal(precioTecnicoVenc, 12) : parseFloat(precioTecnicoVenc.toFixed(12));
    
    if (precioTecnicoVencimientoDiv) {
        precioTecnicoVencimientoDiv.textContent = valorTruncado.toFixed(8);
    }
}

// Función para recalcular todos los precios
function recalcularTodosPrecios() {
    calcularPrecioCT();
    calcularPrecioCTAjustado();
    calcularSumatoriaPagosActualizados();
    calcularPrecioAjustadoPagos();
    calcularPrecioTecnicoVencimiento();
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
        // Si está en formato DD/MM/AAAA, convertir a YYYY-MM-DD
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
            fechaNormalizada = convertirFechaDDMMAAAAaYYYYMMDD(fecha);
        } else {
            fechaNormalizada = fecha.includes('T') ? fecha.split('T')[0] : fecha;
        }
    } else if (fecha instanceof Date) {
        fechaNormalizada = formatearFechaInput(fecha);
    }
    
    console.log('🔍 obtenerValorCER - Fecha normalizada a buscar:', fechaNormalizada);
    
    // Mostrar algunas fechas del cache para debug (solo si no se encuentra)
    const debugFechas = cacheCER.filter(cer => {
        const cerFecha = cer.fecha_normalizada || cer.fecha || cer.date || cer.fecha_cer;
        if (!cerFecha) return false;
        const cerFechaStr = typeof cerFecha === 'string' ? (cerFecha.includes('T') ? cerFecha.split('T')[0] : cerFecha) : formatearFechaInput(cerFecha);
        return cerFechaStr.includes('2020-08-2') || cerFechaStr.includes('2020/08/2');
    }).slice(0, 5);
    if (debugFechas.length > 0) {
        console.log('📊 Fechas cercanas en cache (agosto 2020):', debugFechas.map(cer => ({
            fecha: cer.fecha,
            fecha_normalizada: cer.fecha_normalizada,
            valor: cer.valor || cer.valor_cer || cer.value
        })));
    }
    
    // Buscar el CER con múltiples estrategias
    const cerEncontrado = cacheCER.find(cer => {
        // Estrategia 1: Usar fecha_normalizada si existe
        if (cer.fecha_normalizada) {
            const coincide = cer.fecha_normalizada === fechaNormalizada;
            if (coincide) {
                console.log('✅ obtenerValorCER - Coincidencia encontrada (normalizada):', cer.fecha_normalizada, '===', fechaNormalizada);
            }
            return coincide;
        }
        
        // Estrategia 2: Normalizar fecha desde cualquier campo disponible
        let cerFecha = cer.fecha || cer.date || cer.fecha_cer;
        if (cerFecha) {
            let cerFechaNormalizada = null;
            
            // Si es un objeto Date, convertirlo a string YYYY-MM-DD
            if (cerFecha instanceof Date) {
                cerFechaNormalizada = formatearFechaInput(cerFecha);
            } else if (typeof cerFecha === 'string') {
                // Si tiene T (timestamp), extraer solo la fecha
                if (cerFecha.includes('T')) {
                    cerFechaNormalizada = cerFecha.split('T')[0];
                } else if (/^\d{4}-\d{2}-\d{2}$/.test(cerFecha)) {
                    // Ya está en formato YYYY-MM-DD
                    cerFechaNormalizada = cerFecha;
                } else {
                    // Intentar convertir otros formatos
                    const fechaDate = crearFechaDesdeString(cerFecha);
                    if (fechaDate) {
                        cerFechaNormalizada = formatearFechaInput(fechaDate);
                    }
                }
            }
            
            // Comparar fechas normalizadas
            if (cerFechaNormalizada && cerFechaNormalizada === fechaNormalizada) {
                console.log('✅ obtenerValorCER - Coincidencia encontrada:', cerFecha, '→', cerFechaNormalizada, '===', fechaNormalizada);
                return true;
            }
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
        // Usar fecha_normalizada si existe, sino normalizar fecha
        let cerFechaStr = cer.fecha_normalizada || cer.fecha || cer.date || cer.fecha_cer;
        // Normalizar formato de fecha
        if (cerFechaStr) {
            // Si es un objeto Date, convertirlo a string YYYY-MM-DD
            if (cerFechaStr instanceof Date) {
                cerFechaStr = formatearFechaInput(cerFechaStr);
            } else if (typeof cerFechaStr === 'string') {
                // Si tiene T (timestamp), extraer solo la fecha
                if (cerFechaStr.includes('T')) {
                    cerFechaStr = cerFechaStr.split('T')[0];
                }
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
    
    // Mostrar información de debug sobre el cache
    console.warn('⚠️ obtenerValorCER - No se encontró CER para fecha:', fecha);
    console.log('🔍 obtenerValorCER - Debug del cache:');
    console.log('  - Total de CERs en cache:', cacheCER.length);
    console.log('  - Fecha buscada (normalizada):', fechaNormalizada);
    
    // Buscar fechas cercanas a la buscada (especialmente alrededor de 2020-08-21)
    const fechaBuscada = crearFechaDesdeString(fecha);
    if (fechaBuscada && cacheCER.length > 0) {
        // Buscar específicamente fechas de agosto 2020
        const fechasAgosto2020 = cacheCER
            .map(cer => {
                let cerFechaStr = cer.fecha_normalizada || cer.fecha || cer.date || cer.fecha_cer;
                let cerFechaNormalizada = cerFechaStr;
                
                // Normalizar la fecha del cache
                if (cerFechaStr instanceof Date) {
                    cerFechaNormalizada = formatearFechaInput(cerFechaStr);
                } else if (typeof cerFechaStr === 'string') {
                    if (cerFechaStr.includes('T')) {
                        cerFechaNormalizada = cerFechaStr.split('T')[0];
                    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(cerFechaStr)) {
                        const fechaDate = crearFechaDesdeString(cerFechaStr);
                        if (fechaDate) {
                            cerFechaNormalizada = formatearFechaInput(fechaDate);
                        }
                    }
                }
                
                const cerFecha = crearFechaDesdeString(cerFechaNormalizada);
                if (cerFecha) {
                    const diffDias = Math.abs(Math.floor((fechaBuscada - cerFecha) / (1000 * 60 * 60 * 24)));
                    return { 
                        fecha_original: cerFechaStr,
                        fecha_normalizada: cerFechaNormalizada,
                        valor: cer.valor || cer.valor_cer || cer.value,
                        diffDias 
                    };
                }
                return null;
            })
            .filter(f => f !== null)
            .sort((a, b) => a.diffDias - b.diffDias)
            .slice(0, 10);
        
        console.log('  - Fechas más cercanas en cache (primeras 10):', fechasAgosto2020);
        
        // Buscar específicamente 2020-08-21 en todas sus posibles formas
        const cer20200821 = cacheCER.find(cer => {
            const fecha = cer.fecha_normalizada || cer.fecha || cer.date || cer.fecha_cer;
            if (!fecha) return false;
            const fechaStr = typeof fecha === 'string' ? fecha : formatearFechaInput(fecha);
            return fechaStr.includes('2020-08-21') || fechaStr.includes('2020/08/21') || fechaStr === '2020-08-21';
        });
        if (cer20200821) {
            console.log('  - ⚠️ CER encontrado para 2020-08-21 pero no coincide:', {
                fecha: cer20200821.fecha,
                fecha_normalizada: cer20200821.fecha_normalizada,
                valor: cer20200821.valor || cer20200821.valor_cer || cer20200821.value
            });
        }
    }
    
    return null;
}

// Función para calcular renta nominal automáticamente
function calcularRentaNominal(input) {
    const row = input.closest('tr');
    if (!row) return;
    
    // Convertir valor de renta TNA (puede tener "," o ".")
    const valorConvertido = convertirNumeroDecimal(input.value);
    const rentaTNA = parseFloat(valorConvertido) || 0;
    
    // Actualizar el input con el valor convertido (usando ".")
    if (input.value && input.value !== valorConvertido) {
        input.value = valorConvertido;
    }
    
    const dayCountFactorInput = row.querySelector('.day-count-factor');
    const dayCountFactor = parseFloat(dayCountFactorInput?.value) || 0;
    const valorResidualInput = row.querySelector('.valor-residual');
    const valorResidual = parseFloat(valorResidualInput?.value) || 100; // Por defecto 100 si no hay valor
    
    const rentaNominalInput = row.querySelector('.renta-nominal');
    if (rentaNominalInput) {
        // Renta Nominal = Renta TNA × Day Count Factor × (Valor Residual / 100)
        const rentaNominal = rentaTNA * dayCountFactor * (valorResidual / 100);
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
        // La fecha de inicio del primer cupón intermedio es la fecha de liquidación del cupón anterior (fechaPrimeraRenta)
        let fechaInicioActual = crearFechaDesdeString(fechaPrimeraRenta);
        let fechaLiquidacionActual = agregarMeses(fechaInicioActual, mesesPeriodo);
        
        // Generar cupones mientras no superemos la fecha de amortización
        while (fechaLiquidacionActual < fechaAmortizacionDate) {
            todosLosCupones.push({
                fechaInicio: new Date(fechaInicioActual),
                fechaLiquidacion: new Date(fechaLiquidacionActual)
            });
            
            // Avanzar al siguiente período: fecha inicio = fecha liquidación del cupón anterior
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
            const indicePrimerCupon = todosLosCupones.findIndex(cupon => cupon.fechaLiquidacion >= fechaCompraDate);
            
            if (indicePrimerCupon === -1) {
                showError('No hay cupones vigentes después de la fecha de compra');
                return;
            }
            
            cuponesAFiltrar = todosLosCupones.slice(indicePrimerCupon);
            
            // Si hay un cupón anterior (que no se muestra), ajustar la fecha de inicio del primer cupón mostrado
            // La fecha de inicio debe ser la fecha de liquidación del cupón anterior
            if (indicePrimerCupon > 0 && cuponesAFiltrar.length > 0) {
                const cuponAnterior = todosLosCupones[indicePrimerCupon - 1];
                cuponesAFiltrar[0].fechaInicio = new Date(cuponAnterior.fechaLiquidacion);
            }
        }
        
        // Validar y ajustar fechas de liquidación para que sean días hábiles
        console.log('🔄 autocompletarCupones - Validando fechas de liquidación...');
        
        // Verificar que cacheFeriados esté disponible
        if (!cacheFeriados || cacheFeriados.length === 0) {
            console.warn('⚠️ autocompletarCupones - cacheFeriados no está disponible, no se puede validar días hábiles');
            console.log('💡 autocompletarCupones - Se recomienda cargar feriados antes de autocompletar cupones');
        } else {
            // Primero ajustar todas las fechas de liquidación
            cuponesAFiltrar.forEach((cupon, index) => {
                const fechaLiquidacionOriginal = new Date(cupon.fechaLiquidacion);
                
                // Verificar si la fecha de liquidación es día hábil
                if (!esDiaHabil(fechaLiquidacionOriginal, cacheFeriados)) {
                    console.log(`⚠️ autocompletarCupones - Cupón ${index + 1}: Fecha liquidación ${formatearFechaInput(fechaLiquidacionOriginal)} no es día hábil`);
                    
                    // Obtener el siguiente día hábil
                    const siguienteDiaHabil = obtenerSiguienteDiaHabil(fechaLiquidacionOriginal, cacheFeriados);
                    
                    if (siguienteDiaHabil) {
                        cupon.fechaLiquidacion = siguienteDiaHabil;
                        console.log(`✅ autocompletarCupones - Cupón ${index + 1}: Fecha ajustada a ${formatearFechaInput(siguienteDiaHabil)}`);
                    } else {
                        console.warn(`⚠️ autocompletarCupones - No se pudo encontrar día hábil para cupón ${index + 1}`);
                    }
                } else {
                    console.log(`✅ autocompletarCupones - Cupón ${index + 1}: Fecha liquidación ${formatearFechaInput(fechaLiquidacionOriginal)} es día hábil`);
                }
            });
            
            // Después de ajustar todas las fechas de liquidación, actualizar las fechas de inicio
            // La fecha de inicio de cada cupón debe ser la fecha de liquidación del cupón anterior
            for (let i = 1; i < cuponesAFiltrar.length; i++) {
                const cuponAnterior = cuponesAFiltrar[i - 1];
                const cuponActual = cuponesAFiltrar[i];
                
                // Actualizar fecha de inicio con la fecha de liquidación ajustada del cupón anterior
                cuponActual.fechaInicio = new Date(cuponAnterior.fechaLiquidacion);
                console.log(`🔄 autocompletarCupones - Cupón ${i + 1}: Fecha inicio actualizada a ${formatearFechaInput(cuponActual.fechaInicio)} (fecha liquidación cupón anterior)`);
            }
        }
        
        // Crear filas en la tabla para los cupones filtrados
        cuponesAFiltrar.forEach((cupon, indexFiltrado) => {
            cuponCount++;
            
            // Calcular el número de cupón real (basado en la posición en todosLosCupones)
            const indiceEnTodos = todosLosCupones.findIndex(c => 
                c.fechaInicio.getTime() === cupon.fechaInicio.getTime() && 
                c.fechaLiquidacion.getTime() === cupon.fechaLiquidacion.getTime()
            );
            const numeroCupon = indiceEnTodos >= 0 ? indiceEnTodos + 1 : indexFiltrado + 1;
            
            const row = document.createElement('tr');
            row.setAttribute('data-cupon-id', cuponCount);
            row.setAttribute('data-tipo', 'cupon');
            
            const fechaInicioStr = formatearFechaInput(cupon.fechaInicio);
            const fechaLiquidacionStr = formatearFechaInput(cupon.fechaLiquidacion);
            
            // Convertir fechas de YYYY-MM-DD a DD/MM/AAAA
            const fechaInicioDDMM = convertirFechaYYYYMMDDaDDMMAAAA(fechaInicioStr);
            const fechaLiquidacionDDMM = convertirFechaYYYYMMDDaDDMMAAAA(fechaLiquidacionStr);
            
            // Obtener tipo de tasa seleccionada
            const tasaSeleccionada = document.getElementById('tipoTasa')?.value || '';
            const tipoTasa = tasaSeleccionada === 'badlar' ? 'badlar' : 'tamar';
            
            row.innerHTML = `
                <td style="text-align: center; font-weight: 600; color: var(--text-primary);">${numeroCupon}</td>
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
                <td><input type="number" class="input-table day-count-factor" readonly /></td>
                <td><input type="number" class="input-table amortizacion" step="0.01" /></td>
                <td><input type="number" class="input-table valor-residual" step="0.01" /></td>
                <td><input type="text" class="input-table renta-nominal" step="0.01" readonly /></td>
                <td><input type="text" class="input-table renta-tna" onchange="calcularRentaNominal(this); recalcularFlujos(this.closest('tr'));" /></td>
                <td><input type="number" class="input-table factor-actualizacion" step="0.0001" readonly /></td>
                <td><input type="number" class="input-table pagos-actualizados" step="0.01" readonly /></td>
                <td class="flujos-column"><input type="number" class="input-table flujos" step="0.01" readonly /></td>
                <td class="flujos-column"><input type="number" class="input-table flujos-desc-fecha-compra" step="0.01" readonly /></td>
                <td style="display: flex; gap: 4px; align-items: center; justify-content: center;">
                    <button onclick="abrirTasaConFiltros('${tipoTasa}', ${cuponCount})" style="background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center;" title="Ver ${tipoTasa.toUpperCase()}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#5f6368">
                            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                        </svg>
                    </button>
                    <button onclick="eliminarCupon(${cuponCount})" style="background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center;" title="Eliminar cupón">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#d93025">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
            
            // Agregar event listeners programáticamente para asegurar que funcionen
            const amortizacionInput = row.querySelector('.amortizacion');
            const valorResidualInput = row.querySelector('.valor-residual');
            
            if (amortizacionInput) {
                amortizacionInput.addEventListener('change', function() {
                    recalcularCamposCupon(this);
                });
                amortizacionInput.addEventListener('input', function() {
                    // También recalcular en tiempo real si es necesario
                    setTimeout(() => {
                        recalcularCamposCupon(this);
                    }, 100);
                });
            }
            
            if (valorResidualInput) {
                valorResidualInput.addEventListener('change', function() {
                    recalcularValorResidualSiguiente(this);
                });
            }
            
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
        
        // Autocompletar Renta TNA en todos los cupones
        // Primero verificar si hay cupones con fecha inicio > fecha valuación para replicar
        const fechaValuacionInput = document.getElementById('fechaValuacion');
        let fechaValuacionDate = null;
        if (fechaValuacionInput && fechaValuacionInput.value) {
            const fechaValuacionStr = convertirFechaDDMMAAAAaYYYYMMDD(fechaValuacionInput.value);
            if (fechaValuacionStr) {
                fechaValuacionDate = crearFechaDesdeString(fechaValuacionStr);
            }
        }
        
        const rentaTNAInput = document.getElementById('rentaTNA');
        if (rentaTNAInput && rentaTNAInput.value) {
            const rentaTNA = rentaTNAInput.value;
            rows.forEach((row, index) => {
                const rentaTNAInputCupon = row.querySelector('.renta-tna');
                const fechaInicioInput = row.querySelector('.fecha-inicio');
                
                if (!rentaTNAInputCupon) return;
                
                // Verificar si fecha inicio > fecha valuación
                if (fechaValuacionDate && fechaInicioInput && fechaInicioInput.value && index > 0) {
                    const fechaInicioStr = convertirFechaDDMMAAAAaYYYYMMDD(fechaInicioInput.value);
                    if (fechaInicioStr) {
                        const fechaInicioDate = crearFechaDesdeString(fechaInicioStr);
                        if (fechaInicioDate && fechaInicioDate > fechaValuacionDate) {
                            // Replicar del cupón anterior
                            const cuponAnterior = rows[index - 1];
                            const rentaTNAAnterior = cuponAnterior.querySelector('.renta-tna');
                            if (rentaTNAAnterior && rentaTNAAnterior.value) {
                                rentaTNAInputCupon.value = rentaTNAAnterior.value;
                                calcularRentaNominal(rentaTNAInputCupon);
                                return;
                            }
                        }
                    }
                }
                
                // Si no se replicó, usar el valor global
                rentaTNAInputCupon.value = rentaTNA;
                calcularRentaNominal(rentaTNAInputCupon);
            });
        } else {
            // Si no hay renta TNA global, verificar si hay cupones que necesitan replicar
            if (fechaValuacionDate) {
                verificarYReplicarRentaTNA();
            }
        }
        
        // Autocompletar amortización: 0 en todos, 100 en el último
        // También inicializar valor residual (100 en todos excepto el último que se calculará)
        rows.forEach((row, index) => {
            const amortizacionInput = row.querySelector('.amortizacion');
            const valorResidualInput = row.querySelector('.valor-residual');
            
            if (amortizacionInput) {
                if (index === rows.length - 1) {
                    // Último cupón: 100
                    amortizacionInput.value = 100;
                } else {
                    // Resto de cupones: 0
                    amortizacionInput.value = 0;
                }
                // Disparar evento para recalcular campos relacionados
                recalcularCamposCupon(amortizacionInput);
            }
            
            // Inicializar valor residual en 100 para todos los cupones
            if (valorResidualInput && !valorResidualInput.value) {
                valorResidualInput.value = 100;
            }
        });
        
        // Recalcular valores residuales después de establecer amortizaciones
        setTimeout(() => {
            recalcularValoresResiduales();
        }, 100);
        
        // Recalcular factor actualización y pagos actualizados si hay TIR calculada
        if (ultimaTIRCalculada !== null) {
            rows.forEach(row => {
                recalcularFactorActualizacion(row);
                recalcularPagosActualizados(row);
            });
        }
        
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
            // Usar selectores de clase en lugar de índices para mayor robustez
            const flujosInput = row.querySelector('.flujos');
            const flujosDescFechaCompraInput = row.querySelector('.flujos-desc-fecha-compra');
            
            // Obtener valores usando selectores de clase para mayor robustez
            const amortizacionInput = row.querySelector('.amortizacion');
            const valorResidualInput = row.querySelector('.valor-residual');
            const rentaNominalInput = row.querySelector('.renta-nominal');
            const rentaTNAInput = row.querySelector('.renta-tna');
            const factorActualizacionInput = row.querySelector('.factor-actualizacion');
            const pagosActualizadosInput = row.querySelector('.pagos-actualizados');
            
            rowData = {
                tipo: tipo,
                fechaInicio: fechaInicio,
                fechaLiquidacion: fechaLiquidacion,
                // No guardar fechaInicioCER, fechaFinalCER, dayCountFactor - se autocompletan
                amortizacion: parseFloat(amortizacionInput?.value) || 0,
                valorResidual: parseFloat(valorResidualInput?.value) || 0,
                rentaNominal: parseFloat(rentaNominalInput?.value) || 0,
                rentaTNA: parseFloat(rentaTNAInput?.value) || 0,
                factorActualizacion: parseFloat(factorActualizacionInput?.value) || 0,
                pagosActualizados: parseFloat(pagosActualizadosInput?.value) || 0,
                flujos: parseFloat(flujosInput?.value) || 0,
                flujosDescFechaCompra: parseFloat(flujosDescFechaCompraInput?.value) || 0
            };
            
            // Log para debug
            console.log(`🔍 obtenerDatosCashflow - Cupón: flujosInput=${flujosInput?.value}, flujos=${rowData.flujos}`);
        }
        
        // Truncar valores decimales a 12 decimales para campos específicos que afectan TIR
        const camposPrecision12 = ['amortizacion', 'rentaNominal', 'rentaTNA', 'factorActualizacion', 
                                   'pagosActualizados', 'flujos', 'flujosDescFechaCompra'];
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
function convertirNumeroDecimal(input) {
    // Si es un elemento input, actualizar su valor
    if (typeof input === 'object' && input.nodeName === 'INPUT') {
        const valor = input.value;
        if (!valor || valor === '') {
            input.value = '';
            return '';
        }
        // Reemplazar coma por punto
        const valorConvertido = String(valor).replace(',', '.');
        const numero = parseFloat(valorConvertido);
        if (isNaN(numero)) {
            input.value = '';
            return '';
        }
        input.value = valorConvertido;
        return valorConvertido;
    }
    // Si es un string, solo convertir
    if (typeof input === 'string') {
        if (!input || input === '') return '0';
        const valorConvertido = String(input).replace(',', '.');
        const numero = parseFloat(valorConvertido);
        return isNaN(numero) ? '0' : valorConvertido;
    }
    return '0';
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
        periodicidad: document.getElementById('periodicidad')?.value || '',
        fechaPrimeraRenta: fechaPrimeraRenta,
        fechaAmortizacion: fechaAmortizacion,
        intervaloInicio: parseInt(document.getElementById('intervaloInicio')?.value) || 0,
        intervaloFin: parseInt(document.getElementById('intervaloFin')?.value) || 0,
        formula: document.getElementById('formula')?.value || '',
        tasa: document.getElementById('tasa')?.value || '',
        spread: (() => {
            const spreadValue = document.getElementById('spread')?.value;
            if (spreadValue === '' || spreadValue === null || spreadValue === undefined) {
                return null;
            }
            const parsed = parseFloat(spreadValue);
            return isNaN(parsed) ? null : parsed;
        })(),
        rentaTNA: parseFloat(document.getElementById('rentaTNA')?.value) || 0,
        tipoCalculadora: 'variable'
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
        
        // Guardar la TIR calculada para poder actualizar flujos descontados cuando cambien los flujos
        ultimaTIRCalculada = tir;
        
        // Recalcular factor actualización y pagos actualizados para todos los cupones
        const cashflowRowsForFactor = document.querySelectorAll('#cashflowBody tr[data-tipo="cupon"]');
        cashflowRowsForFactor.forEach(row => {
            recalcularFactorActualizacion(row);
            recalcularPagosActualizados(row);
        });
        
        // Recalcular todos los precios después de calcular TIR
        setTimeout(() => {
            recalcularTodosPrecios();
        }, 100);
        
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
        tipo: 'calculadora-variable'
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
            const response = await fetch('/api/calculadora/listar?tipo=variable');
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
                                     style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: white; border: 1px solid var(--border-color); border-radius: 4px; transition: all 0.2s;"
                                     onmouseover="this.style.background='#e8f0fe'; this.style.borderColor='var(--primary-color)'"
                                     onmouseout="this.style.background='white'; this.style.borderColor='var(--border-color)'">
                                    <div style="flex: 1; cursor: pointer;" onclick="cargarCalculadora('${String(calc.titulo).replace(/'/g, "\\'")}')">
                                        <div style="font-weight: 500; color: var(--text-primary); font-size: 14px;">${String(calc.titulo).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                                        <div style="font-size: 12px; color: var(--text-secondary);">${calc.ticker ? `Ticker: ${calc.ticker} • ` : ''}${fechaFormateada}</div>
                                    </div>
                                    <button onclick="event.stopPropagation(); eliminarCalculadora('${String(calc.titulo).replace(/'/g, "\\'")}')" 
                                            style="background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; margin-left: 8px; border-radius: 4px; transition: background 0.2s;"
                                            onmouseover="this.style.background='#fce8e6'"
                                            onmouseout="this.style.background='transparent'"
                                            title="Eliminar calculadora">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#d93025">
                                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                        </svg>
                                    </button>
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

// Nota: abrirModalCargar está definida al inicio del archivo para estar disponible inmediatamente

// Función para eliminar calculadora
async function eliminarCalculadora(titulo) {
    if (!titulo) {
        showError('No se especificó el título de la calculadora a eliminar');
        return;
    }
    
    // Confirmar eliminación
    if (!confirm(`¿Está seguro de que desea eliminar la calculadora "${titulo}"?`)) {
        return;
    }
    
    try {
        const tituloCodificado = encodeURIComponent(titulo);
        const response = await fetch(`/api/calculadora/${tituloCodificado}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess(`Calculadora "${titulo}" eliminada exitosamente`);
            // Recargar lista de calculadoras
            if (typeof cargarListaCalculadoras === 'function') {
                await cargarListaCalculadoras();
            }
        } else {
            showError(result.error || 'Error al eliminar la calculadora');
        }
    } catch (error) {
        console.error('Error al eliminar calculadora:', error);
        showError('Error al eliminar la calculadora: ' + error.message);
    }
}

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
        const response = await fetch('/api/calculadora/listar?tipo=variable');
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
        
        // Limpiar TIR al cargar nueva calculadora
        ultimaTIRCalculada = null;
        const resultadoTIRDiv = document.getElementById('resultadoTIR');
        if (resultadoTIRDiv) {
            resultadoTIRDiv.textContent = '-';
        }
        
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
                    aplicarMascaraFecha(fechaEmisionInput);
                    // Autocompletar valor CER emisión después de cargar fecha emisión
                    setTimeout(() => {
                        if (typeof autocompletarValorCEREmision === 'function') {
                            autocompletarValorCEREmision();
                        }
                    }, 200);
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
            if (datos.datosEspecie.formula) {
                const formulaInput = document.getElementById('formula');
                if (formulaInput) {
                    formulaInput.value = datos.datosEspecie.formula;
                    cambiarFormula(); // Aplicar cambios según la fórmula
                }
            }
            if (datos.datosEspecie.tasa) {
                const tasaInput = document.getElementById('tasa');
                if (tasaInput) {
                    tasaInput.value = datos.datosEspecie.tasa;
                    cambiarTasa(); // Aplicar cambios según la tasa
                }
            }
            if (datos.datosEspecie.renta_tna !== undefined) {
                const rentaTNAInput = document.getElementById('rentaTNA');
                if (rentaTNAInput) {
                    rentaTNAInput.value = datos.datosEspecie.renta_tna || '';
                }
            }
            if (datos.datosEspecie.spread !== undefined && datos.datosEspecie.spread !== null) {
                const spreadInput = document.getElementById('spread');
                if (spreadInput) {
                    spreadInput.value = datos.datosEspecie.spread || '';
                }
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
                
                // Obtener tipo de tasa seleccionada
                const tasaSeleccionada = document.getElementById('tipoTasa')?.value || '';
                const tipoTasa = tasaSeleccionada === 'badlar' ? 'badlar' : 'tamar';
                
                // Calcular número de cupón (basado en el índice en el array de cupones)
                const numeroCupon = cupones.indexOf(cupon) + 1;
                
                row.innerHTML = `
                    <td style="text-align: center; font-weight: 600; color: var(--text-primary);">${numeroCupon}</td>
                    <td>
                        <input type="text" class="input-table date-input fecha-inicio" id="fechaInicio${cuponCount}" value="${fechaInicioStr || ''}" placeholder="DD/MM/AAAA" maxlength="10" onchange="calcularDayCountFactor(this)" />
                    </td>
                    <td>
                        <input type="text" class="input-table date-input fecha-liquidacion" id="fechaLiquidacion${cuponCount}" value="${fechaLiquidacionStr || ''}" placeholder="DD/MM/AAAA" maxlength="10" onchange="calcularDayCountFactor(this)" />
                    </td>
                    <td class="autocomplete-column">
                        <input type="text" class="input-table date-input fecha-inicio-cer" readonly placeholder="DD/MM/AAAA" maxlength="10" />
                    </td>
                    <td class="autocomplete-column">
                        <input type="text" class="input-table date-input fecha-final-cer" readonly placeholder="DD/MM/AAAA" maxlength="10" />
                    </td>
                    <td class="autocomplete-column"><input type="number" class="input-table day-count-factor" readonly /></td>
                    <td><input type="number" class="input-table amortizacion" step="0.01" value="${cupon.amortizacion || ''}" onchange="recalcularCamposCupon(this); recalcularFlujos(this.closest('tr'));" /></td>
                    <td><input type="number" class="input-table valor-residual" step="0.01" onchange="recalcularValorResidualSiguiente(this)" /></td>
                    <td><input type="text" class="input-table renta-nominal" readonly /></td>
                    <td><input type="text" class="input-table renta-tna" value="${cupon.renta_tna || ''}" onchange="calcularRentaNominal(this); recalcularFlujos(this.closest('tr'));" onblur="convertirNumeroDecimal(this)" /></td>
                    <td><input type="number" class="input-table factor-actualizacion" step="0.0001" readonly /></td>
                    <td><input type="number" class="input-table pagos-actualizados" step="0.01" readonly /></td>
        <td class="flujos-column"><input type="number" class="input-table flujos" step="0.01" readonly /></td>
        <td class="flujos-column"><input type="number" class="input-table flujos-desc-fecha-compra" step="0.01" readonly /></td>
                    <td style="display: flex; gap: 4px; align-items: center; justify-content: center;">
                        <button onclick="abrirTasaConFiltros('${tipoTasa}', ${cuponCount})" style="background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center;" title="Ver ${tipoTasa.toUpperCase()}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#5f6368">
                                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                            </svg>
                        </button>
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
                
                // Agregar event listeners programáticamente para asegurar que funcionen
                const amortizacionInput = row.querySelector('.amortizacion');
                const valorResidualInput = row.querySelector('.valor-residual');
                
                if (amortizacionInput) {
                    amortizacionInput.addEventListener('change', function() {
                        recalcularCamposCupon(this);
                    });
                    amortizacionInput.addEventListener('input', function() {
                        // También recalcular en tiempo real si es necesario
                        setTimeout(() => {
                            recalcularCamposCupon(this);
                        }, 100);
                    });
                }
                
                if (valorResidualInput) {
                    valorResidualInput.addEventListener('change', function() {
                        recalcularValorResidualSiguiente(this);
                    });
                }
                
                // Recalcular renta nominal después de cargar renta TNA y valor residual
                // Esto asegura que se aplique el valor residual correctamente
                const rentaTNAInput = row.querySelector('.renta-tna');
                if (rentaTNAInput && rentaTNAInput.value) {
                    setTimeout(() => {
                        calcularRentaNominal(rentaTNAInput);
                    }, 50);
                }
            }
            
            // Recalcular todos los valores residuales después de cargar todos los cupones
            setTimeout(() => {
                recalcularValoresResiduales();
            }, 200);
            
            // Calcular fechas CER solo si no están ya cargadas desde BD
            // Esto evita sobrescribir valores que ya existen
            setTimeout(() => {
                calcularFechasCER();
                // Recalcular coeficientes después de que se completen los valores CER
                setTimeout(() => {
                    calcularCoeficientesCER();
                }, 300);
            }, 100);
            
            // Recalcular renta nominal para todos los cupones después de cargar todos los datos
            // Esto asegura que se aplique el valor residual correctamente
            setTimeout(() => {
                const rows = document.querySelectorAll('#cashflowBody tr[data-tipo="cupon"]');
                rows.forEach(row => {
                    const rentaTNAInput = row.querySelector('.renta-tna');
                    if (rentaTNAInput && rentaTNAInput.value) {
                        calcularRentaNominal(rentaTNAInput);
                    }
                });
            }, 400);
        }
        
        // Autocompletar valor CER emisión si existe fechaEmision
        const fechaEmisionInput = document.getElementById('fechaEmision');
        if (fechaEmisionInput && fechaEmisionInput.value) {
            // Disparar el evento change para autocompletar valor CER emisión
            setTimeout(() => {
                fechaEmisionInput.dispatchEvent(new Event('change'));
            }, 200);
        }
        
        // Autocompletar valor CER valuación después de cargar datos
        const fechaValuacionInput = document.getElementById('fechaValuacion');
        if (fechaValuacionInput && typeof window.autocompletarValorCERValuacion === 'function') {
            setTimeout(() => {
                console.log('🔄 Autocompletando valor CER valuación después de cargar calculadora...');
                window.autocompletarValorCERValuacion();
            }, 2500);
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
    
    // Limpiar TIR
    ultimaTIRCalculada = null;
    const resultadoTIRDiv = document.getElementById('resultadoTIR');
    if (resultadoTIRDiv) {
        resultadoTIRDiv.textContent = '-';
    }
    
    // Limpiar sumatoria de flujos descontados
    const sumatoriaFlujosDesc = document.getElementById('sumatoriaFlujosDesc');
    if (sumatoriaFlujosDesc) {
        sumatoriaFlujosDesc.textContent = '0.00000000';
    }
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
        
        // Obtener fecha valuación
        let fechaValuacion = document.getElementById('fechaValuacion')?.value || null;
        if (fechaValuacion && /^\d{2}\/\d{2}\/\d{4}$/.test(fechaValuacion)) {
            fechaValuacion = convertirFechaDDMMAAAAaYYYYMMDD(fechaValuacion);
        }
        
        const datos = {
            datosPartida: datosPartida,
            datosEspecie: datosEspecie,
            cashflow: cashflow,
            fechaValuacion: fechaValuacion
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
        
        // Cargar fecha valuación
        if (datos.fechaValuacion) {
            const fechaValuacionInput = document.getElementById('fechaValuacion');
            if (fechaValuacionInput) {
                fechaValuacionInput.value = convertirFechaYYYYMMDDaDDMMAAAA(datos.fechaValuacion);
                aplicarMascaraFecha(fechaValuacionInput);
                // Autocompletar valor CER valuación después de cargar (esperar a que se carguen CER y feriados)
                setTimeout(() => {
                    if (typeof window.autocompletarValorCERValuacion === 'function') {
                        window.autocompletarValorCERValuacion();
                    }
                }, 2500);
            }
        } else {
            // Si no hay fecha valuación guardada, inicializar con fecha de hoy
            const fechaValuacionInput = document.getElementById('fechaValuacion');
            if (fechaValuacionInput && !fechaValuacionInput.value) {
                const hoy = new Date();
                fechaValuacionInput.value = convertirFechaYYYYMMDDaDDMMAAAA(formatearFechaInput(hoy));
                aplicarMascaraFecha(fechaValuacionInput);
                // Autocompletar valor CER valuación después de cargar (esperar a que se carguen CER y feriados)
                setTimeout(() => {
                    if (typeof window.autocompletarValorCERValuacion === 'function') {
                        window.autocompletarValorCERValuacion();
                    }
                }, 2500);
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
                    // Autocompletar valor CER emisión después de cargar fecha emisión
                    setTimeout(() => {
                        if (typeof autocompletarValorCEREmision === 'function') {
                            autocompletarValorCEREmision();
                        }
                    }, 200);
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
                    
                    // Obtener tipo de tasa seleccionada
                    const tasaSeleccionada = document.getElementById('tipoTasa')?.value || '';
                    const tipoTasa = tasaSeleccionada === 'badlar' ? 'badlar' : 'tamar';
                    
                    // Calcular número de cupón (basado en el índice en el array de cupones)
                    const cuponesFiltrados = datos.cashflow.filter(c => c.tipo === 'cupon' && c.fechaInicio && c.fechaLiquidacion);
                    const indiceCupon = cuponesFiltrados.findIndex(c => 
                        c.fechaInicio === cupon.fechaInicio && c.fechaLiquidacion === cupon.fechaLiquidacion
                    );
                    const numeroCupon = indiceCupon >= 0 ? indiceCupon + 1 : cuponCount;
                    
                    row.innerHTML = `
                        <td style="text-align: center; font-weight: 600; color: var(--text-primary);">${numeroCupon}</td>
                        <td>
                            <input type="text" class="input-table date-input fecha-inicio" id="fechaInicio${cuponCount}" value="${fechaInicioDDMM || ''}" placeholder="DD/MM/AAAA" maxlength="10" onchange="calcularDayCountFactor(this)" />
                        </td>
                        <td>
                            <input type="text" class="input-table date-input fecha-liquidacion" id="fechaLiquidacion${cuponCount}" value="${fechaLiquidacionDDMM || ''}" placeholder="DD/MM/AAAA" maxlength="10" onchange="calcularDayCountFactor(this)" />
                        </td>
                        <td class="autocomplete-column">
                            <input type="text" class="input-table date-input fecha-inicio-cer" readonly placeholder="DD/MM/AAAA" maxlength="10" />
                        </td>
                        <td class="autocomplete-column">
                            <input type="text" class="input-table date-input fecha-final-cer" readonly placeholder="DD/MM/AAAA" maxlength="10" />
                        </td>
                        <td class="autocomplete-column"><input type="number" class="input-table day-count-factor" readonly /></td>
                        <td><input type="number" class="input-table amortizacion" step="0.01" value="${cupon.amortizacion || ''}" onchange="recalcularCamposCupon(this); recalcularFlujos(this.closest('tr'));" /></td>
                        <td><input type="number" class="input-table valor-residual" step="0.01" value="${cupon.valorResidual || ''}" onchange="recalcularValorResidualSiguiente(this)" /></td>
                        <td><input type="text" class="input-table renta-nominal" readonly /></td>
                        <td><input type="text" class="input-table renta-tna" value="${cupon.rentaTNA || ''}" onchange="calcularRentaNominal(this); recalcularFlujos(this.closest('tr'));" onblur="convertirNumeroDecimal(this)" /></td>
                        <td><input type="number" class="input-table factor-actualizacion" step="0.0001" readonly value="${cupon.factorActualizacion || ''}" /></td>
                        <td><input type="number" class="input-table pagos-actualizados" step="0.01" readonly value="${cupon.pagosActualizados || ''}" /></td>
                        <td><input type="number" class="input-table flujos" step="0.01" readonly value="${cupon.flujos || ''}" /></td>
                        <td><input type="number" class="input-table flujos-desc-fecha-compra" step="0.01" readonly value="${cupon.flujosDescFechaCompra || ''}" /></td>
                        <td style="display: flex; gap: 4px; align-items: center; justify-content: center;">
                            <button onclick="abrirTasaConFiltros('${tipoTasa}', ${cuponCount})" style="background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center;" title="Ver ${tipoTasa.toUpperCase()}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#5f6368">
                                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                                </svg>
                            </button>
                            <button onclick="eliminarCupon(${cuponCount})" style="background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center;" title="Eliminar cupón">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#d93025">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                </svg>
                            </button>
                        </td>
                    `;
                    
                    tbody.appendChild(row);
                    
                    // Agregar event listeners programáticamente para asegurar que funcionen
                    const amortizacionInput = row.querySelector('.amortizacion');
                    const valorResidualInput = row.querySelector('.valor-residual');
                    
                    if (amortizacionInput) {
                        amortizacionInput.addEventListener('change', function() {
                            recalcularCamposCupon(this);
                        });
                        amortizacionInput.addEventListener('input', function() {
                            // También recalcular en tiempo real si es necesario
                            setTimeout(() => {
                                recalcularCamposCupon(this);
                            }, 100);
                        });
                    }
                    
                    if (valorResidualInput) {
                        valorResidualInput.addEventListener('change', function() {
                            recalcularValorResidualSiguiente(this);
                        });
                    }
                    
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
                    
                    // Recalcular renta nominal después de cargar renta TNA y valor residual
                    // Esto asegura que se aplique el valor residual correctamente
                    const rentaTNAInput = row.querySelector('.renta-tna');
                    if (rentaTNAInput && rentaTNAInput.value) {
                        setTimeout(() => {
                            calcularRentaNominal(rentaTNAInput);
                        }, 50);
                    }
                }
            }
            
            // Recalcular todos los valores residuales después de cargar todos los cupones
            setTimeout(() => {
                recalcularValoresResiduales();
            }, 200);
            
            // Inicializar valor residual en 100 para el primer cupón si no tiene valor
            const rowsCupones = document.querySelectorAll('#cashflowBody tr[data-tipo="cupon"]');
            if (rowsCupones.length > 0) {
                const primerValorResidualInput = rowsCupones[0].querySelector('.valor-residual');
                if (primerValorResidualInput && !primerValorResidualInput.value) {
                    primerValorResidualInput.value = 100;
                }
            }
            
            // Recalcular renta nominal para todos los cupones después de cargar todos los datos
            // Esto asegura que se aplique el valor residual correctamente
            setTimeout(() => {
                rowsCupones.forEach(row => {
                    const rentaTNAInput = row.querySelector('.renta-tna');
                    if (rentaTNAInput && rentaTNAInput.value) {
                        calcularRentaNominal(rentaTNAInput);
                    }
                });
            }, 200);
            
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
    
    // Agregar event listener para el botón "Cargar"
    const btnCargar = document.getElementById('btnCargar');
    if (btnCargar) {
        btnCargar.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof window.abrirModalCargar === 'function') {
                window.abrirModalCargar();
            } else {
                console.error('⚠️ abrirModalCargar no está disponible');
            }
        });
    }
    
    // Inicializar fecha valuación con fecha de hoy
    const fechaValuacionInput = document.getElementById('fechaValuacion');
    if (fechaValuacionInput) {
        const hoy = new Date();
        fechaValuacionInput.value = convertirFechaYYYYMMDDaDDMMAAAA(formatearFechaInput(hoy));
        aplicarMascaraFecha(fechaValuacionInput);
    }
    
    // Agregar listener para recalcular fechas CER cuando cambie fecha valuación
    if (fechaValuacionInput) {
        fechaValuacionInput.addEventListener('change', () => {
            console.log('🔄 fechaValuacion cambió, recalculando fechas CER...');
            // Autocompletar valor CER valuación
            setTimeout(() => {
                if (typeof window.autocompletarValorCERValuacion === 'function') {
                    window.autocompletarValorCERValuacion();
                }
            }, 50);
            // Recalcular fechas CER
            setTimeout(() => {
                calcularFechasCER();
            }, 100);
            // Recalcular rentas TNA si la fórmula es promedio aritmético
            setTimeout(() => {
                const formula = document.getElementById('formula')?.value || '';
                if (formula === 'promedio-aritmetico' || formula === 'promedio-n-tasas') {
                    calcularPromedioAritmetico();
                } else {
                    // Si no es promedio aritmético, verificar si hay cupones con fecha inicio > fecha valuación
                    verificarYReplicarRentaTNA();
                }
            }, 200);
            // Recalcular factor actualización y pagos actualizados
            setTimeout(() => {
                const cashflowRows = document.querySelectorAll('#cashflowBody tr[data-tipo="cupon"]');
                cashflowRows.forEach(row => {
                    recalcularFactorActualizacion(row);
                    recalcularPagosActualizados(row);
                });
                // Recalcular sumatoria de pagos actualizados y todos los precios
                calcularSumatoriaPagosActualizados();
                recalcularTodosPrecios();
            }, 250);
        });
    }
    
    // Cargar feriados y CER desde BD al iniciar (NO cargar calculadora automáticamente)
    cargarDatosDesdeBD().then(() => {
        // Autocompletar valor CER valuación después de cargar datos desde BD
        if (fechaValuacionInput && typeof window.autocompletarValorCERValuacion === 'function') {
            console.log('🔄 Autocompletando valor CER valuación después de cargar datos...');
            setTimeout(() => {
                window.autocompletarValorCERValuacion();
            }, 300);
        }
    });
    
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
            // Recalcular precios
            if (ultimaTIRCalculada !== null) {
                recalcularTodosPrecios();
            }
        });
        precioCompraInput.addEventListener('input', () => {
            // También recalcular mientras se escribe (con debounce)
            setTimeout(() => {
                recalcularTodosFlujos();
                // Recalcular precios
                if (ultimaTIRCalculada !== null) {
                    recalcularTodosPrecios();
                }
            }, 300);
        });
    }
    
    // Listener para el input de flujos de inversión
    const flujosInversionInput = document.getElementById('flujos');
    if (flujosInversionInput) {
        flujosInversionInput.addEventListener('change', () => {
            console.log('🔄 flujos de inversión cambió, actualizando flujos descontados');
            if (ultimaTIRCalculada !== null) {
                actualizarFlujosDescontadosYSumatoria();
            }
        });
        flujosInversionInput.addEventListener('input', () => {
            // También actualizar mientras se escribe (con debounce)
            setTimeout(() => {
                if (ultimaTIRCalculada !== null) {
                    actualizarFlujosDescontadosYSumatoria();
                }
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
        'ticker', 'fechaEmision', 'tipoInteresDias', 
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
            // Recalcular precios
            if (ultimaTIRCalculada !== null) {
                setTimeout(() => {
                    recalcularTodosPrecios();
                }, 100);
            }
        });
    }
    
    // Listeners para recalcular precios cuando cambien valorCERValuacion o valorCERFinal
    const valorCERValuacionInputForPrecios = document.getElementById('valorCERValuacion');
    const valorCERFinalInputForPrecios = document.getElementById('valorCERFinal');
    
    if (valorCERValuacionInputForPrecios) {
        valorCERValuacionInputForPrecios.addEventListener('change', () => {
            if (ultimaTIRCalculada !== null) {
                recalcularTodosPrecios();
            }
        });
    }
    
    if (valorCERFinalInputForPrecios) {
        valorCERFinalInputForPrecios.addEventListener('change', () => {
            if (ultimaTIRCalculada !== null) {
                recalcularTodosPrecios();
            }
        });
    }
    
    // Función para autocompletar valor CER emisión (global para poder ser llamada desde otras funciones)
    window.autocompletarValorCEREmision = function() {
        const fechaEmisionInput = document.getElementById('fechaEmision');
        const valorCEREmisionInput = document.getElementById('valorCEREmision');
        const intervaloFinInput = document.getElementById('intervaloFin');
        
        if (!fechaEmisionInput || !valorCEREmisionInput || !intervaloFinInput) {
            console.warn('⚠️ autocompletarValorCEREmision - Faltan elementos necesarios');
            return;
        }
        
        if (!fechaEmisionInput.value) {
            valorCEREmisionInput.value = '';
            return;
        }
        
        // Validar formato de fecha (DD/MM/AAAA)
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(fechaEmisionInput.value)) {
            console.warn('⚠️ autocompletarValorCEREmision - Formato de fecha inválido:', fechaEmisionInput.value);
            return;
        }
        
        let fechaEmision = convertirFechaDDMMAAAAaYYYYMMDD(fechaEmisionInput.value);
        const fechaEmisionDate = crearFechaDesdeString(fechaEmision);
        
        if (!fechaEmisionDate) {
            console.warn('⚠️ autocompletarValorCEREmision - No se pudo crear fecha desde:', fechaEmision);
            return;
        }
        
        // Obtener intervaloFin para calcular fecha final intervalo
        const intervaloFin = parseInt(intervaloFinInput.value) || 0;
        
        if (intervaloFin === 0) {
            console.warn('⚠️ autocompletarValorCEREmision - Intervalo Fin no está definido (0)');
            valorCEREmisionInput.value = '';
            return;
        }
        
        console.log('🔄 autocompletarValorCEREmision - Fecha Emisión:', fechaEmision, 'Intervalo Fin:', intervaloFin);
        
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
        
        console.log('📊 autocompletarValorCEREmision - Feriados disponibles:', feriados.length);
        
        // Calcular fecha final intervalo desde fecha emisión
        const fechaFinalIntervaloEmision = calcularFechaConDiasHabiles(fechaEmisionDate, intervaloFin, feriados);
        
        if (fechaFinalIntervaloEmision) {
            const fechaFinalIntervaloEmisionStr = formatearFechaInput(fechaFinalIntervaloEmision);
            console.log('🔍 autocompletarValorCEREmision - Buscando CER para fecha:', fechaFinalIntervaloEmisionStr);
            const cerEmision = obtenerValorCER(fechaFinalIntervaloEmisionStr);
            
            if (cerEmision !== null) {
                const valorTruncado = window.truncarDecimal ? window.truncarDecimal(cerEmision, 8) : parseFloat(cerEmision.toFixed(8));
                valorCEREmisionInput.value = valorTruncado;
                console.log('✅ autocompletarValorCEREmision - Valor CER Emisión asignado:', valorTruncado);
                // Recalcular coeficientes CER cuando se actualiza el valor CER emisión
                setTimeout(() => {
                    calcularCoeficientesCER();
                }, 50);
            } else {
                valorCEREmisionInput.value = '';
                console.warn('⚠️ autocompletarValorCEREmision - No se encontró CER para fecha:', fechaFinalIntervaloEmisionStr);
            }
        } else {
            valorCEREmisionInput.value = '';
            console.warn('⚠️ autocompletarValorCEREmision - No se pudo calcular fecha final intervalo');
        }
    }
    
    // Función para autocompletar valor CER valuación (similar a valorCEREmision)
    window.autocompletarValorCERValuacion = function() {
        const fechaValuacionInput = document.getElementById('fechaValuacion');
        const valorCERValuacionInput = document.getElementById('valorCERValuacion');
        const intervaloFinInput = document.getElementById('intervaloFin');
        
        if (!fechaValuacionInput || !valorCERValuacionInput || !intervaloFinInput) {
            console.warn('⚠️ autocompletarValorCERValuacion - Faltan elementos necesarios');
            return;
        }
        
        if (!fechaValuacionInput.value) {
            valorCERValuacionInput.value = '';
            return;
        }
        
        // Validar formato de fecha (DD/MM/AAAA)
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(fechaValuacionInput.value)) {
            console.warn('⚠️ autocompletarValorCERValuacion - Formato de fecha inválido:', fechaValuacionInput.value);
            return;
        }
        
        let fechaValuacion = convertirFechaDDMMAAAAaYYYYMMDD(fechaValuacionInput.value);
        const fechaValuacionDate = crearFechaDesdeString(fechaValuacion);
        
        if (!fechaValuacionDate) {
            console.warn('⚠️ autocompletarValorCERValuacion - No se pudo crear fecha desde:', fechaValuacion);
            return;
        }
        
        // Obtener intervaloFin para calcular fecha final intervalo
        const intervaloFin = parseInt(intervaloFinInput.value) || 0;
        
        if (intervaloFin === 0) {
            console.warn('⚠️ autocompletarValorCERValuacion - Intervalo Fin no está definido (0)');
            valorCERValuacionInput.value = '';
            return;
        }
        
        console.log('🔄 autocompletarValorCERValuacion - Fecha Valuación:', fechaValuacion, 'Intervalo Fin:', intervaloFin);
        
        // Obtener feriados del cache
        const intervaloInicio = parseInt(document.getElementById('intervaloInicio')?.value) || 0;
        const fechaMin = new Date(fechaValuacionDate);
        const fechaMax = new Date(fechaValuacionDate);
        const diasExtras = Math.max(Math.abs(intervaloInicio), Math.abs(intervaloFin)) + 10;
        fechaMin.setDate(fechaMin.getDate() - diasExtras);
        fechaMax.setDate(fechaMax.getDate() + diasExtras);
        const fechaDesdeStr = formatearFechaInput(fechaMin);
        const fechaHastaStr = formatearFechaInput(fechaMax);
        const feriados = obtenerFeriadosCache(fechaDesdeStr, fechaHastaStr);
        
        console.log('📊 autocompletarValorCERValuacion - Feriados disponibles:', feriados.length);
        
        // Calcular fecha final intervalo desde fecha valuación
        const fechaFinalIntervaloValuacion = calcularFechaConDiasHabiles(fechaValuacionDate, intervaloFin, feriados);
        
        if (fechaFinalIntervaloValuacion) {
            const fechaFinalIntervaloValuacionStr = formatearFechaInput(fechaFinalIntervaloValuacion);
            console.log('🔍 autocompletarValorCERValuacion - Buscando CER para fecha:', fechaFinalIntervaloValuacionStr);
            const cerValuacion = obtenerValorCER(fechaFinalIntervaloValuacionStr);
            
            if (cerValuacion !== null) {
                const valorTruncado = window.truncarDecimal ? window.truncarDecimal(cerValuacion, 8) : parseFloat(cerValuacion.toFixed(8));
                valorCERValuacionInput.value = valorTruncado;
                console.log('✅ autocompletarValorCERValuacion - Valor CER Valuación asignado:', valorTruncado);
            } else {
                valorCERValuacionInput.value = '';
                console.warn('⚠️ autocompletarValorCERValuacion - No se encontró CER para fecha:', fechaFinalIntervaloValuacionStr);
            }
        } else {
            valorCERValuacionInput.value = '';
            console.warn('⚠️ autocompletarValorCERValuacion - No se pudo calcular fecha final intervalo');
        }
    };
    
    // Autocompletar valor CER emisión cuando cambia fechaEmision
    const fechaEmisionInputForListener = document.getElementById('fechaEmision');
    const valorCEREmisionInputForListener = document.getElementById('valorCEREmision');
    if (fechaEmisionInputForListener && valorCEREmisionInputForListener) {
        fechaEmisionInputForListener.addEventListener('change', () => {
            console.log('🔄 fechaEmision cambió, autocompletando valor CER emisión...');
            window.autocompletarValorCEREmision();
        });
        fechaEmisionInputForListener.addEventListener('blur', () => {
            console.log('🔄 fechaEmision perdió foco, autocompletando valor CER emisión...');
            window.autocompletarValorCEREmision();
        });
    }
    
    // Autocompletar valor CER valuación cuando cambia fechaValuacion
    const fechaValuacionInputForListener = document.getElementById('fechaValuacion');
    const valorCERValuacionInputForListener = document.getElementById('valorCERValuacion');
    if (fechaValuacionInputForListener && valorCERValuacionInputForListener) {
        fechaValuacionInputForListener.addEventListener('change', () => {
            console.log('🔄 fechaValuacion cambió, autocompletando valor CER valuación...');
            window.autocompletarValorCERValuacion();
            // También recalcular fechas CER
            setTimeout(() => {
                calcularFechasCER();
            }, 100);
            // Recalcular factor actualización y pagos actualizados
            setTimeout(() => {
                const cashflowRows = document.querySelectorAll('#cashflowBody tr[data-tipo="cupon"]');
                cashflowRows.forEach(row => {
                    recalcularFactorActualizacion(row);
                    recalcularPagosActualizados(row);
                });
                // Recalcular sumatoria de pagos actualizados y todos los precios
                calcularSumatoriaPagosActualizados();
                recalcularTodosPrecios();
            }, 150);
        });
        fechaValuacionInputForListener.addEventListener('blur', () => {
            console.log('🔄 fechaValuacion perdió foco, autocompletando valor CER valuación...');
            window.autocompletarValorCERValuacion();
            // También recalcular fechas CER
            setTimeout(() => {
                calcularFechasCER();
            }, 100);
            // Recalcular factor actualización y pagos actualizados
            setTimeout(() => {
                const cashflowRows = document.querySelectorAll('#cashflowBody tr[data-tipo="cupon"]');
                cashflowRows.forEach(row => {
                    recalcularFactorActualizacion(row);
                    recalcularPagosActualizados(row);
                });
                // Recalcular sumatoria de pagos actualizados y todos los precios
                calcularSumatoriaPagosActualizados();
                recalcularTodosPrecios();
            }, 150);
        });
    }
    
    // También recalcular cuando cambia intervaloFin (tanto para emisión como valuación)
    const intervaloFinInputForCERListener = document.getElementById('intervaloFin');
    if (intervaloFinInputForCERListener) {
        intervaloFinInputForCERListener.addEventListener('change', () => {
            console.log('🔄 intervaloFin cambió, recalculando valores CER...');
            const fechaEmisionInputForCER = document.getElementById('fechaEmision');
            if (fechaEmisionInputForCER && fechaEmisionInputForCER.value) {
                window.autocompletarValorCEREmision();
            }
            const fechaValuacionInputForCER = document.getElementById('fechaValuacion');
            if (fechaValuacionInputForCER && fechaValuacionInputForCER.value) {
                window.autocompletarValorCERValuacion();
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

