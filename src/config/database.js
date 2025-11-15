// Configuración de conexión a PostgreSQL (Neon)
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

// Verificar conexión
pool.on('connect', () => {
    console.log('✅ Conexión a base de datos establecida');
});

pool.on('error', (err) => {
    console.error('❌ Error en conexión a base de datos:', err);
});

module.exports = pool;

