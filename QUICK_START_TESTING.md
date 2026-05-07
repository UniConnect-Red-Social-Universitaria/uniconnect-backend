# 🚀 Guía Rápida - Pruebas de Integración

## Inicio Rápido (2 minutos)

### 1️⃣ Instalar dependencias
```bash
npm install
```

### 2️⃣ Ejecutar pruebas de integración
```bash
npm test
```

**En Windows (PowerShell):**
```powershell
.\scripts\run-tests.ps1 -Option all
```

**O usar script bash (git bash/WSL):**
```bash
chmod +x scripts/run-tests.sh
./scripts/run-tests.sh all
```

### 3️⃣ Ver resultados
```
Test Suites: 1 passed, 1 total
Tests:       48 passed, 48 total
Time:        12.5s
```

---

## 📊 Qué Valida Esta Suite de Pruebas

### ✅ Contrato de API (Endpoints)
- **Health Check**: `/health` y `/` están disponibles
- **Autenticación**: JWT válido, inválido, expirado
- **Autorización**: Rutas protegidas requieren token
- **Validación**: Email institucional, datos requeridos

### ✅ Códigos HTTP Correctos
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict
- `500` - Server Error

### ✅ Estructura de Respuestas
```json
{
  "success": true|false,
  "message": "descripción",
  "data": {...}
}
```

### ✅ Seguridad
- No expone contraseñas
- No expone tokens innecesarios
- CORS configurado
- Headers de seguridad

### ✅ Integridad de Datos
- Evita contactos duplicados
- Evita solicitudes duplicadas
- Valida IDs de MongoDB

---

## 📝 Estructura del Archivo de Pruebas

**Ubicación:** `tests/integration/api.integration.test.ts`

```
api.integration.test.ts
├── Health Check (2 tests)
├── Autenticación (3 tests)
├── Protección JWT (4 tests)
├── Endpoints Usuarios (7 tests)
├── Endpoints Grupos (7 tests)
├── Endpoints Eventos (7 tests)
├── Endpoints Materias (3 tests)
├── Endpoints Mensajes (2 tests)
├── Endpoints Catálogos (2 tests)
├── Manejo de Errores (3 tests)
├── Estructura de Respuestas (3 tests)
├── Protección de Datos (2 tests)
└── Validación de Entrada (3 tests)

TOTAL: 48 casos de prueba
```

---

## 🧪 Ejecutar Pruebas Específicas

### Solo una sección
```bash
# Solo tests de Usuarios
npm test -- --testNamePattern="Usuarios"

# Solo tests de Autenticación
npm test -- --testNamePattern="Autenticación"

# Solo tests de seguridad
npm test -- --testNamePattern="JWT"
```

### Solo un archivo
```bash
npm test -- tests/integration/api.integration.test.ts
```

### Un test específico
```bash
npm test -- --testNamePattern="GET /health debe retornar status 200"
```

---

## 🔄 Desarrollo Interactivo

### Modo Watch
```bash
npm run test:watch
```

**Qué hace:**
- Ejecuta tests automáticamente cuando guardas archivos
- Re-ejecuta solo tests relacionados
- Ideal para desarrollo iterativo

**Controles:**
- `a` - Correr todos los tests
- `p` - Filtrar por nombre de archivo
- `t` - Filtrar por nombre de test
- `q` - Salir

---

## 📈 Cobertura de Código

```bash
npm run test:coverage
```

**Genera:**
- Reporte en terminal
- Archivo HTML en `coverage/lcov-report/`
- Líneas no testeadas resaltadas

**Abrir reporte HTML:**
```bash
# macOS
open coverage/lcov-report/index.html

# Linux
xdg-open coverage/lcov-report/index.html

# Windows
start coverage\lcov-report\index.html
```

---

## ❌ Solucionar Problemas

### ❌ Error: "Cannot find module 'supertest'"
```bash
npm install
```

### ❌ Error: "JWT_SECRET no configurado"
Es normal en tests, se asigna automáticamente.

### ❌ Error: "timeout"
Aumentar timeout:
```bash
npm test -- --testTimeout=10000
```

### ❌ Puerto ya en uso
```bash
# Matar proceso en el puerto 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

---

## 📋 Checklist Previo a Deploy

Antes de hacer merge/deploy, ejecutar:

```bash
# 1. Todos los tests
npm test

# 2. Cobertura
npm run test:coverage

# 3. Audit de seguridad
npm audit

# 4. Build
npm run build
```

---

## 🎯 Próximos Pasos

### Mejorar el API
Basado en el reporte `AUDITORIA.md`, implementar:

1. ✅ **Proteger GET /api/usuarios**
   ```typescript
   router.get('/', verificarJWT, UsuarioController.obtenerTodos);
   ```

2. ✅ **Agregar Rate Limiting**
   ```bash
   npm install express-rate-limit
   ```

3. ✅ **CORS específico**
   ```typescript
   cors({
     origin: 'https://app.universidadx.edu.co',
     credentials: true
   })
   ```

4. ✅ **Helmet para headers de seguridad**
   ```bash
   npm install helmet
   ```

### Expandir Pruebas
- Agregar tests de performance
- Agregar tests de base de datos
- Agregar tests de autenticación OAuth

---

## 📖 Documentación Completa

- **TESTING.md** - Guía completa de testing
- **AUDITORIA.md** - Reporte de auditoría técnica
- **.env.example** - Variables de entorno requeridas

---

## 💡 Tips de Testing

### 1. Escribir tests ANTES de implementar
```typescript
// Primero escribe el test
it('debe crear usuario con email válido', async () => {
  const response = await request(app).post('/api/usuarios/registro');
  expect(response.status).toBe(201);
});

// Luego implementa
```

### 2. Usar AAA pattern
```typescript
it('debe...', async () => {
  // ARRANGE - Preparar
  const userData = { ... };
  
  // ACT - Ejecutar
  const response = await request(app).post('/api/usuarios').send(userData);
  
  // ASSERT - Validar
  expect(response.status).toBe(201);
});
```

### 3. Tests independientes
```typescript
// ✗ MALO - Test depende del anterior
it('debe crear usuario', () => { ... });
it('debe actualizar usuario', () => { ... }); // Asume usuario creado

// ✓ BUENO - Cada test es independiente
beforeEach(() => createTestUser());
it('debe crear usuario', () => { ... });
it('debe actualizar usuario', () => { ... });
```

---

## 🚀 Validación del Contrato

Cada vez que hagas cambios en endpoints, valida:

```bash
npm test -- tests/integration/api.integration.test.ts
```

Si algún test falla:
1. Lee el error
2. Verifica que es cambio intencional
3. Actualiza el test
4. O corrije la implementación

---

**¿Dudas?** Revisar `TESTING.md` para información completa.
