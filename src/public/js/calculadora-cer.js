// JavaScript para la calculadora CER

// Contador de cupones
let cuponCount = 0;

// Agregar nuevo cupón a la tabla
function agregarCupon() {
    cuponCount++;
    const tbody = document.getElementById('cashflowBody');
    
    const row = document.createElement('tr');
    row.setAttribute('data-cupon-id', cuponCount);
    row.setAttribute('data-tipo', 'cupon');
    
    row.innerHTML = `
        <td><input type="date" class="input-table" /></td>
        <td><input type="date" class="input-table" /></td>
        <td><input type="date" class="input-table" /></td>
        <td><input type="number" class="input-table" step="0.0001" /></td>
        <td><input type="number" class="input-table" step="0.0001" /></td>
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
            fechaCoeficiente: inputs[2]?.value || null,
            valorCER: parseFloat(inputs[3]?.value) || 0,
            dayCountFactor: parseFloat(inputs[4]?.value) || 0,
            amortizacion: parseFloat(inputs[5]?.value) || 0,
            valorResidual: parseFloat(inputs[6]?.value) || 0,
            amortizacionAjustada: parseFloat(inputs[7]?.value) || 0,
            rentaNominal: parseFloat(inputs[8]?.value) || 0,
            rentaTNA: parseFloat(inputs[9]?.value) || 0,
            rentaAjustada: parseFloat(inputs[10]?.value) || 0,
            factorActualizacion: parseFloat(inputs[11]?.value) || 0,
            pagosActualizados: parseFloat(inputs[12]?.value) || 0,
            flujos: parseFloat(inputs[13]?.value) || 0,
            flujosDescFechaCompra: parseFloat(inputs[14]?.value) || 0,
            flujosDescHoy: parseFloat(inputs[15]?.value) || 0
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
        spread: parseFloat(document.getElementById('spread')?.value) || 0
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

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    console.log('Calculadora CER inicializada');
    
    // Aquí se pueden agregar event listeners adicionales
    // para cálculos automáticos, validaciones, etc.
});

