# 📊 BACKEND SCRUM - DOCUMENTACIÓN COMPLETA

## Descripción General

Se ha implementado un sistema backend completo para métricas Scrum, velocidad histórica, burn-down charts, cumplimiento de criterios de aceptación, trazabilidad y reportes en una aplicación universitaria.

### Stack Utilizado
- **Framework**: Express.js (TypeScript)
- **BD**: MongoDB con Prisma ORM
- **Autenticación**: JWT
- **Arquitectura**: Clean Architecture
- **API Base**: `/api/scrum`

---

## 📁 Estructura de Carpetas

```
src/modules/scrum/
├── domain/
│   └── scrum-contracts.ts           # Interfaces, DTOs, tipos
├── application/
│   ├── sprint.use-cases.ts          # Gestión de sprints
│   ├── historia-usuario.use-cases.ts # Gestión HUs
│   ├── criterio-aceptacion.use-cases.ts  # Criterios
│   ├── metricas.use-cases.ts        # Cálculos de métricas
│   ├── trazabilidad.use-cases.ts    # Trazabilidad
│   ├── retrospectiva.use-cases.ts   # Retrospectivas
│   └── impedimento.use-cases.ts     # Impedimentos
├── infrastructure/
│   ├── prisma-sprint.repository.ts
│   ├── prisma-historia-usuario.repository.ts
│   ├── prisma-criterio-aceptacion.repository.ts
│   ├── prisma-evaluacion-criterio.repository.ts
│   ├── prisma-trazabilidad.repository.ts
│   ├── prisma-velocidad.repository.ts
│   ├── prisma-burndown.repository.ts
│   ├── prisma-retrospectiva.repository.ts
│   ├── prisma-impedimento.repository.ts
│   ├── export-csv.service.ts        # Exportación CSV
│   ├── export-pdf.service.ts        # Exportación PDF
│   └── github-integration.service.ts # GitHub API
└── interfaces/http/
    ├── sprint.controller.ts
    ├── historia-usuario.controller.ts
    ├── criterio-aceptacion.controller.ts
    ├── metricas.controller.ts
    ├── trazabilidad.controller.ts
    ├── retrospectiva.controller.ts
    ├── impedimento.controller.ts
    ├── exportacion.controller.ts
    └── scrum.routes.ts              # Todas las rutas
```

---

## 🔄 ENDPOINTS DISPONIBLES

### 1️⃣ SPRINTS

#### Crear Sprint
```
POST /api/scrum/sprints
Headers: Authorization: Bearer {token}
Body: {
  "numero": 1,
  "nombre": "Sprint 1 - Autenticación",
  "descripcion": "Sprint inicial del proyecto",
  "velocidadPlaneada": 40
}
Response: { success: true, data: { id, numero, nombre, ... } }
```

#### Listar Sprints
```
GET /api/scrum/sprints?activos=true
Headers: Authorization: Bearer {token}
Response: { success: true, data: [ { Sprint[] } ] }
```

#### Obtener Sprint
```
GET /api/scrum/sprints/:sprintId
Headers: Authorization: Bearer {token}
Response: { success: true, data: { Sprint } }
```

#### Actualizar Sprint
```
PUT /api/scrum/sprints/:sprintId
Body: { nombre?, descripcion?, estado?, velocidadPlaneada? }
Response: { success: true, data: { Sprint actualizado } }
```

#### Iniciar Sprint
```
POST /api/scrum/sprints/:sprintId/iniciar
Response: { success: true, data: { Sprint con estado = ACTIVO } }
```

#### Cerrar Sprint
```
POST /api/scrum/sprints/:sprintId/cerrar
Response: { success: true, data: { Sprint con estado = COMPLETADO } }
```

---

### 2️⃣ HISTORIAS DE USUARIO

#### Crear HU
```
POST /api/scrum/sprints/:sprintId/historias
Body: {
  "codigo": "HU-001",
  "titulo": "Implementar login",
  "descripcion": "Los usuarios deben poder iniciar sesión",
  "storyPoints": 8,
  "prioridad": 1
}
Response: { success: true, data: { HistoriaUsuario } }
```

#### Listar HUs del Sprint
```
GET /api/scrum/sprints/:sprintId/historias?estado=EN_PROGRESO
Estados: PENDIENTE, EN_PROGRESO, BLOQUEADA, COMPLETADA, CANCELADA
Response: { success: true, data: [ { HistoriaUsuario[] } ] }
```

#### Obtener HU
```
GET /api/scrum/historias/:huId
Response: { success: true, data: { HistoriaUsuario } }
```

