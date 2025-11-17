// Controller para la calculadora de TIR

// Función para obtener timestamp en zona horaria de Argentina
// Retorna el timestamp formateado como string para PostgreSQL
function obtenerTimestampArgentina() {
    const ahora = new Date();
    
    // Obtener la fecha/hora en zona horaria de Argentina usando toLocaleString
    // Usar formato 'en-US' para obtener formato consistente MM/DD/YYYY, HH:MM:SS
    const fechaArgentina = ahora.toLocaleString('en-US', {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    // Parsear la fecha formateada (formato: MM/DD/YYYY, HH:MM:SS)
    // Ejemplo: "11/15/2025, 23:06:58"
    const partes = fechaArgentina.split(', ');
    const fechaPartes = partes[0].split('/'); // [MM, DD, YYYY]
    const horaPartes = partes[1].split(':'); // [HH, MM, SS]
    
    const año = fechaPartes[2];
    const mes = fechaPartes[0];
    const dia = fechaPartes[1];
    const horas = horaPartes[0];
    const minutos = horaPartes[1];
    const segundos = horaPartes[2];
    
    // Obtener milisegundos del objeto Date original
    const milisegundos = String(ahora.getMilliseconds()).padStart(3, '0');
    
    // Formatear como timestamp de PostgreSQL: YYYY-MM-DD HH:MM:SS.mmm
    const timestamp = `${año}-${mes}-${dia} ${horas}:${minutos}:${segundos}.${milisegundos}`;
    
    // Log para debug (remover en producción si es necesario)
    console.log('🔍 Timestamp Argentina generado:', timestamp, '| UTC original:', ahora.toISOString());
    
    return timestamp;
}

// Renderizar página principal de calculadora CER
const renderCalculadoraCER = async (req, res) => {
    try {
        res.render('pages/calculadora-cer', {
            title: 'Calculadora CER - TIR Bonos',
            activeMenu: 'calculadora-cer'
        });
    } catch (error) {
        console.error('Error al renderizar calculadora CER:', error);
        res.status(500).render('pages/error', {
            title: 'Error',
            error: 'Error al cargar la calculadora',
            activeMenu: ''
        });
    }
};

// Renderizar página de calculadora Variable
const renderCalculadoraVariable = async (req, res) => {
    try {
        res.render('pages/calculadora-variable', {
            title: 'Calculadora Variable - TIR Bonos',
            activeMenu: 'calculadora-variable'
        });
    } catch (error) {
        console.error('Error al renderizar calculadora Variable:', error);
        res.status(500).render('pages/error', {
            title: 'Error',
            error: 'Error al cargar la calculadora',
            activeMenu: ''
        });
    }
};

// Renderizar página de CER
const renderCER = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        let datos = [];
        let total = 0;
        let pagina = 1;
        const porPagina = 30;

        // Si hay pool configurado, cargar datos paginados
        if (pool) {
            try {
                pagina = parseInt(req.query.pagina) || 1;
                const offset = (pagina - 1) * porPagina;

                // Obtener total de registros
                const countResult = await pool.query('SELECT COUNT(*) as total FROM cer');
                total = parseInt(countResult.rows[0].total);

                // Obtener datos paginados (orden descendente - más reciente primero)
                const result = await pool.query(
                    'SELECT fecha, valor, id_variable as idVariable FROM cer ORDER BY fecha DESC LIMIT $1 OFFSET $2',
                    [porPagina, offset]
                );
                datos = result.rows;
            } catch (error) {
                console.error('Error al cargar datos de CER:', error);
                // Continuar sin datos si hay error
            }
        }

        res.render('pages/cer', {
            title: 'Tira CER',
            activeMenu: 'cer',
            datos: datos,
            pagina: pagina,
            total: total,
            porPagina: porPagina,
            totalPaginas: Math.ceil(total / porPagina)
        });
    } catch (error) {
        console.error('Error al renderizar CER:', error);
        res.status(500).render('pages/error', {
            title: 'Error',
            error: 'Error al cargar CER',
            activeMenu: ''
        });
    }
};

// Renderizar página de TAMAR
const renderTAMAR = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        let datos = [];
        let total = 0;
        let pagina = 1;
        const porPagina = 30;

        // Si hay pool configurado, cargar datos paginados
        if (pool) {
            try {
                pagina = parseInt(req.query.pagina) || 1;
                const offset = (pagina - 1) * porPagina;

                // Obtener total de registros (usando id_variable = 44 para TAMAR)
                const countResult = await pool.query('SELECT COUNT(*) as total FROM cer WHERE id_variable = 44');
                total = parseInt(countResult.rows[0].total);

                // Obtener datos paginados (orden descendente - más reciente primero)
                const result = await pool.query(
                    'SELECT fecha, valor, id_variable as idVariable FROM cer WHERE id_variable = 44 ORDER BY fecha DESC LIMIT $1 OFFSET $2',
                    [porPagina, offset]
                );
                datos = result.rows;
            } catch (error) {
                console.error('Error al cargar datos de TAMAR:', error);
                // Continuar sin datos si hay error
            }
        }

        res.render('pages/tamar', {
            title: 'Tira TAMAR',
            activeMenu: 'tamar',
            datos: datos,
            pagina: pagina,
            total: total,
            porPagina: porPagina,
            totalPaginas: Math.ceil(total / porPagina)
        });
    } catch (error) {
        console.error('Error al renderizar TAMAR:', error);
        res.status(500).render('pages/error', {
            title: 'Error',
            error: 'Error al cargar TAMAR',
            activeMenu: ''
        });
    }
};

