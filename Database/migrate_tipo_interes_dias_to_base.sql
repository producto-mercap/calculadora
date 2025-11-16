-- Script para migrar tipo_interes_dias de valores numéricos (360, 365, 366) a bases (0, 1, 2, 3)
-- Ejecutar este script en la base de datos para actualizar los valores existentes

-- Verificar valores actuales antes de la migración
SELECT 
    titulo,
    tipo_interes_dias,
    CASE 
        WHEN tipo_interes_dias = 360 OR tipo_interes_dias = 0 THEN 'US (NASD) 30/360'
        WHEN tipo_interes_dias = 365 OR tipo_interes_dias = 3 THEN 'Real/365 (Actual/365)'
        WHEN tipo_interes_dias = 366 OR tipo_interes_dias = 1 THEN 'Real/real (Actual/actual)'
        WHEN tipo_interes_dias = 2 THEN 'Real/360 (Actual/360)'
        ELSE 'Desconocido'
    END as base_actual
FROM especies
ORDER BY titulo;

-- Migrar valores antiguos a nuevas bases:
-- 360 -> 0 (US 30/360)
-- 365 -> 3 (Real/365)
-- 366 -> 1 (Real/real)
-- 2 -> 2 (Real/360) - ya está correcto
-- 0, 1, 3 -> mantener igual

UPDATE especies
SET tipo_interes_dias = CASE
    WHEN tipo_interes_dias = 360 THEN 0  -- US (NASD) 30/360
    WHEN tipo_interes_dias = 365 THEN 3  -- Real/365 (Actual/365)
    WHEN tipo_interes_dias = 366 THEN 1  -- Real/real (Actual/actual)
    WHEN tipo_interes_dias IN (0, 1, 2, 3) THEN tipo_interes_dias  -- Ya está en formato correcto
    ELSE 0  -- Por defecto, usar 30/360 si hay algún valor desconocido
END
WHERE tipo_interes_dias IS NOT NULL;

-- Verificar valores después de la migración
SELECT 
    titulo,
    tipo_interes_dias,
    CASE 
        WHEN tipo_interes_dias = 0 THEN 'US (NASD) 30/360'
        WHEN tipo_interes_dias = 1 THEN 'Real/real (Actual/actual)'
        WHEN tipo_interes_dias = 2 THEN 'Real/360 (Actual/360)'
        WHEN tipo_interes_dias = 3 THEN 'Real/365 (Actual/365)'
        ELSE 'Desconocido'
    END as base_nueva
FROM especies
ORDER BY titulo;

-- Verificar que no haya valores fuera del rango esperado (0-3)
SELECT COUNT(*) as registros_fuera_de_rango
FROM especies
WHERE tipo_interes_dias NOT IN (0, 1, 2, 3) AND tipo_interes_dias IS NOT NULL;

