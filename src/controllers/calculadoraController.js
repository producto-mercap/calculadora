// Controller para la calculadora de TIR

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
    try {
        res.render('pages/cer', {
            title: 'Tira CER',
            activeMenu: 'cer'
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
    try {
        res.render('pages/tamar', {
            title: 'Tira TAMAR',
            activeMenu: 'tamar'
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
    try {
        res.render('pages/badlar', {
            title: 'Tira BADLAR',
            activeMenu: 'badlar'
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
    try {
        res.render('pages/feriados', {
            title: 'Feriados',
            activeMenu: 'feriados'
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
    try {
        const datos = req.body;

        // Validar datos mínimos
        if (!datos.datosPartida && !datos.datosEspecie) {
            return res.status(400).json({
                success: false,
                error: 'Debe proporcionar al menos datos de Partida o Especie'
            });
        }

        // TODO: Cuando se configure la BD, aquí se guardará en la base de datos
        // Por ahora, solo retornamos éxito simulado
        // 
        // Ejemplo de estructura para cuando se implemente:
        // const pool = require('../config/database');
        // const result = await pool.query(
        //     'INSERT INTO calculadoras (datos, tipo, fecha_creacion) VALUES ($1, $2, $3) RETURNING id',
        //     [JSON.stringify(datos), datos.tipo, new Date()]
        // );
        // const id = result.rows[0].id;

        // Simular guardado exitoso
        const idSimulado = Date.now(); // ID temporal hasta que se configure BD

        console.log('Datos recibidos para guardar:', {
            tipo: datos.tipo,
            esCopia: datos.esCopia || false,
            ticker: datos.datosEspecie?.ticker,
            fechaCreacion: datos.fechaCreacion
        });

        res.json({
            success: true,
            id: idSimulado,
            message: datos.esCopia ? 'Copia guardada exitosamente' : 'Calculadora guardada exitosamente'
        });
    } catch (error) {
        console.error('Error al guardar calculadora:', error);
        res.status(500).json({
            success: false,
            error: 'Error al guardar la calculadora'
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
    guardarCalculadora
};