// Renderizar página de BADLAR
const renderBADLAR = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        let datos = [];
        let total = 0;
        let pagina = 1;
        const porPagina = 30;

        // Si hay pool configurado, cargar datos paginados
        if (pool) {
            try {
                pagina = parseInt(req.query.pagina) || 1;
                const offset = (pagina - 1) * porPagina;

                // Obtener total de registros (usando id_variable = 7 para BADLAR)
                const countResult = await pool.query('SELECT COUNT(*) as total FROM cer WHERE id_variable = 7');
                total = parseInt(countResult.rows[0].total);

                // Obtener datos paginados (orden descendente - más reciente primero)
                const result = await pool.query(
                    'SELECT fecha, valor, id_variable as idVariable FROM cer WHERE id_variable = 7 ORDER BY fecha DESC LIMIT $1 OFFSET $2',
                    [porPagina, offset]
                );
                datos = result.rows;
            } catch (error) {
                console.error('Error al cargar datos de BADLAR:', error);
                // Continuar sin datos si hay error
            }
        }

        res.render('pages/badlar', {
            title: 'Tira BADLAR',
            activeMenu: 'badlar',
            datos: datos,
            pagina: pagina,
            total: total,
            porPagina: porPagina,
            totalPaginas: Math.ceil(total / porPagina)
        });
    } catch (error) {
        console.error('Error al renderizar BADLAR:', error);
        res.status(500).render('pages/error', {
            title: 'Error',
            error: 'Error al cargar BADLAR',
            activeMenu: ''
        });
    }
};

// Renderizar página de Feriados
const renderFeriados = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        let datos = [];
        let total = 0;
        let pagina = 1;
        const porPagina = 30;

        // Si hay pool configurado, cargar datos paginados
        if (pool) {
            try {
                pagina = parseInt(req.query.pagina) || 1;
                const offset = (pagina - 1) * porPagina;

                // Obtener total de registros
                const countResult = await pool.query('SELECT COUNT(*) as total FROM feriados');
                total = parseInt(countResult.rows[0].total);

                // Obtener datos paginados (orden descendente - más reciente primero)
                const result = await pool.query(
                    'SELECT fecha, nombre, tipo FROM feriados ORDER BY fecha DESC LIMIT $1 OFFSET $2',
                    [porPagina, offset]
                );
                datos = result.rows;
            } catch (error) {
                console.error('Error al cargar datos de Feriados:', error);
                // Continuar sin datos si hay error
            }
        }

        res.render('pages/feriados', {
            title: 'Feriados',
            activeMenu: 'feriados',
            datos: datos,
            pagina: pagina,
            total: total,
            porPagina: porPagina,
            totalPaginas: Math.ceil(total / porPagina)
        });
    } catch (error) {
        console.error('Error al renderizar Feriados:', error);
        res.status(500).render('pages/error', {
            title: 'Error',
            error: 'Error al cargar Feriados',
            activeMenu: ''
        });
    }
};

// Calcular TIR
const calcularTIR = async (req, res) => {
    try {
        const { flujos, fechas } = req.body;

        // Validar datos de entrada
        if (!flujos || !Array.isArray(flujos) || flujos.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Datos de flujos inválidos'
            });
        }

        // Aquí implementaremos la lógica de cálculo de TIR
        // Por ahora retornamos un valor de ejemplo
        const tir = 0.15; // 15% ejemplo

        res.json({
            success: true,
            tir: tir,
            tirPorcentaje: (tir * 100).toFixed(2)
        });
    } catch (error) {
        console.error('Error al calcular TIR:', error);
        res.status(500).json({
            success: false,
            error: 'Error al calcular TIR'
        });
    }
};

