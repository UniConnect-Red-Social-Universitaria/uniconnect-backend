# ✅ Plan de Acción - Mejoras del API

**Basado en:** Reporte de Auditoría (AUDITORIA.md)  
**Prioridad:** Ordenado por impacto y urgencia  
**Fecha de Inicio:** 29 de Abril de 2026

---

## 🔴 CRÍTICOS - Implementar AHORA

### 1. Proteger GET /api/usuarios

**Problema:** Expone datos de estudiantes sin autenticación  
**Ubicación:** `src/modules/users/interfaces/http/usuario.routes.ts`  
**Solución:**

```typescript
// ANTES (❌ INSEGURO)
router.get('/', UsuarioController.obtenerTodos);

// DESPUÉS (✅ SEGURO)
router.get('/', verificarJWT, UsuarioController.obtenerTodos);
```

**Verificación:**
```bash
# Debe retornar 401 sin token
curl http://localhost:3000/api/usuarios

# Debe retornar 200 con token válido
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/usuarios
```

**Test:** ✅ Ya cubierto en `tests/integration/api.integration.test.ts`

---

### 2. Instalar Rate Limiting

**Problema:** API vulnerable a ataques de fuerza bruta y DDoS  
**Solución:**

```bash
npm install express-rate-limit
```

**Implementación en `src/app.ts`:**

```typescript
import rateLimit from 'express-rate-limit';

// Limiter global (15 minutos, 100 requests)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Demasiadas solicitudes, intente más tarde',
  standardHeaders: true,
  legacyHeaders: false
});

// Limiter estricto para login (15 minutos, 5 intentos)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Demasiados intentos fallidos, intente más tarde'
});

app.use(limiter);  // Aplicar globalmente

// Aplicar específicamente a login
router.post('/login', loginLimiter, UsuarioController.login);
```

**Verificación:**
```bash
npm test -- --testNamePattern="Rate"
```

---

### 3. Configurar CORS con Whitelist

**Problema:** Actualmente permite todos los orígenes (*)  
**Ubicación:** `src/app.ts`  
**Solución:**

```typescript
// ANTES (❌ INSEGURO)
app.use(cors());

// DESPUÉS (✅ SEGURO)
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim());

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600
}));
```

**Configurar `.env`:**
```
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,https://app.universidadx.edu.co
```

**Verificación:**
```bash
curl -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: POST" http://localhost:3000/api/usuarios
# Debe retornar header Access-Control-Allow-Origin
```

---

## 🟡 IMPORTANTES - Este Sprint

### 4. Instalar y Configurar Helmet

**Problema:** Headers de seguridad faltantes  
**Solución:**

```bash
npm install helmet
```

**Implementación en `src/app.ts`:**

```typescript
import helmet from 'helmet';

app.use(helmet());
app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
  }
}));
```

**Verificación:**
```bash
curl -i http://localhost:3000/health
# Debe incluir headers: X-Content-Type-Options, X-Frame-Options, etc.
```

---

### 5. Implementar Validación Centralizada

**Problema:** Validación manual en cada controller  
**Solución:** Usar Zod (recomendado para TypeScript)

```bash
npm install zod
```

**Crear `src/validation/schemas.ts`:**

```typescript
import { z } from 'zod';

export const RegistroSchema = z.object({
  correo: z.string()
    .email('Email inválido')
    .endsWith('@universidadx.edu.co', 'Email debe ser institucional')
    .toLowerCase(),
  nombre: z.string()
    .min(3, 'Nombre debe tener al menos 3 caracteres')
    .max(100, 'Nombre no puede exceder 100 caracteres'),
  password: z.string()
    .min(8, 'Contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
});

export const CrearGrupoSchema = z.object({
  nombre: z.string().min(3).max(100),
  descripcion: z.string().optional(),
  materias: z.array(z.string()).min(1, 'Debe seleccionar al menos una materia')
});
```

**Usar en controllers:**

```typescript
static async registrar(req: Request, res: Response) {
  try {
    // Validar antes de procesar
    const datosValidados = RegistroSchema.parse(req.body);
    
    const resultado = await usersUseCases.registro(datosValidados);
    
    res.status(201).json({
      success: true,
      data: resultado
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validación fallida',
        errors: error.errors
      });
    }
    handleControllerError(res, error, 'Error en registro');
  }
}
```

**Beneficios:**
- ✅ Type-safe (genera tipos automáticamente)
- ✅ Mensajes de error claros
- ✅ Documentación incluida
- ✅ Reutilizable en toda la app

---

### 6. Crear `.env` Local

**Problema:** Falta archivo .env para desarrollo  
**Solución:**

1. Copiar `.env.example` a `.env`:
```bash
cp .env.example .env
```

2. Editar `.env` con valores locales:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=mongodb://localhost:27017/uniconnect-dev
JWT_SECRET=mi-clave-secreta-local-muy-segura
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

3. Agregar `.env` a `.gitignore` (ya debería estar):
```bash
echo ".env" >> .gitignore
```

---

### 7. Aumentar Cobertura de Tests a 85%

