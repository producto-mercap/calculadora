// Configuración de conexión a PostgreSQL (Neon)
const { Pool } = require('pg');

// Validar que DATABASE_URL esté configurada y no sea un placeholder
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL no está configurada. Las funciones de base de datos no funcionarán.');
} else if (DATABASE_URL.includes('@host') || DATABASE_URL.includes('user:password') || DATABASE_URL.includes('/database')) {
    console.warn('⚠️ DATABASE_URL parece ser un valor placeholder. Configure la URL real de su base de datos Neon.');
    console.warn('   Formato esperado: postgresql://usuario:password@host.neon.tech/database?sslmode=require');
}

// Agregar zona horaria a la URL de conexión si no está presente
let connectionString = DATABASE_URL;
if (DATABASE_URL && !DATABASE_URL.includes('timezone=')) {
    const separator = DATABASE_URL.includes('?') ? '&' : '?';
    connectionString = `${DATABASE_URL}${separator}timezone=America/Argentina/Buenos_Aires`;
}

// Solo crear el pool si hay una URL válida (no placeholder)
const pool = DATABASE_URL && !DATABASE_URL.includes('@host') && !DATABASE_URL.includes('user:password') && !DATABASE_URL.includes('/database')
    ? new Pool({
        connectionString: connectionString,
        ssl: process.env.NODE_ENV === 'production' ? {
            rejectUnauthorized: false
        } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000
    })
    : null;

// Verificar conexión solo si el pool existe
if (pool) {
    pool.on('error', (err) => {
        console.error('❌ Error en conexión a base de datos:', err);
    });
    
    console.log('✅ Pool de base de datos configurado (zona horaria: America/Argentina/Buenos_Aires)');
} else {
    console.warn('⚠️ Pool de base de datos no inicializado. Configure DATABASE_URL correctamente.');
}

// Exportar pool (puede ser null si no está configurado)
module.exports = pool;

