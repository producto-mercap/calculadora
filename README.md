# Calculadora TIR - Bonos CER y Variables

Aplicación web para calcular la Tasa Interna de Retorno (TIR) de bonos con ajuste CER y variables, desarrollada con Node.js, Express y EJS.

## 📋 Descripción

Esta aplicación permite calcular la TIR de bonos considerando:
- Ajustes por CER (Coeficiente de Estabilización de Referencia)
- Cupones de amortización e intereses
- Flujos de caja descontados
- Tira de precios desde fecha de compra hasta vencimiento

## 🚀 Tecnologías

- **Backend:** Node.js + Express
- **Base de datos:** PostgreSQL (Neon)
- **Template Engine:** EJS
- **Estilos:** CSS personalizado con Google Fonts
- **Hosting:** Vercel
- **APIs externas:** 
  - BCRA (CER, TAMAR, BADLAR)
  - Feriados Argentina

## 📁 Estructura del Proyecto

```
Calculadora/
├── src/
│   ├── app.js                  # Entrada principal
│   ├── config/
│   │   └── database.js         # Configuración de PostgreSQL
│   ├── controllers/
│   │   └── calculadoraController.js
│   ├── models/                 # Modelos de datos
│   ├── routes/
│   │   ├── calculadoraRoutes.js
│   │   └── apiRoutes.js
│   ├── services/
│   │   ├── bcraService.js      # Consumo API BCRA
│   │   └── feriadosService.js  # Consumo API Feriados
│   ├── middleware/             # Middleware personalizado
│   ├── utils/                  # Funciones auxiliares
│   ├── public/
│   │   ├── css/
│   │   │   └── main.css
│   │   ├── js/
│   │   │   ├── main.js
│   │   │   └── calculadora-cer.js
│   │   └── images/
│   └── views/
│       ├── layouts/
│       │   └── main.ejs
│       ├── partials/
│       │   ├── header.ejs
│       │   └── sidebar.ejs
│       └── pages/
│           ├── calculadora-cer.ejs
│           ├── calculadora-variable.ejs
│           ├── cer.ejs
│           ├── tamar.ejs
│           ├── badlar.ejs
│           ├── feriados.ejs
│           ├── 404.ejs
│           └── error.ejs
├── tests/                      # Tests
├── .env.example                # Plantilla de variables de entorno
├── .gitignore
├── package.json
├── README.md
└── vercel.json                 # Configuración de Vercel
```

## 🔧 Instalación

### Prerrequisitos

- Node.js >= 18.x
- PostgreSQL (Neon) - opcional
- Git

### Pasos de instalación

1. **Clonar el repositorio:**

```bash
git clone git@github.com:producto-mercap/calculadora.git
cd calculadora
```

2. **Instalar dependencias:**

```bash
npm install
```

3. **Configurar variables de entorno:**

```bash
cp .env.example .env
```

Editar `.env` con tus valores:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

4. **Iniciar servidor de desarrollo:**

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📊 Funcionalidades

### Calculadora CER

- **Panel de Cashflow:** Tabla editable con todos los cupones del bono
  - Fecha inicio, liquidación, coeficiente
  - Valores CER y ajustes
  - Amortizaciones y rentas
  - Flujos descontados
  
- **Datos de Partida:**
  - Fecha de compra
  - Precio de compra
  - Cantidad de partida
  
- **Datos de Especie:**
  - Ticker del bono
  - Fecha de emisión
  - Tipo de interés (días)
  - Spread
  
- **Resultados:**
  - TIR calculada
  - Pagos efectuados actualizados
  - Precios técnicos
  - Valuación
  
- **Tira de Precios:** Tabla con evolución de precios desde compra hasta vencimiento

### Calculadora Variable

🚧 En desarrollo

### Datos de Mercado

- **CER:** Tira histórica desde API BCRA
- **TAMAR:** Tira histórica desde API BCRA
- **BADLAR:** Tira histórica desde API BCRA
- **Feriados:** Calendario de feriados argentinos

## 🌐 Variables de Entorno

| Variable | Descripción | Requerido | Default |
|----------|-------------|-----------|---------|
| `PORT` | Puerto del servidor | No | 3000 |
| `NODE_ENV` | Entorno de ejecución | No | development |
| `DATABASE_URL` | URL de conexión a PostgreSQL | Sí* | - |
| `BCRA_API_URL` | URL de API BCRA | No | https://api.bcra.gob.ar/estadisticas/v2.0 |
| `FERIADOS_API_URL` | URL de API Feriados | No | https://nolaborables.com.ar/api/v2/feriados |

\* Requerido solo si se usa base de datos

## 🚀 Deploy en Vercel

1. **Conectar repositorio de GitHub a Vercel:**
   - Ir a [vercel.com](https://vercel.com)
   - Importar proyecto desde GitHub
   - Seleccionar repositorio `producto-mercap/calculadora`

2. **Configurar variables de entorno en Vercel:**
   - Ir a Settings > Environment Variables
   - Agregar todas las variables del archivo `.env.example`

3. **Deploy automático:**
   - Cada push a `main` despliega automáticamente
   - Preview deployments en cada pull request

## 📝 Scripts Disponibles

```bash
npm run dev          # Iniciar servidor de desarrollo con nodemon
npm start            # Iniciar servidor de producción
npm run build        # Build para producción
npm run vercel-build # Build específico para Vercel
```

## 🧮 Cálculo de TIR

La TIR se calcula mediante el método de Newton-Raphson, buscando la tasa que iguala el valor presente de los flujos futuros con la inversión inicial.

**Fórmula:**

```
0 = Σ (Flujo_t / (1 + TIR)^t) - Inversión_Inicial
```

Donde:
- `Flujo_t` = Flujo de caja en el período t
- `TIR` = Tasa Interna de Retorno (a calcular)
- `t` = Período de tiempo

## 🔗 APIs Externas

### API BCRA

Endpoint: `https://api.bcra.gob.ar/estadisticas/v2.0`

Datos disponibles:
- CER (Coeficiente de Estabilización de Referencia)
- TAMAR (Tasa de Mercado de Referencia)
- BADLAR (Tasa de Interés de Depósitos a Plazo Fijo)

### API Feriados

Endpoint: `https://nolaborables.com.ar/api/v2/feriados/{año}`

Retorna calendario de feriados nacionales argentinos.

## 🤝 Contribuir

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

### Commits Semánticos

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Cambios de formato
- `refactor:` Refactorización de código
- `test:` Añadir tests
- `chore:` Tareas de mantenimiento

## 📄 Licencia

ISC © Mercap Software

## 👥 Autores

- **Mercap Software** - [producto-mercap](https://github.com/producto-mercap)

## 📞 Soporte

Para reportar bugs o solicitar funcionalidades, crear un issue en GitHub.

---

**Nota:** Este proyecto está en desarrollo activo. Algunas funcionalidades pueden estar incompletas o en proceso de implementación.