**Actual:** ~80%  
**Target:** 85%+

**Identificar líneas no testeadas:**
```bash
npm run test:coverage
# Abrir coverage/lcov-report/index.html
```

**Agregar tests faltantes en `tests/integration/api.integration.test.ts`**

**Enfocar en:**
- Casos de error en edge cases
- Validaciones de negocio complejas
- Scenarios con datos inválidos

---

## 🟢 FUTUROS - Próximos Sprints

### 8. Documentación OpenAPI/Swagger

**Herramienta:** `swagger-ui-express` + `swagger-jsdoc`

```bash
npm install swagger-ui-express swagger-jsdoc
```

**Crear `src/swagger.ts`:**

```typescript
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UniConnect API',
      version: '1.0.0',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Dev' },
      { url: 'https://api.universidadx.edu.co', description: 'Prod' }
    ]
  },
  apis: ['./src/**/*.routes.ts']
};

export const specs = swaggerJsdoc(options);
```

**En `src/app.ts`:**

```typescript
import { specs } from './swagger';
import swaggerUI from 'swagger-ui-express';

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(specs));
```

**Documentar rutas:**

```typescript
/**
 * @swagger
 * /api/usuarios/registro:
 *   post:
 *     summary: Registrar nuevo usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               correo:
 *                 type: string
 *               nombre:
 *                 type: string
 *               password:
 *                 type: string
 */
router.post('/registro', validarCorreoInstitucional, UsuarioController.registrar);
```

**Acceder:** http://localhost:3000/api-docs

---

### 9. Logs Estructurados

**Herramienta:** Winston o Pino

```bash
npm install winston
```

**Crear `src/lib/logger-structured.ts`:**

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

---

### 10. Trazabilidad de Auditoría

**Implementar registro de acciones:**

```typescript
interface AuditLog {
  userId: string;
  action: string;
  resource: string;
  changes: Record<string, any>;
  ip: string;
  timestamp: Date;
}

// Middleware
app.use((req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    // Log de auditoría
    if (req.usuario && req.method !== 'GET') {
      console.log({
        userId: req.usuario.id,
        action: req.method,
        resource: req.path,
        status: res.statusCode,
        timestamp: new Date()
      });
    }
    return originalJson.call(this, data);
  };
  
  next();
});
```

---

## 📋 Checklist de Implementación

### Fase 1: CRÍTICO (Semana 1)

- [ ] Proteger GET /api/usuarios con JWT
  - [ ] Modificar route
  - [ ] Ejecutar tests
  - [ ] Hacer push

- [ ] Instalar Rate Limiting
  - [ ] `npm install express-rate-limit`
  - [ ] Implementar en app.ts
  - [ ] Pruebas manuales
  - [ ] Hacer push

- [ ] Configurar CORS con whitelist
  - [ ] Actualizar app.ts
  - [ ] Crear .env
  - [ ] Pruebas manuales
  - [ ] Hacer push

### Fase 2: IMPORTANTE (Semana 2)

- [ ] Instalar Helmet
  - [ ] `npm install helmet`
  - [ ] Implementar en app.ts
  - [ ] Verificar headers
  - [ ] Tests

- [ ] Validación centralizada con Zod
  - [ ] `npm install zod`
  - [ ] Crear schemas.ts
  - [ ] Refactorizar controllers
  - [ ] Tests completos

- [ ] Setup de .env local
  - [ ] Copiar .env.example
  - [ ] Configurar localmente
  - [ ] Documentar en README

- [ ] Cobertura 85%
  - [ ] `npm run test:coverage`
  - [ ] Identificar gaps
  - [ ] Escribir tests faltantes

### Fase 3: FUTURO (Próximo Sprint)

- [ ] Swagger/OpenAPI
- [ ] Logs estructurados
- [ ] Auditoría de cambios
- [ ] Tests de performance

---

## 🚀 Verificación de Progreso

Después de cada implementación, ejecutar:

```bash
# Verificar que tests pasen
npm test

# Verificar cobertura
npm run test:coverage

# Verificar seguridad
npm audit

# Verificar que build funciona
npm run build
```

---

## 📖 Documentación de Cambios

Actualizar `README.md` con:

```markdown
## Seguridad

- JWT requerido en rutas protegidas
- Rate limiting: 100 requests/15min (global), 5 intentos/15min (login)
- CORS restringido a dominios autorizados
- Headers de seguridad con Helmet
- Validación de entrada con Zod
```

---

## 🎯 Métrica de Éxito

| Item | Target | Verificación |
|------|--------|--------------|
| Tests pasando | 100% | `npm test` |
| Cobertura | 85%+ | `npm run test:coverage` |
| Security audit | 0 vulnerabilidades | `npm audit` |
| CORS restrictivo | ✅ | Headers en response |
| Rate limiting | ✅ | 429 después de límite |
| Headers security | ✅ | X-Frame-Options, etc |
| Validación Zod | ✅ | 400 para entrada inválida |

---

**Responsable:** Equipo Backend  
**Revisión:** Semanalmente  
**Reporte:** AUDITORIA.md