// Guardar calculadora
const guardarCalculadora = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        // Verificar si hay conexión a BD
        if (!pool) {
            return res.status(503).json({
                success: false,
                error: 'Base de datos no configurada. Configure DATABASE_URL en las variables de entorno con la URL real de Neon (no use valores placeholder).'
            });
        }
        const { titulo, datosPartida, datosEspecie, cashflow, sobreescribir } = req.body;

        // Validar título
        if (!titulo || titulo.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'El título es requerido'
            });
        }

        // Validar datos mínimos
        if (!datosPartida && !datosEspecie) {
            return res.status(400).json({
                success: false,
                error: 'Debe proporcionar al menos datos de Partida o Especie'
            });
        }

        // Validar que no exista el título (solo si no se está sobreescribiendo)
        if (!sobreescribir) {
            const existeEspecie = await pool.query(
                'SELECT titulo FROM especies WHERE titulo = $1',
                [titulo]
            );
            
            const existePartida = await pool.query(
                'SELECT titulo FROM partidas WHERE titulo = $1',
                [titulo]
            );

            if (existeEspecie.rows.length > 0 || existePartida.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Ya existe una calculadora con ese título. Por favor elija otro nombre.'
                });
            }
        }

        // Iniciar transacción
        await pool.query('BEGIN');

        try {
            // Si se está sobreescribiendo, eliminar datos anteriores de ambas tablas y cashflow
            if (sobreescribir) {
                await pool.query('DELETE FROM cashflow WHERE titulo = $1', [titulo]);
                await pool.query('DELETE FROM especies WHERE titulo = $1', [titulo]);
                await pool.query('DELETE FROM partidas WHERE titulo = $1', [titulo]);
            }

            // Guardar ESPECIE si hay datos
            if (datosEspecie && datosEspecie.ticker) {
                // Determinar tipo de calculadora según la ruta o datos
                const tipoCalculadora = datosEspecie.tipoCalculadora || 'cer';
                
                // Usar NOW() con conversión explícita a zona horaria de Argentina
                await pool.query(
                    `INSERT INTO especies (
                        titulo, ticker, fecha_emision, tipo_interes_dias, 
                        periodicidad, fecha_primera_renta, fecha_amortizacion, 
                        intervalo_inicio, intervalo_fin, formula, tasa, spread, renta_tna, tipo_calculadora,
                        fecha_creacion, fecha_actualizacion
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                        (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::timestamp without time zone,
                        (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::timestamp without time zone)
                    ON CONFLICT (titulo) DO UPDATE SET
                        ticker = EXCLUDED.ticker,
                        fecha_emision = EXCLUDED.fecha_emision,
                        tipo_interes_dias = EXCLUDED.tipo_interes_dias,
                        periodicidad = EXCLUDED.periodicidad,
                        fecha_primera_renta = EXCLUDED.fecha_primera_renta,
                        fecha_amortizacion = EXCLUDED.fecha_amortizacion,
                        intervalo_inicio = EXCLUDED.intervalo_inicio,
                        intervalo_fin = EXCLUDED.intervalo_fin,
                        formula = EXCLUDED.formula,
                        tasa = EXCLUDED.tasa,
                        spread = EXCLUDED.spread,
                        renta_tna = EXCLUDED.renta_tna,
                        tipo_calculadora = EXCLUDED.tipo_calculadora,
                        fecha_actualizacion = (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::timestamp without time zone`,
                    [
                        titulo,
                        datosEspecie.ticker || null,
                        datosEspecie.fechaEmision || null,
                        datosEspecie.tipoInteresDias || 360,
                        datosEspecie.periodicidad || null,
                        datosEspecie.fechaPrimeraRenta || null,
                        datosEspecie.fechaAmortizacion || null,
                        datosEspecie.intervaloInicio || 0,
                        datosEspecie.intervaloFin || 0,
                        datosEspecie.formula || null,
                        datosEspecie.tasa || null,
                        (datosEspecie.spread !== null && datosEspecie.spread !== undefined && !isNaN(datosEspecie.spread)) 
                            ? parseFloat(parseFloat(datosEspecie.spread).toFixed(8)) 
                            : null,
                        datosEspecie.rentaTNA ? parseFloat(parseFloat(datosEspecie.rentaTNA).toFixed(12)) : 0,
                        tipoCalculadora
                    ]
                );
            }

            // Guardar PARTIDA si hay datos
            if (datosPartida && (datosPartida.fechaCompra || datosPartida.precioCompra || datosPartida.cantidadPartida)) {
                // Determinar tipo de calculadora según la ruta o datos
                const tipoCalculadora = datosEspecie?.tipoCalculadora || datosPartida.tipoCalculadora || 'cer';
                
                // Usar NOW() con conversión explícita a zona horaria de Argentina
                await pool.query(
                    `INSERT INTO partidas (
                        titulo, ticker, fecha_compra, precio_compra, cantidad_partida, tipo_calculadora,
                        fecha_creacion, fecha_actualizacion
                    ) VALUES ($1, $2, $3, $4, $5, $6,
                        (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::timestamp without time zone,
                        (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::timestamp without time zone)
                    ON CONFLICT (titulo) DO UPDATE SET
                        ticker = EXCLUDED.ticker,
                        fecha_compra = EXCLUDED.fecha_compra,
                        precio_compra = EXCLUDED.precio_compra,
                        cantidad_partida = EXCLUDED.cantidad_partida,
                        tipo_calculadora = EXCLUDED.tipo_calculadora,
                        fecha_actualizacion = (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::timestamp without time zone`,
                    [
                        titulo,
                        datosEspecie?.ticker || datosPartida.ticker || null,
                        datosPartida.fechaCompra || null,
                        // Truncar a 8 decimales antes de guardar
                        datosPartida.precioCompra ? parseFloat(parseFloat(datosPartida.precioCompra).toFixed(8)) : 0,
                        datosPartida.cantidadPartida || 0,
                        tipoCalculadora
                    ]
                );
            }

            // Guardar CASHFLOW (cupones e inversión) si hay datos
            if (cashflow && Array.isArray(cashflow) && cashflow.length > 0) {
                // Si no se está sobreescribiendo, eliminar cashflow anterior para este título
                if (!sobreescribir) {
                    await pool.query(
                        'DELETE FROM cashflow WHERE titulo = $1',
                        [titulo]
                    );
                }

                // Insertar nuevos cupones e inversión
                for (const item of cashflow) {
                    if (item.tipo === 'cupon' && item.fechaInicio && item.fechaLiquidacion) {
                        // Solo guardar las columnas que existen en BD según estructura
                        await pool.query(
                            `INSERT INTO cashflow (
                                titulo, fecha_inicio, fecha_liquidacion, 
                                amortizacion, renta_tna
                            ) VALUES ($1, $2, $3, $4, $5)`,
                            [
                                titulo,
                                item.fechaInicio || null,
                                item.fechaLiquidacion || null,
                                // Truncar a 12 decimales antes de guardar (mayor precisión para TIR)
                                item.amortizacion ? parseFloat(parseFloat(item.amortizacion).toFixed(12)) : 0,
                                item.rentaTNA ? parseFloat(parseFloat(item.rentaTNA).toFixed(12)) : 0
                            ]
                        );
                    } else if (item.tipo === 'inversion' && item.fechaLiquidacion) {
                        // Solo guardar las columnas básicas que existen en BD
                        await pool.query(
                            `INSERT INTO cashflow (
                                titulo, fecha_liquidacion
                            ) VALUES ($1, $2)`,
                            [
                                titulo,
                                item.fechaLiquidacion || null
                            ]
                        );
                    }
                }
            }

            // Commit transacción
            await pool.query('COMMIT');

            res.json({
                success: true,
                titulo: titulo,
                message: 'Calculadora guardada exitosamente'
            });

        } catch (error) {
            // Rollback en caso de error
            await pool.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Error al guardar calculadora:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error al guardar la calculadora'
        });
    }
};