#### Actualizar HU
```
PUT /api/scrum/historias/:huId
Body: { titulo?, descripcion?, storyPoints?, estado?, prioridad? }
Response: { success: true, data: { HistoriaUsuario actualizado } }
```

#### Cambiar Estado
```
PUT /api/scrum/historias/:huId/estado
Body: { estado: "COMPLETADA" }
Response: { success: true, data: { HistoriaUsuario } }
```

#### Asignar HU
```
PUT /api/scrum/historias/:huId/asignar
Body: { usuarioId: "user-id" }  // null para desasignar
Response: { success: true, data: { HistoriaUsuario } }
```

---

### 3️⃣ CRITERIOS DE ACEPTACIÓN

#### Crear Criterio
```
POST /api/scrum/historias/:huId/criterios
Body: {
  "numero": 1,
  "descripcion": "El formulario debe validar email"
}
Response: { success: true, data: { CriterioAceptacion } }
```

#### Listar Criterios de HU
```
GET /api/scrum/historias/:huId/criterios
Response: { success: true, data: [ { CriterioAceptacion[] } ] }
```

#### Evaluar Criterio
```
POST /api/scrum/criterios/:criterioId/evaluar
Body: {
  "cumplido": true,
  "observaciones": "Validación funciona correctamente"
}
Response: { success: true, data: { EvaluacionCriterio } }
```

#### Obtener Historial de Evaluaciones
```
GET /api/scrum/criterios/:criterioId/historial
Response: { success: true, data: [ { EvaluacionCriterio[] } ] }
```

#### Calcular Cumplimiento de HU
```
GET /api/scrum/historias/:huId/cumplimiento
Response: { 
  success: true, 
  data: { 
    cumplidos: 3, 
    total: 4, 
    porcentaje: 75 
  } 
}
```

---

### 4️⃣ MÉTRICAS

#### Calcular Métricas del Sprint
```
GET /api/scrum/sprints/:sprintId/metricas
Response: {
  success: true,
  data: {
    sprintId,
    numero,
    velocidadPlaneada: 40,
    velocidadReal: 32,
    porcentajeCumplimiento: 80,
    huTotales: 5,
    huCompletadas: 4,
    huEnProgreso: 1,
    huBloqueadas: 0,
    promedio3Sprints: 35
  }
}
```

#### Calcular Burn-Down Chart
```
GET /api/scrum/sprints/:sprintId/burndown
Response: {
  success: true,
  data: {
    sprintId,
    totalSpPlaneados: 40,
    spCompletados: 32,
    proyeccionFinal: 5,
    dias: [
      {
        dia: 1,
        fecha: "2026-05-20T10:00:00Z",
        spRestantesReal: 40,
        spRestantesIdeal: 40,
        huCompletadas: 0
      },
      {
        dia: 2,
        fecha: "2026-05-21T10:00:00Z",
        spRestantesReal: 35,
        spRestantesIdeal: 33,
        huCompletadas: 1
      }
      // ...
    ]
  }
}
```

#### Cumplimiento Global de Sprint
```
GET /api/scrum/sprints/:sprintId/cumplimiento
Response: {
  success: true,
  data: {
    sprintId,
    criteriosTotales: 12,
    criteriosCumplidos: 10,
    porcentajeCumplimiento: 83.33
  }
}
```

#### Velocidad Histórica
```
GET /api/scrum/metricas/velocidad-historica
Response: {
  success: true,
  data: [
    {
      sprintId: "sp1",
      velocidadPlaneada: 30,
      velocidadReal: 28,
      porcentajeCumplimiento: 93.33
    },
    // ... últimos 10 sprints
  ]
}
```

---

### 5️⃣ TRAZABILIDAD

#### Linkear HU con Commit/PR
```
POST /api/scrum/trazabilidad
Body: {
  "huId": "hu-001",
  "repositorio": "BACKEND",
  "nombreRepositorio": "uniconnect-backend",
  "shaCommit": "abc123def456",
  "urlCommit": "https://github.com/...",
  "mensajeCommit": "HU-001 Implementar autenticación",
  "autorCommit": "John Doe",
  "numeroPR": 123,
  "urlPR": "https://github.com/...",
  "estadoPR": "MERGED"
}
Response: { success: true, data: { TrazabilidadHU } }
```

#### Obtener Trazabilidad de HU
```
GET /api/scrum/historias/:huId/trazabilidad
Response: {
  success: true,
  data: {
    huId,
    codigo: "HU-001",
    titulo: "Implementar autenticación",
    trazas: [
      {
        id,
        repositorio: "BACKEND",
        nombreRepositorio: "uniconnect-backend",
        tipoArtefacto: "COMMIT",
        enlace: "https://github.com/...",
        referencia: "abc123d",
        extraido: "2026-05-20T10:00:00Z"
      },
      {
        tipoArtefacto: "PR",
        referencia: "#123",
        // ...
      }
    ]
  }
}
```

