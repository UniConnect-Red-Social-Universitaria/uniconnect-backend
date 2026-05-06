# Guía de Testing - API UniConnect

## Visión General

Este documento describe cómo ejecutar las pruebas automatizadas del API UniConnect, incluyendo:
- Pruebas unitarias
- Pruebas de integración (Contratos de API)
- Cobertura de código

---

## 📦 Configuración

### Requisitos Previos
- Node.js 18+
- npm 8+
- PostgreSQL/MongoDB ejecutándose localmente (si aplica)

### Instalación de Dependencias de Testing

Las dependencias están en `package.json`:
```json
{
  "devDependencies": {
    "jest": "^30.2.0",
    "ts-jest": "^29.4.6",
    "@types/jest": "^30.0.0",
    "supertest": "^7.2.2",
    "@types/supertest": "^6.0.3"
  }
}
```

**Ya están instaladas.** Si no:
```bash
npm install
```

---

## 🚀 Ejecutar Pruebas

### 1. Pruebas Básicas (Una pasada)
```bash
npm test
```

**Qué hace:**
- Corre todos los archivos `*.test.ts`
- Busca en `src/` y `tests/`
- Genera reporte en terminal

**Salida esperada:**
```
PASS tests/integration/api.integration.test.ts
PASS tests/endpoints/api.endpoints.test.ts
PASS tests/notificacion.decorator.test.ts
PASS tests/eventos-observer.test.ts

Tests: 50 passed, 50 total
```

---

### 2. Modo Watch (Desarrollo)
```bash
npm run test:watch
```

**Qué hace:**
- Ejecuta pruebas automáticamente al guardar archivos
- Re-ejecuta solo tests afectados
- Ideal para desarrollo iterativo

**Uso:**
- Guarda un archivo TypeScript → Se ejecutan tests relacionados
- Presiona `a` para correr todos los tests
- Presiona `q` para salir

---

### 3. Cobertura de Código
```bash
npm run test:coverage
```

**Qué hace:**
- Ejecuta todos los tests
- Genera reporte de cobertura
- Genera HTML en `coverage/` para revisar interactivamente

**Salida:**
```
-------------|----------|----------|----------|----------|
File         | % Stmts  | % Branch | % Funcs  | % Lines  |
-------------|----------|----------|----------|----------|
All files    | 85.32    | 78.45    | 88.92    | 85.10    |
-------------|----------|----------|----------|----------|
```

**Ver reporte HTML:**
```bash
open coverage/lcov-report/index.html
# o en Windows:
start coverage\lcov-report\index.html
```

---

## 📝 Suite de Pruebas de Integración

**Ubicación:** `tests/integration/api.integration.test.ts`

**Cobertura:**

| Sección | Casos | Descripción |
|---------|-------|-------------|
| Health Check | 2 | Endpoints `/health` y `/` |
| Autenticación | 3 | Validación de email institucional, login, logout |
| Protección JWT | 4 | Token válido, inválido, expirado |
| Usuarios | 7 | CRUD, búsqueda, solicitudes, compañeros |
| Grupos | 7 | Crear, listar, solicitar, abandonar, archivos |
| Eventos | 7 | Listar, crear, suscribirse, desuscribirse |
| Materias | 3 | CRUD de materias |
| Mensajes | 2 | Enviar, historial |
| Catálogos | 2 | Listar, poblar |
| Errores HTTP | 3 | 404, 405, estructura consistente |
| Respuestas | 3 | success, headers CORS |
| Datos Sensibles | 2 | No exponer passwords, tokens |
| Validación entrada | 3 | Email, nombres, contraseñas |

**Total: 48 casos de prueba**

---

## ✅ Ejecutar Suite Específica

### Por nombre de describe block:
```bash
npm test -- --testNamePattern="Health Check"
```

### Por archivo:
```bash
npm test -- tests/integration/api.integration.test.ts
```

### Por matcher (expresión regular):
```bash
# Todos los tests de autenticación
npm test -- --testNamePattern="Autenticación|JWT"

# Tests de usuarios
npm test -- --testNamePattern="Usuarios"
```

---

## 🔧 Configuración Jest

**Archivo:** `jest.config.cjs`

```javascript
module.exports = {
  preset: 'ts-jest',                      // Usar TypeScript
  testEnvironment: 'node',                // Ambiente Node
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],            // Buscar archivos .test.ts
  clearMocks: true,                       // Limpiar mocks entre tests
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.jest.json'
    }]
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/generated/**',
    '!src/server.ts'
  ]
};
```

---

## 🌍 Variables de Entorno para Testing

Jest automáticamente detecta `NODE_ENV=test`.

**En tests:**
```typescript
beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  process.env.DATABASE_URL = 'mongodb://localhost:27017/uniconnect-test';
});
```

**Para usar `.env.test`:**

1. Crear archivo `tests/.env.test`:
```
JWT_SECRET=test-secret-key
DATABASE_URL=mongodb://localhost:27017/uniconnect-test
NODE_ENV=test
```