// Verificar si existen datos de CER en BD
const verificarCER = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        // Verificar si hay conexión a BD
        if (!pool) {
            return res.json({
                success: true,
                existen: false,
                cantidad: 0
            });
        }

        const { desde, hasta } = req.query;

        if (!desde || !hasta) {
            return res.status(400).json({
                success: false,
                error: 'Parámetros "desde" y "hasta" son requeridos'
            });
        }

        const result = await pool.query(
            'SELECT COUNT(*) as cantidad FROM cer WHERE fecha >= $1 AND fecha <= $2',
            [desde, hasta]
        );

        const cantidad = parseInt(result.rows[0].cantidad);

        res.json({
            success: true,
            existen: cantidad > 0,
            cantidad: cantidad
        });

    } catch (error) {
        console.error('Error al verificar CER:', error);
        // Si hay error de conexión, asumir que no existen datos
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.json({
                success: true,
                existen: false,
                cantidad: 0
            });
        }
        res.status(500).json({
            success: false,
            error: error.message || 'Error al verificar datos de CER'
        });
    }
};

// Obtener datos de CER desde BD (con paginación o por rango de fechas)
const obtenerCERBD = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        // Verificar si hay conexión a BD
        if (!pool) {
            return res.status(503).json({
                success: false,
                error: 'Base de datos no configurada. Configure DATABASE_URL en las variables de entorno.'
            });
        }

        const { desde, hasta } = req.query;

        // Si se proporcionan desde y hasta, obtener por rango de fechas
        if (desde && hasta) {
            const result = await pool.query(
                'SELECT fecha, valor, id_variable as idVariable FROM cer WHERE fecha >= $1 AND fecha <= $2 ORDER BY fecha DESC',
                [desde, hasta]
            );

            return res.json({
                success: true,
                datos: result.rows
            });
        }

        // Si no, usar paginación
        const pagina = parseInt(req.query.pagina) || 1;
        const porPagina = parseInt(req.query.porPagina) || 30;
        const offset = (pagina - 1) * porPagina;

        // Obtener total de registros
        const countResult = await pool.query('SELECT COUNT(*) as total FROM cer');
        const total = parseInt(countResult.rows[0].total);

        // Obtener datos paginados (orden descendente - más reciente primero)
        const result = await pool.query(
            'SELECT fecha, valor, id_variable as idVariable FROM cer ORDER BY fecha DESC LIMIT $1 OFFSET $2',
            [porPagina, offset]
        );

        res.json({
            success: true,
            datos: result.rows,
            pagina: pagina,
            porPagina: porPagina,
            total: total,
            totalPaginas: Math.ceil(total / porPagina)
        });

    } catch (error) {
        console.error('Error al obtener CER de BD:', error);
        // Si hay error de conexión, retornar error
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                error: 'Error de conexión a la base de datos'
            });
        }
        res.status(500).json({
            success: false,
            error: error.message || 'Error al obtener datos de CER'
        });
    }
};

// Obtener fechas existentes de CER en un rango
const obtenerFechasExistentesCER = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        // Verificar si hay conexión a BD
        if (!pool) {
            return res.json({
                success: true,
                fechas: []
            });
        }

        const { desde, hasta } = req.query;

        if (!desde || !hasta) {
            return res.status(400).json({
                success: false,
                error: 'Parámetros "desde" y "hasta" son requeridos'
            });
        }

        const result = await pool.query(
            'SELECT fecha FROM cer WHERE fecha >= $1 AND fecha <= $2',
            [desde, hasta]
        );

        const fechas = result.rows.map(row => row.fecha);

        res.json({
            success: true,
            fechas: fechas
        });

    } catch (error) {
        console.error('Error al obtener fechas existentes de CER:', error);
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.json({
                success: true,
                fechas: []
            });
        }
        res.status(500).json({
            success: false,
            error: error.message || 'Error al obtener fechas existentes'
        });
    }
};