#### Listar Trazabilidades por Repositorio
```
GET /api/scrum/trazabilidad/BACKEND
Response: {
  success: true,
  data: [
    {
      id,
      huId,
      repositorio: "BACKEND",
      nombreRepositorio: "uniconnect-backend",
      referencia: "abc123d",
      enlace: "https://github.com/...",
      extraido: "2026-05-20T10:00:00Z"
    }
    // ...
  ]
}
```

#### Buscar HU por Commit
```
GET /api/scrum/trazabilidad/buscar?sha=abc123def456&repositorio=BACKEND
Response: {
  success: true,
  data: { TrazabilidadHU }
}
```

---

### 6️⃣ RETROSPECTIVAS

#### Crear Retrospectiva
```
POST /api/scrum/sprints/:sprintId/retrospectiva
Body: {
  "fechaRetrospectiva": "2026-05-24T14:00:00Z",
  "comentariosGenerales": "Sprint productivo",
  "acuerdos": [
    {
      "descripcion": "Mejorar documentación",
      "responsable": "user-id"
    }
  ],
  "impedimentos": [
    {
      "descripcion": "API externa lenta",
      "impacto": "Alto",
      "responsable": "user-id"
    }
  ]
}
Response: { success: true, data: { Retrospectiva } }
```

#### Obtener Retrospectiva
```
GET /api/scrum/sprints/:sprintId/retrospectiva
Response: {
  success: true,
  data: {
    id,
    sprintId,
    fechaRetrospectiva,
    comentariosGenerales,
    acuerdos: [ { id, descripcion, responsable, estado } ],
    impedimentos: [ { id, descripcion, impacto, responsable, estado } ]
  }
}
```

#### Agregar Acuerdo
```
POST /api/scrum/retrospectivas/:retroId/acuerdos
Body: {
  "descripcion": "Hacer daily standups más cortos",
  "responsable": "user-id"
}
Response: { success: true, data: { AccuerdoRetro } }
```

#### Agregar Impedimento
```
POST /api/scrum/retrospectivas/:retroId/impedimentos
Body: {
  "descripcion": "Falta de sincronización con backend",
  "impacto": "Medio",
  "responsable": "user-id"
}
Response: { success: true, data: { ImpedimentoRetro } }
```

---

### 7️⃣ IMPEDIMENTOS

#### Crear Impedimento
```
POST /api/scrum/impedimentos
Body: {
  "descripcion": "Servidor de BD caído",
  "estado": "ABIERTO",
  "responsable": "user-id",
  "sprintId": "sprint-1"
}
Response: { success: true, data: { Impedimento } }
```

#### Obtener Impedimento
```
GET /api/scrum/impedimentos/:impedimentoId
Response: { success: true, data: { Impedimento } }
```

#### Listar Impedimentos Abiertos
```
GET /api/scrum/impedimentos/abiertos
Response: { success: true, data: [ { Impedimento[] } ] }
```

#### Listar Impedimentos Críticos
```
GET /api/scrum/impedimentos/criticos
Response: { success: true, data: [ { Impedimento[] } ] }
```

#### Listar Impedimentos del Sprint
```
GET /api/scrum/sprints/:sprintId/impedimentos
Response: { success: true, data: [ { Impedimento[] } ] }
```

#### Actualizar Estado
```
PUT /api/scrum/impedimentos/:impedimentoId/estado
Body: { estado: "RESUELTO" }
Estados: ABIERTO, EN_PROGRESO, RESUELTO, CERRADO
Response: { success: true, data: { Impedimento } }
```

#### Detectar Automáticamente Impedimentos Críticos
```
POST /api/scrum/impedimentos/detectar-criticos
Response: {
  success: true,
  message: "2 impedimento(s) marcado(s) como crítico(s)",
  data: {
    marcados: 2,
    total: 5
  }
}
```

---

### 8️⃣ EXPORTACIÓN

#### Exportar Historias a CSV
```
GET /api/scrum/sprints/:sprintId/exportar/historias.csv
Response: Archivo CSV descargado
Contenido: ID,Código,Título,Story Points,Estado,Prioridad,Asignado A
```

#### Exportar Criterios a CSV
```
GET /api/scrum/sprints/:sprintId/exportar/criterios.csv
Response: Archivo CSV descargado
Contenido: HU,Número,Descripción Criterio,Cumplido,Fecha Evaluación,Observaciones
```

