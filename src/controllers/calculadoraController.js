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

module.exports = {
    renderCalculadoraCER,
    renderCalculadoraVariable,
    renderCER,
    renderTAMAR,
    renderBADLAR,
    renderFeriados,
    calcularTIR
};