// Guardar datos de CER
const guardarCER = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        // Verificar si hay conexión a BD
        if (!pool) {
            return res.status(503).json({
                success: false,
                error: 'Base de datos no configurada. Configure DATABASE_URL en las variables de entorno con la URL real de Neon.'
            });
        }

        const { datos } = req.body;

        if (!datos || !Array.isArray(datos) || datos.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No hay datos de CER para guardar'
            });
        }

        // Insertar/actualizar datos usando INSERT múltiple (mucho más rápido)
        const batchSize = 500; // Aumentar tamaño de lote
        let totalActualizados = 0;
        
        for (let i = 0; i < datos.length; i += batchSize) {
            const batch = datos.slice(i, i + batchSize);
            
            // Construir query con múltiples valores
            const values = [];
            const placeholders = [];
            const params = [];
            
            batch.forEach((item, index) => {
                const baseIndex = index * 3;
                placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3})`);
                params.push(item.fecha, item.valor, item.idVariable || 30);
            });
            
            const query = `
                INSERT INTO cer (fecha, valor, id_variable)
                VALUES ${placeholders.join(', ')}
                ON CONFLICT (fecha, id_variable) DO UPDATE SET
                    valor = EXCLUDED.valor
            `;
            
            try {
                await pool.query(query, params);
                totalActualizados += batch.length;
            } catch (error) {
                console.error('Error al insertar/actualizar lote CER:', error);
                throw error;
            }
        }

        res.json({
            success: true,
            actualizados: totalActualizados,
            message: `Se guardaron/actualizaron ${totalActualizados} registros de CER`
        });

    } catch (error) {
        console.error('Error al guardar CER:', error);
        // Si hay error de conexión, retornar error específico
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                error: 'Error de conexión a la base de datos. Verifique la configuración de DATABASE_URL.'
            });
        }
        res.status(500).json({
            success: false,
            error: error.message || 'Error al guardar datos de CER'
        });
    }
};

// Verificar si existen datos de Feriados en BD
const verificarFeriados = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        // Verificar si hay conexión a BD
        if (!pool) {
            return res.json({
                success: true,
                existen: false,
                cantidad: 0
            });
        }

        const { desde, hasta } = req.query;

        if (!desde || !hasta) {
            return res.status(400).json({
                success: false,
                error: 'Parámetros "desde" y "hasta" son requeridos'
            });
        }

        const result = await pool.query(
            'SELECT COUNT(*) as cantidad FROM feriados WHERE fecha >= $1 AND fecha <= $2',
            [desde, hasta]
        );

        const cantidad = parseInt(result.rows[0].cantidad);

        res.json({
            success: true,
            existen: cantidad > 0,
            cantidad: cantidad
        });

    } catch (error) {
        console.error('Error al verificar Feriados:', error);
        // Si hay error de conexión, asumir que no existen datos
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.json({
                success: true,
                existen: false,
                cantidad: 0
            });
        }
        res.status(500).json({
            success: false,
            error: error.message || 'Error al verificar datos de Feriados'
        });
    }
};

// Obtener datos de Feriados desde BD (con paginación o por rango de fechas)
const obtenerFeriadosBD = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        // Verificar si hay conexión a BD
        if (!pool) {
            return res.status(503).json({
                success: false,
                error: 'Base de datos no configurada. Configure DATABASE_URL en las variables de entorno.'
            });
        }

        const { desde, hasta } = req.query;

        // Si se proporcionan desde y hasta, obtener por rango de fechas
        if (desde && hasta) {
            const result = await pool.query(
                'SELECT fecha, nombre, tipo FROM feriados WHERE fecha >= $1 AND fecha <= $2 ORDER BY fecha ASC',
                [desde, hasta]
            );

            return res.json({
                success: true,
                datos: result.rows
            });
        }

        // Si no, usar paginación
        const pagina = parseInt(req.query.pagina) || 1;
        const porPagina = parseInt(req.query.porPagina) || 30;
        const offset = (pagina - 1) * porPagina;

        // Obtener total de registros
        const countResult = await pool.query('SELECT COUNT(*) as total FROM feriados');
        const total = parseInt(countResult.rows[0].total);

        // Obtener datos paginados (orden descendente - más reciente primero)
        const result = await pool.query(
            'SELECT fecha, nombre, tipo FROM feriados ORDER BY fecha DESC LIMIT $1 OFFSET $2',
            [porPagina, offset]
        );

        res.json({
            success: true,
            datos: result.rows,
            pagina: pagina,
            porPagina: porPagina,
            total: total,
            totalPaginas: Math.ceil(total / porPagina)
        });

    } catch (error) {
        console.error('Error al obtener Feriados de BD:', error);
        // Si hay error de conexión, retornar error
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                error: 'Error de conexión a la base de datos'
            });
        }
        res.status(500).json({
            success: false,
            error: error.message || 'Error al obtener datos de Feriados'
        });
    }
};

// Obtener fechas existentes de Feriados en un rango
const obtenerFechasExistentesFeriados = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        // Verificar si hay conexión a BD
        if (!pool) {
            return res.json({
                success: true,
                fechas: []
            });
        }

        const { desde, hasta } = req.query;

        if (!desde || !hasta) {
            return res.status(400).json({
                success: false,
                error: 'Parámetros "desde" y "hasta" son requeridos'
            });
        }

        const result = await pool.query(
            'SELECT fecha FROM feriados WHERE fecha >= $1 AND fecha <= $2',
            [desde, hasta]
        );

        const fechas = result.rows.map(row => row.fecha);

        res.json({
            success: true,
            fechas: fechas
        });

    } catch (error) {
        console.error('Error al obtener fechas existentes de Feriados:', error);
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.json({
                success: true,
                fechas: []
            });
        }
        res.status(500).json({
            success: false,
            error: error.message || 'Error al obtener fechas existentes'
        });
    }
};

// Guardar datos de Feriados
const guardarFeriados = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        // Verificar si hay conexión a BD
        if (!pool) {
            return res.status(503).json({
                success: false,
                error: 'Base de datos no configurada. Configure DATABASE_URL en las variables de entorno con la URL real de Neon.'
            });
        }

        const { datos } = req.body;

        if (!datos || !Array.isArray(datos) || datos.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No hay datos de feriados para guardar'
            });
        }

        // Insertar/actualizar datos usando INSERT múltiple (mucho más rápido)
        const batchSize = 500; // Aumentar tamaño de lote
        let totalActualizados = 0;
        
        for (let i = 0; i < datos.length; i += batchSize) {
            const batch = datos.slice(i, i + batchSize);
            
            // Construir query con múltiples valores
            const placeholders = [];
            const params = [];
            
            batch.forEach((item, index) => {
                const baseIndex = index * 3;
                placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3})`);
                params.push(item.fecha, item.nombre || '', item.tipo || '');
            });
            
            const query = `
                INSERT INTO feriados (fecha, nombre, tipo)
                VALUES ${placeholders.join(', ')}
                ON CONFLICT (fecha) DO UPDATE SET
                    nombre = EXCLUDED.nombre,
                    tipo = EXCLUDED.tipo
            `;
            
            try {
                await pool.query(query, params);
                totalActualizados += batch.length;
            } catch (error) {
                console.error('Error al insertar/actualizar lote Feriados:', error);
                throw error;
            }
        }

        res.json({
            success: true,
            actualizados: totalActualizados,
            message: `Se guardaron/actualizaron ${totalActualizados} feriados`
        });

    } catch (error) {
        console.error('Error al guardar feriados:', error);
        // Si hay error de conexión, retornar error específico
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                error: 'Error de conexión a la base de datos. Verifique la configuración de DATABASE_URL.'
            });
        }
        res.status(500).json({
            success: false,
            error: error.message || 'Error al guardar datos de feriados'
        });
    }
};