#### Exportar Impedimentos a CSV
```
GET /api/scrum/sprints/:sprintId/exportar/impedimentos.csv
Response: Archivo CSV descargado
Contenido: ID,Descripción,Estado,Es Crítico,Días Abierto,Fecha Apertura,Responsable
```

#### Exportar Reporte PDF
```
GET /api/scrum/sprints/:sprintId/exportar/reporte.pdf?trazabilidad=true&retrospectiva=true&impedimentos=true
Response: Archivo PDF descargado con métricas completas
```

---

## 🧪 CÓMO PROBAR LOS ENDPOINTS

### 1. Crear Sprint
```bash
curl -X POST http://localhost:3000/api/scrum/sprints \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "numero": 1,
    "nombre": "Sprint 1",
    "velocidadPlaneada": 40
  }'
```

### 2. Crear Historia de Usuario
```bash
curl -X POST http://localhost:3000/api/scrum/sprints/SPRINT_ID/historias \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "HU-001",
    "titulo": "Feature X",
    "descripcion": "Descripción de Feature X",
    "storyPoints": 8
  }'
```

### 3. Crear Criterio de Aceptación
```bash
curl -X POST http://localhost:3000/api/scrum/historias/HU_ID/criterios \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "numero": 1,
    "descripcion": "Criterio 1"
  }'
```

### 4. Calcular Métricas
```bash
curl -X GET http://localhost:3000/api/scrum/sprints/SPRINT_ID/metricas \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📋 MODELOS DE DATOS

### Sprint
```typescript
{
  id: string;
  numero: number;
  nombre: string;
  descripcion?: string;
  estado: 'PLANEACION' | 'ACTIVO' | 'COMPLETADO' | 'CANCELADO';
  fechaInicio?: Date;
  fechaFin?: Date;
  velocidadPlaneada: number;
  velocidadReal?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### HistoriaUsuario
```typescript
{
  id: string;
  codigo: string;  // HU-001, HU-002, etc
  titulo: string;
  descripcion: string;
  storyPoints: number;
  estado: 'PENDIENTE' | 'EN_PROGRESO' | 'BLOQUEADA' | 'COMPLETADA' | 'CANCELADA';
  prioridad: number;
  asignadoA?: string;
  sprintId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### CriterioAceptacion
```typescript
{
  id: string;
  numero: number;  // 1, 2, 3...
  descripcion: string;
  huId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### TrazabilidadHU
```typescript
{
  id: string;
  huId: string;
  repositorio: 'BACKEND' | 'FRONTEND';
  nombreRepositorio: string;
  shaCommit?: string;
  urlCommit?: string;
  mensajeCommit?: string;
  autorCommit?: string;
  numeroPR?: number;
  urlPR?: string;
  estadoPR?: string;
  numeroDespliegue?: number;
  urlDespliegue?: string;
  estadoDespliegue?: string;
  extraido?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Impedimento
```typescript
{
  id: string;
  sprintId?: string;
  descripcion: string;
  estado: 'ABIERTO' | 'EN_PROGRESO' | 'RESUELTO' | 'CERRADO';
  esCritico: boolean;
  diasAbierto: number;
  responsable?: string;
  fechaApertura: Date;
  fechaResolucion?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🔐 Autenticación

Todos los endpoints requieren header:
```
Authorization: Bearer {JWT_TOKEN}
```

El token se obtiene del endpoint de login de usuarios:
```
POST /api/usuarios/login
```

---

## 📝 Notas Importantes

1. **Integración GitHub**: Está lista para integración. Se debe configurar la variable de entorno `GITHUB_TOKEN` en `.env`

2. **Exportación PDF**: El servicio está preparado. Para PDF real en producción, se recomienda usar `pdfkit` o `puppeteer`

3. **Burn-Down**: Se calcula automáticamente a partir de los datos diarios

4. **Impedimentos Críticos**: Se detectan automáticamente si están abiertos > 3 días hábiles

5. **Velocidad Histórica**: Se guarda al completar cada sprint

6. **Base de Datos**: Todas las entidades están en MongoDB con Prisma

---

## 🛠️ Variables de Entorno Necesarias

```env
DATABASE_URL=mongodb://...
JWT_SECRET=...
GITHUB_TOKEN=your_github_token_here
NODE_ENV=production
```

---

## ✅ Validaciones Implementadas

- Códigos de HU únicos por sprint
- Story points > 0
- Criterio de aceptación numerado secuencialmente
- Estados válidos según tipo de entidad
- Automático: detección de impedimentos críticos
- Automático: cálculo de velocidad
- Automático: cálculo de porcentaje de cumplimiento