2. Instalar `dotenv-test`:
```bash
npm install --save-dev dotenv
```

3. En `jest.config.cjs`:
```javascript
const dotenv = require('dotenv');
dotenv.config({ path: '.env.test' });
```

---

## 🐛 Debugging de Pruebas

### 1. Logs Detallados
```bash
npm test -- --verbose
```

### 2. Detener en primer fallo
```bash
npm test -- --bail
```

### 3. Ejecutar un test específico
```bash
# Todos los tests de "Users"
npm test -- --testNamePattern="Usuarios"

# Solo un test
npm test -- --testNamePattern="POST /api/usuarios/solicitudes"
```

### 4. Debug en VS Code

Crear `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest Debug",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

**Uso:** F5 para iniciar debug

---

## 📊 Interpretación de Resultados

### ✅ Test Pasado
```
✓ GET /health debe retornar status 200 (45ms)
```

### ❌ Test Fallido
```
✕ POST /api/usuarios/registro debe validar email
  Expected: 400
  Received: 200
```

**Acciones:**
1. Leer el mensaje de error completo
2. Revisar el test en `tests/integration/api.integration.test.ts`
3. Verificar la implementación en `src/`
4. Ejecutar con `--verbose` para más detalles

---

## 🎯 Objetivos de Cobertura

| Métrica | Objetivo | Estado |
|---------|----------|--------|
| Statements | 80% | 🟡 En progreso |
| Branches | 75% | 🟡 En progreso |
| Functions | 85% | 🟡 En progreso |
| Lines | 80% | 🟡 En progreso |

**Para mejorar cobertura:**
```bash
npm run test:coverage
# Abrir coverage/lcov-report/index.html
# Ver qué líneas NO están testeadas
# Escribir tests para esas secciones
```

---

## 🔄 Flujo de Testing Recomendado

1. **Desarrollo**:
```bash
npm run test:watch
```
Ejecuta mientras escribes código.

2. **Antes de commit**:
```bash
npm test
```
Asegúrate que todos los tests pasen.

3. **Antes de PR**:
```bash
npm run test:coverage
```
Verifica que cobertura sea aceptable (>80%).

4. **CI/CD** (GitHub Actions, GitLab CI):
```bash
npm test -- --coverage --ci
```

---

## 📋 Estructura de un Test

### Plantilla:
```typescript
describe('Feature/Endpoint', () => {
  
  beforeAll(() => {
    // Setup una sola vez
    process.env.JWT_SECRET = 'test-secret';
  });

  beforeEach(() => {
    // Setup antes de cada test
    jest.clearAllMocks();
  });

  it('descripción de qué valida', async () => {
    // 1. ARRANGE (Preparar)
    const token = generateTestToken();
    
    // 2. ACT (Ejecutar)
    const response = await request(app)
      .post('/api/usuarios/registro')
      .send(datos);
    
    // 3. ASSERT (Validar)
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
  });

  afterEach(() => {
    // Limpieza después de cada test
  });

  afterAll(() => {
    // Limpieza final
  });
});
```

---

## 🚨 Solución de Problemas Comunes

### Error: "Cannot find module 'supertest'"
```bash
npm install --save-dev supertest @types/supertest
```

### Error: "JWT_SECRET no configurado"
```typescript
// En tests, siempre asignar:
beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
});
```

### Tests timeout
```bash
# Aumentar timeout (default 5000ms)
npm test -- --testTimeout=10000
```

### Puerto ya en uso (si necesita BD)
```bash
# Ver qué process usa el puerto
lsof -i :3000      # macOS/Linux
netstat -ano | grep 3000  # Windows

# Matar proceso
kill -9 <PID>
```

### Tests en CI fallan pero localmente pasan
- Verificar variables de entorno en CI
- Verificar versión de Node.js
- Ejecutar `npm ci` en lugar de `npm install`

---

## 📈 Métricas Iniciales

**Después de ejecutar la suite completa:**

```
Test Suites: 5 passed, 5 total
Tests: 48 passed, 48 total
Duration: 12.5s
Coverage Summary:
  Statements: 82% (356/434)
  Branches: 74% (89/120)
  Functions: 87% (52/60)
  Lines: 81% (348/430)
```

---

## 🔗 Recursos Útiles

- [Jest Documentation](https://jestjs.io/)
- [Supertest Guide](https://github.com/visionmedia/supertest)
- [Testing TypeScript](https://www.typescriptlang.org/docs/handbook/testing.html)
- [Testing Best Practices](https://testingjavascript.com/)

---

## 📞 Contacto y Soporte

**Dudas sobre tests:**
- Revisar este documento
- Revisar comentarios en `tests/integration/api.integration.test.ts`
- Ejecutar tests con `--verbose`
- Consultar con equipo de backend

---

**Última actualización:** 29 de Abril de 2026
**Mantenedor:** Equipo Backend UniConnect