// Listar calculadoras guardadas (filtradas por tipo)
const listarCalculadoras = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        if (!pool) {
            return res.status(503).json({
                success: false,
                error: 'Base de datos no configurada'
            });
        }

        // Obtener tipo de calculadora desde query (cer o variable)
        const tipoCalculadora = req.query.tipo || 'cer';

        // Obtener calculadoras filtradas por tipo (especies y partidas)
        const especies = await pool.query(
            'SELECT titulo, ticker, fecha_creacion, fecha_actualizacion, tipo_calculadora FROM especies WHERE tipo_calculadora = $1 ORDER BY fecha_actualizacion DESC',
            [tipoCalculadora]
        );
        
        const partidas = await pool.query(
            'SELECT titulo, ticker, fecha_creacion, fecha_actualizacion, tipo_calculadora FROM partidas WHERE tipo_calculadora = $1 ORDER BY fecha_actualizacion DESC',
            [tipoCalculadora]
        );

        // Combinar y ordenar por fecha de actualización
        const calculadoras = [
            ...especies.rows.map(row => ({ ...row, tipo: 'especie' })),
            ...partidas.rows.map(row => ({ ...row, tipo: 'partida' }))
        ].sort((a, b) => {
            const fechaA = new Date(a.fecha_actualizacion || a.fecha_creacion);
            const fechaB = new Date(b.fecha_actualizacion || b.fecha_creacion);
            return fechaB - fechaA;
        });

        res.json({
            success: true,
            calculadoras: calculadoras
        });

    } catch (error) {
        console.error('Error al listar calculadoras:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error al listar calculadoras'
        });
    }
};

// Obtener una calculadora específica
const obtenerCalculadora = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        if (!pool) {
            return res.status(503).json({
                success: false,
                error: 'Base de datos no configurada'
            });
        }

        const { titulo } = req.params;

        if (!titulo) {
            return res.status(400).json({
                success: false,
                error: 'Título es requerido'
            });
        }

        // Obtener datos de especie
        const especieResult = await pool.query(
            'SELECT * FROM especies WHERE titulo = $1',
            [titulo]
        );

        // Obtener datos de partida
        const partidaResult = await pool.query(
            'SELECT * FROM partidas WHERE titulo = $1',
            [titulo]
        );

        // Obtener cashflow (cupones)
        const cashflowResult = await pool.query(
            'SELECT * FROM cashflow WHERE titulo = $1 ORDER BY fecha_inicio ASC',
            [titulo]
        );

        const datos = {
            titulo: titulo,
            datosEspecie: especieResult.rows[0] || null,
            datosPartida: partidaResult.rows[0] || null,
            cashflow: cashflowResult.rows || []
        };

        res.json({
            success: true,
            datos: datos
        });

    } catch (error) {
        console.error('Error al obtener calculadora:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error al obtener calculadora'
        });
    }
};

// Eliminar calculadora
const eliminarCalculadora = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        if (!pool) {
            return res.status(503).json({
                success: false,
                error: 'Base de datos no configurada'
            });
        }

        const { titulo } = req.params;

        if (!titulo) {
            return res.status(400).json({
                success: false,
                error: 'Título es requerido'
            });
        }

        // Iniciar transacción
        await pool.query('BEGIN');

        try {
            // Eliminar cashflow
            await pool.query('DELETE FROM cashflow WHERE titulo = $1', [titulo]);
            
            // Eliminar especie
            await pool.query('DELETE FROM especies WHERE titulo = $1', [titulo]);
            
            // Eliminar partida
            await pool.query('DELETE FROM partidas WHERE titulo = $1', [titulo]);

            // Confirmar transacción
            await pool.query('COMMIT');

            res.json({
                success: true,
                message: `Calculadora "${titulo}" eliminada exitosamente`
            });

        } catch (error) {
            // Revertir transacción en caso de error
            await pool.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Error al eliminar calculadora:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error al eliminar calculadora'
        });
    }
};

// Funciones para TAMAR (id_variable = 44)
// Verificar si existen datos de TAMAR en BD
const verificarTAMAR = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        if (!pool) {
            return res.json({
                success: true,
                existen: false,
                cantidad: 0
            });
        }

        const { desde, hasta } = req.query;

        if (!desde || !hasta) {
            return res.status(400).json({
                success: false,
                error: 'Parámetros "desde" y "hasta" son requeridos'
            });
        }

        const result = await pool.query(
            'SELECT COUNT(*) as cantidad FROM cer WHERE fecha >= $1 AND fecha <= $2 AND id_variable = 44',
            [desde, hasta]
        );

        const cantidad = parseInt(result.rows[0].cantidad);

        res.json({
            success: true,
            existen: cantidad > 0,
            cantidad: cantidad
        });

    } catch (error) {
        console.error('Error al verificar TAMAR:', error);
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.json({
                success: true,
                existen: false,
                cantidad: 0
            });
        }
        res.status(500).json({
            success: false,
            error: error.message || 'Error al verificar datos de TAMAR'
        });
    }
};

// Obtener datos de TAMAR desde BD
const obtenerTAMARBD = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        if (!pool) {
            return res.status(503).json({
                success: false,
                error: 'Base de datos no configurada'
            });
        }

        const { desde, hasta } = req.query;

        if (desde && hasta) {
            const result = await pool.query(
                'SELECT fecha, valor, id_variable as idVariable FROM cer WHERE fecha >= $1 AND fecha <= $2 AND id_variable = 44 ORDER BY fecha DESC',
                [desde, hasta]
            );

            return res.json({
                success: true,
                datos: result.rows
            });
        }

        const pagina = parseInt(req.query.pagina) || 1;
        const porPagina = parseInt(req.query.porPagina) || 30;
        const offset = (pagina - 1) * porPagina;

        const countResult = await pool.query('SELECT COUNT(*) as total FROM cer WHERE id_variable = 44');
        const total = parseInt(countResult.rows[0].total);

        const result = await pool.query(
            'SELECT fecha, valor, id_variable as idVariable FROM cer WHERE id_variable = 44 ORDER BY fecha DESC LIMIT $1 OFFSET $2',
            [porPagina, offset]
        );

        res.json({
            success: true,
            datos: result.rows,
            pagina: pagina,
            porPagina: porPagina,
            total: total,
            totalPaginas: Math.ceil(total / porPagina)
        });

    } catch (error) {
        console.error('Error al obtener TAMAR de BD:', error);
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                error: 'Error de conexión a la base de datos'
            });
        }
        res.status(500).json({
            success: false,
            error: error.message || 'Error al obtener datos de TAMAR'
        });
    }
};

// Obtener fechas existentes de TAMAR
const obtenerFechasExistentesTAMAR = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        if (!pool) {
            return res.json({
                success: true,
                fechas: []
            });
        }

        const { desde, hasta } = req.query;

        if (!desde || !hasta) {
            return res.status(400).json({
                success: false,
                error: 'Parámetros "desde" y "hasta" son requeridos'
            });
        }

        const result = await pool.query(
            'SELECT fecha FROM cer WHERE fecha >= $1 AND fecha <= $2 AND id_variable = 44',
            [desde, hasta]
        );

        const fechas = result.rows.map(row => row.fecha);

        res.json({
            success: true,
            fechas: fechas
        });

    } catch (error) {
        console.error('Error al obtener fechas existentes de TAMAR:', error);
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.json({
                success: true,
                fechas: []
            });
        }
        res.status(500).json({
            success: false,
            error: error.message || 'Error al obtener fechas existentes'
        });
    }
};

// Guardar datos de TAMAR
const guardarTAMAR = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        if (!pool) {
            return res.status(503).json({
                success: false,
                error: 'Base de datos no configurada'
            });
        }

        const { datos } = req.body;

        if (!datos || !Array.isArray(datos) || datos.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No hay datos de TAMAR para guardar'
            });
        }

        const batchSize = 500;
        let totalActualizados = 0;
        
        for (let i = 0; i < datos.length; i += batchSize) {
            const batch = datos.slice(i, i + batchSize);
            
            const placeholders = [];
            const params = [];
            
            batch.forEach((item, index) => {
                const baseIndex = index * 3;
                placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3})`);
                params.push(item.fecha, item.valor, 44); // id_variable = 44 para TAMAR
            });
            
            const query = `
                INSERT INTO cer (fecha, valor, id_variable)
                VALUES ${placeholders.join(', ')}
                ON CONFLICT (fecha, id_variable) DO UPDATE SET
                    valor = EXCLUDED.valor
            `;
            
            try {
                await pool.query(query, params);
                totalActualizados += batch.length;
            } catch (error) {
                console.error('Error al insertar/actualizar lote TAMAR:', error);
                throw error;
            }
        }

        res.json({
            success: true,
            actualizados: totalActualizados,
            message: `Se guardaron/actualizaron ${totalActualizados} registros de TAMAR`
        });

    } catch (error) {
        console.error('Error al guardar TAMAR:', error);
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                error: 'Error de conexión a la base de datos'
            });
        }
        res.status(500).json({
            success: false,
            error: error.message || 'Error al guardar datos de TAMAR'
        });
    }
};

// Funciones para BADLAR (id_variable = 7)
// Verificar si existen datos de BADLAR en BD
const verificarBADLAR = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        if (!pool) {
            return res.json({
                success: true,
                existen: false,
                cantidad: 0
            });
        }

        const { desde, hasta } = req.query;

        if (!desde || !hasta) {
            return res.status(400).json({
                success: false,
                error: 'Parámetros "desde" y "hasta" son requeridos'
            });
        }

        const result = await pool.query(
            'SELECT COUNT(*) as cantidad FROM cer WHERE fecha >= $1 AND fecha <= $2 AND id_variable = 7',
            [desde, hasta]
        );

        const cantidad = parseInt(result.rows[0].cantidad);

        res.json({
            success: true,
            existen: cantidad > 0,
            cantidad: cantidad
        });

    } catch (error) {
        console.error('Error al verificar BADLAR:', error);
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.json({
                success: true,
                existen: false,
                cantidad: 0
            });
        }
        res.status(500).json({
            success: false,
            error: error.message || 'Error al verificar datos de BADLAR'
        });
    }
};

// Obtener datos de BADLAR desde BD
const obtenerBADLARBD = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        if (!pool) {
            return res.status(503).json({
                success: false,
                error: 'Base de datos no configurada'
            });
        }

        const { desde, hasta } = req.query;

        if (desde && hasta) {
            const result = await pool.query(
                'SELECT fecha, valor, id_variable as idVariable FROM cer WHERE fecha >= $1 AND fecha <= $2 AND id_variable = 7 ORDER BY fecha DESC',
                [desde, hasta]
            );

            return res.json({
                success: true,
                datos: result.rows
            });
        }

        const pagina = parseInt(req.query.pagina) || 1;
        const porPagina = parseInt(req.query.porPagina) || 30;
        const offset = (pagina - 1) * porPagina;

        const countResult = await pool.query('SELECT COUNT(*) as total FROM cer WHERE id_variable = 7');
        const total = parseInt(countResult.rows[0].total);

        const result = await pool.query(
            'SELECT fecha, valor, id_variable as idVariable FROM cer WHERE id_variable = 7 ORDER BY fecha DESC LIMIT $1 OFFSET $2',
            [porPagina, offset]
        );

        res.json({
            success: true,
            datos: result.rows,
            pagina: pagina,
            porPagina: porPagina,
            total: total,
            totalPaginas: Math.ceil(total / porPagina)
        });

    } catch (error) {
        console.error('Error al obtener BADLAR de BD:', error);
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                error: 'Error de conexión a la base de datos'
            });
        }
        res.status(500).json({
            success: false,
            error: error.message || 'Error al obtener datos de BADLAR'
        });
    }
};

// Obtener fechas existentes de BADLAR
const obtenerFechasExistentesBADLAR = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        if (!pool) {
            return res.json({
                success: true,
                fechas: []
            });
        }

        const { desde, hasta } = req.query;

        if (!desde || !hasta) {
            return res.status(400).json({
                success: false,
                error: 'Parámetros "desde" y "hasta" son requeridos'
            });
        }

        const result = await pool.query(
            'SELECT fecha FROM cer WHERE fecha >= $1 AND fecha <= $2 AND id_variable = 7',
            [desde, hasta]
        );

        const fechas = result.rows.map(row => row.fecha);

        res.json({
            success: true,
            fechas: fechas
        });

    } catch (error) {
        console.error('Error al obtener fechas existentes de BADLAR:', error);
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.json({
                success: true,
                fechas: []
            });
        }
        res.status(500).json({
            success: false,
            error: error.message || 'Error al obtener fechas existentes'
        });
    }
};

// Guardar datos de BADLAR
const guardarBADLAR = async (req, res) => {
    const pool = require('../config/database');
    
    try {
        if (!pool) {
            return res.status(503).json({
                success: false,
                error: 'Base de datos no configurada'
            });
        }

        const { datos } = req.body;

        if (!datos || !Array.isArray(datos) || datos.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No hay datos de BADLAR para guardar'
            });
        }

        const batchSize = 500;
        let totalActualizados = 0;
        
        for (let i = 0; i < datos.length; i += batchSize) {
            const batch = datos.slice(i, i + batchSize);
            
            const placeholders = [];
            const params = [];
            
            batch.forEach((item, index) => {
                const baseIndex = index * 3;
                placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3})`);
                params.push(item.fecha, item.valor, 7); // id_variable = 7 para BADLAR
            });
            
            const query = `
                INSERT INTO cer (fecha, valor, id_variable)
                VALUES ${placeholders.join(', ')}
                ON CONFLICT (fecha, id_variable) DO UPDATE SET
                    valor = EXCLUDED.valor
            `;
            
            try {
                await pool.query(query, params);
                totalActualizados += batch.length;
            } catch (error) {
                console.error('Error al insertar/actualizar lote BADLAR:', error);
                throw error;
            }
        }

        res.json({
            success: true,
            actualizados: totalActualizados,
            message: `Se guardaron/actualizaron ${totalActualizados} registros de BADLAR`
        });

    } catch (error) {
        console.error('Error al guardar BADLAR:', error);
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                error: 'Error de conexión a la base de datos'
            });
        }
        res.status(500).json({
            success: false,
            error: error.message || 'Error al guardar datos de BADLAR'
        });
    }
};

module.exports = {
    renderCalculadoraCER,
    renderCalculadoraVariable,
    renderCER,
    renderTAMAR,
    renderBADLAR,
    renderFeriados,
    calcularTIR,
    guardarCalculadora,
    listarCalculadoras,
    obtenerCalculadora,
    eliminarCalculadora,
    verificarCER,
    obtenerCERBD,
    obtenerFechasExistentesCER,
    guardarCER,
    verificarFeriados,
    obtenerFeriadosBD,
    obtenerFechasExistentesFeriados,
    guardarFeriados,
    // Funciones para TAMAR
    verificarTAMAR,
    obtenerTAMARBD,
    obtenerFechasExistentesTAMAR,
    guardarTAMAR,
    // Funciones para BADLAR
    verificarBADLAR,
    obtenerBADLARBD,
    obtenerFechasExistentesBADLAR,
    guardarBADLAR
};

