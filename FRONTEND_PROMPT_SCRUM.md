# 🎨 PROMPT PARA IMPLEMENTACIÓN FRONTEND - TABLERO SCRUM

## CONTEXTO GENERAL

Se ha completado la implementación **100% del backend** para un sistema integral de métricas Scrum, velocidad histórica, burn-down charts, cumplimiento de criterios de aceptación, trazabilidad y reportes.

El frontend debe consumir todos estos endpoints y proporcionar una interfaz intuitiva para que Product Owners, Scrum Masters y Desarrolladores gestionen los sprints y visualicen métricas en tiempo real.

---

## 🎯 FUNCIONALIDADES PRINCIPALES A IMPLEMENTAR

### 1. **GESTIÓN DE SPRINTS** (CRUD)
- Crear nuevo sprint (número, nombre, descripción, velocidad planeada)
- Listar todos los sprints (con filtro activos/completados)
- Ver detalles de un sprint específico
- Actualizar datos de sprint
- Iniciar sprint (cambiar estado a ACTIVO)
- Cerrar sprint (cambiar estado a COMPLETADO)

### 2. **GESTIÓN DE HISTORIAS DE USUARIO**
- Crear HU (código, título, descripción, story points, prioridad)
- Listar HUs del sprint (con filtro por estado: PENDIENTE, EN_PROGRESO, BLOQUEADA, COMPLETADA, CANCELADA)
- Cambiar estado de HU (drag-drop o select)
- Asignar HU a desarrollador
- Actualizar datos de HU
- Vista kanban con HUs organizadas por estado

### 3. **CRITERIOS DE ACEPTACIÓN**
- Crear criterios numerados (1, 2, 3...) para cada HU
- Listar criterios de una HU
- Marcar criterios como cumplidos/incumplidos
- Ver historial de evaluaciones de cada criterio
- Mostrar % de cumplimiento por HU

### 4. **DASHBOARD CON MÉTRICAS**
- **Resumen General**: Velocidad planeada vs real, % cumplimiento
- **Estado de HUs**: Cantidad por estado (pie chart, barras)
- **Cumplimiento de Criterios**: % global del sprint
- **Burn-Down Chart**: Línea de tendencia real vs ideal
- **Velocidad Histórica**: Gráfico de líneas con últimos 10 sprints
- **Impedimentos Críticos**: Listado destacado

### 5. **TRAZABILIDAD CON GITHUB**
- Listar commits/PRs/despliegues relacionados a cada HU
- Linkear manualmente HU con commit SHA y PR
- Mostrar estado de PR (OPEN, MERGED, CLOSED)
- Mostrar URL a repositorio GitHub
- Búsqueda reversa: encontrar HU por commit SHA

### 6. **RETROSPECTIVA**
- Crear retrospectiva para sprint finalizado
- Agregar acuerdos (descripción, responsable, estado: PENDIENTE/EN_PROGRESO/COMPLETADO)
- Agregar impedimentos (descripción, impacto: Alto/Medio/Bajo, responsable, estado)
- Ver retrospectiva completa con acuerdos e impedimentos

### 7. **GESTIÓN DE IMPEDIMENTOS**
- Crear impedimento general (fuera de retrospectiva)
- Listar impedimentos abiertos (filtrable)
- Listar impedimentos críticos (detectados automáticamente > 3 días)
- Cambiar estado de impedimento (ABIERTO → EN_PROGRESO → RESUELTO → CERRADO)
- Ver impedimentos por sprint
- Badge visual para impedimentos críticos

### 8. **EXPORTACIÓN**
- Descargar Historias en CSV
- Descargar Criterios en CSV
- Descargar Impedimentos en CSV
- Descargar Reporte Completo en PDF (con opciones: incluir trazabilidad, retrospectiva, impedimentos)

---

## 🌐 ENDPOINTS BACKEND (REFERENCIA)

### Base URL
```
http://localhost:3000/api/scrum
Header: Authorization: Bearer {JWT_TOKEN}
```

### Sprints
```
POST   /sprints                    # Crear
GET    /sprints?activos=true       # Listar
GET    /sprints/:sprintId          # Obtener
PUT    /sprints/:sprintId          # Actualizar
POST   /sprints/:sprintId/iniciar  # Iniciar
POST   /sprints/:sprintId/cerrar   # Cerrar
```

### Historias de Usuario
```
POST   /sprints/:sprintId/historias           # Crear
GET    /sprints/:sprintId/historias?estado=.. # Listar
GET    /historias/:huId                       # Obtener
PUT    /historias/:huId                       # Actualizar
PUT    /historias/:huId/estado                # Cambiar estado
PUT    /historias/:huId/asignar               # Asignar usuario
```

### Criterios
```
POST   /historias/:huId/criterios                  # Crear
GET    /historias/:huId/criterios                  # Listar
POST   /criterios/:criterioId/evaluar              # Evaluar
GET    /criterios/:criterioId/historial            # Historial
GET    /historias/:huId/cumplimiento               # % cumplimiento
```

### Métricas
```
GET    /sprints/:sprintId/metricas        # Métricas sprint
GET    /sprints/:sprintId/burndown        # Burn-down chart
GET    /sprints/:sprintId/cumplimiento    # Cumplimiento criterios
GET    /metricas/velocidad-historica      # Histórico últimos 10
```

### Trazabilidad
```
POST   /trazabilidad                           # Linkear
GET    /historias/:huId/trazabilidad           # Obtener de HU
GET    /trazabilidad/:repositorio              # Listar por repo
GET    /trazabilidad/buscar?sha=..&repo=..     # Buscar por commit
```

### Retrospectiva
```
POST   /sprints/:sprintId/retrospectiva                   # Crear
GET    /sprints/:sprintId/retrospectiva                   # Obtener
POST   /retrospectivas/:retroId/acuerdos                  # Agregar acuerdo
POST   /retrospectivas/:retroId/impedimentos              # Agregar impedimento
```

### Impedimentos
```
POST   /impedimentos                       # Crear
GET    /impedimentos/:impedimentoId        # Obtener
GET    /impedimentos/abiertos              # Listar abiertos
GET    /impedimentos/criticos              # Listar críticos
GET    /sprints/:sprintId/impedimentos     # Listar por sprint
PUT    /impedimentos/:impedimentoId/estado # Actualizar estado
POST   /impedimentos/detectar-criticos     # Detectar automáticamente
```

### Exportación
```
GET    /sprints/:sprintId/exportar/historias.csv      # CSV HUs
GET    /sprints/:sprintId/exportar/criterios.csv      # CSV Criterios
GET    /sprints/:sprintId/exportar/impedimentos.csv   # CSV Impedimentos
GET    /sprints/:sprintId/exportar/reporte.pdf        # PDF reporte
```

---

## 🎨 DISEÑO DE INTERFAZ RECOMENDADO

### Layout Principal
```
┌─────────────────────────────────────────────────────────────┐
│ UniConnect - Tablero Scrum                                  │
├─────────────────────────────────────────────────────────────┤
│ [Sprints] [Métricas] [Trazabilidad] [Retrospectiva]        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SPRINT ACTUAL: Sprint 1 - Autenticación                   │
│  Estado: ACTIVO | Dias: 3/10 | Velocidad: 32/40 SP        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ MÉTRICAS                                             │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Velocidad: 32/40 (80%) │ Criterios: 10/12 (83%)     │   │
│  │ HU Completadas: 4/5    │ Impedimentos: 2 (1 crítico) │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ BURN-DOWN CHART            │ VELOCIDAD HISTÓRICA     │   │
│  │ [Gráfico líneas]           │ [Gráfico barras]        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ KANBAN - HISTORIAS DE USUARIO                        │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ PENDIENTE | EN_PROGRESO | BLOQUEADA | COMPLETADA    │   │
│  │                                                      │   │
│  │ ┌─────────┐  ┌─────────┐                             │   │
│  │ │ HU-001  │  │ HU-002  │  ...                        │   │
│  │ │ 8 SP    │  │ 5 SP    │                             │   │
│  │ └─────────┘  └─────────┘                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Secciones Clave

#### 1. Selector de Sprint
```
[Dropdown: Sprint 1 ▼] [Listar todos] [+ Crear]
Estado: ACTIVO | Inicia: 20/5 | Finaliza: 24/5 | Velocidad: 40 SP
```

#### 2. Tarjeta de HU en Kanban
```
┌─────────────────────────┐
│ HU-001                  │ ← Click para detalles
├─────────────────────────┤
│ Implementar login       │
│ 8 Story Points          │
│ Asignado: Juan Pérez    │
│ ⚠️ BLOQUEADA            │ ← Estado con color
├─────────────────────────┤
│ 2/3 criterios ✓         │ ← Progress bar
│ [Commits: 2] [PR: 1]    │ ← Trazabilidad rápida
└─────────────────────────┘
```

#### 3. Modal de Criterios
```
CRITERIOS DE ACEPTACIÓN - HU-001
─────────────────────────────────
✓ 1. El formulario valida email
✓ 2. La contraseña tiene >= 8 caracteres
✗ 3. Se muestra error si usuario existe

Última evaluación: 20/5/2026 10:30
```

#### 4. Tabla de Trazabilidad
```
TRAZABILIDAD - HU-001
─────────────────────────────────────────────────────────────
TIPO      REPOSITORIO    REFERENCIA    ENLACE              FECHA
Commit    Backend        abc123d       → github.com/...    20/5
PR        Backend        #123 (MERGED) → github.com/...    19/5
Deploy    Backend        Deploy #45    → github.com/...    20/5
```

#### 5. Panel de Impedimentos Críticos
```
⚠️ IMPEDIMENTOS CRÍTICOS (1)
────────────────────────────
[🔴] Servidor BD caído
     Estado: EN_PROGRESO | Abierto: 4 días
     Responsable: Admin Team
     [Resolver] [Cambiar]
```

---

## 📊 GRÁFICOS RECOMENDADOS

1. **Burn-Down Chart**: Chart.js o Recharts
   - Eje X: Días del sprint (1-10)
   - Eje Y: Story Points restantes
   - 2 líneas: Real vs Ideal

2. **Pie Chart**: Estado de HUs
   - Completadas (verde), En Progreso (azul), Bloqueadas (rojo), Pendientes (gris)

3. **Bar Chart**: Velocidad histórica
   - Últimos 10 sprints con línea de promedio

4. **Kanban**: Drag-drop entre columnas
   - Actualiza estado de HU automáticamente

---

## 🔑 FUNCIONALIDADES AVANZADAS

### 1. Detección Automática de Cambios
- Polling cada 30s o WebSocket para actualizaciones en tiempo real
- Cambio automático a estado "CRÍTICO" si impedimento > 3 días

### 2. Permisos (Recomendado)
- Scrum Master: CRUD completo
- Product Owner: Ver + crear/editar HUs
- Desarrollador: Ver métricas + cambiar estado de asignadas

### 3. Notificaciones
- Impedimento crítico detectado
- HU completada por compañero
- Sprint finalizado próximamente

### 4. Filtros Avanzados
- Por estado, por asignado, por prioridad
- Por fecha de creación, por sprint
- Búsqueda por código o título

---

## 📱 RESPONSIVE DESIGN

- **Desktop (1920px)**: Kanban de 4 columnas + gráficos lado a lado
- **Tablet (768px)**: Kanban de 2 columnas + gráficos apilados
- **Mobile (375px)**: Kanban scroll horizontal + métricas resumen

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Autenticación con JWT token
- [ ] Selector y CRUD de Sprints
- [ ] Gestión de Historias de Usuario (CRUD + estados)
- [ ] Vista Kanban con drag-drop
- [ ] Formulario de Criterios de Aceptación
- [ ] Evaluación de criterios
- [ ] Cálculo y visualización de % cumplimiento
- [ ] Dashboard con métricas clave
- [ ] Burn-Down Chart
- [ ] Gráfico de Velocidad Histórica
- [ ] Trazabilidad: linkear/ver commits y PRs
- [ ] Retrospectiva: crear acuerdos e impedimentos
- [ ] Panel de Impedimentos con detección de críticos
- [ ] Exportación CSV (historias, criterios, impedimentos)
- [ ] Exportación PDF (reporte completo)
- [ ] Notificaciones en tiempo real (opcional)
- [ ] Filtros avanzados
- [ ] Responsive en mobile
- [ ] Dark mode (opcional)
- [ ] Tests unitarios

---

## 🚀 STACK RECOMENDADO

- **Framework**: React 18+ o Next.js 14+
- **UI**: Material-UI, Shadcn/ui, o Tailwind CSS
- **Gráficos**: Recharts o Chart.js
- **Drag-drop**: React Beautiful DND o dnd-kit
- **Gestión de estado**: TanStack Query (React Query) o Zustand
- **HTTP Client**: Axios o Fetch API
- **Formularios**: React Hook Form + Zod

---

## 📚 TIPOS/INTERFACES TYPESCRIPT

```typescript
// Sprint
interface Sprint {
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

// Historia Usuario
interface HistoriaUsuario {
  id: string;
  codigo: string;
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

// Criterio Aceptacion
interface CriterioAceptacion {
  id: string;
  numero: number;
  descripcion: string;
  huId: string;
  cumplido: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Métricas
interface MetricasSprint {
  sprintId: string;
  numero: number;
  velocidadPlaneada: number;
  velocidadReal: number;
  porcentajeCumplimiento: number;
  huTotales: number;
  huCompletadas: number;
  huEnProgreso: number;
  huBloqueadas: number;
  promedio3Sprints?: number;
}

// Impedimento
interface Impedimento {
  id: string;
  sprintId?: string;
  descripcion: string;
  estado: 'ABIERTO' | 'EN_PROGRESO' | 'RESUELTO' | 'CERRADO';
  esCritico: boolean;
  diasAbierto: number;
  responsable?: string;
  fechaApertura: Date;
  fechaResolucion?: Date;
}

// Trazabilidad
interface TrazabilidadHU {
  id: string;
  huId: string;
  repositorio: 'BACKEND' | 'FRONTEND';
  nombreRepositorio: string;
  shaCommit?: string;
  urlCommit?: string;
  numeroPR?: number;
  urlPR?: string;
  estadoPR?: string;
  extraido?: Date;
}
```

---

## 🎓 NOTAS FINALES

1. **Backend está 100% completado** - Solo se requiere frontend
2. **Todos los endpoints están documentados** - Revisar `SCRUM_METRICS_DOCUMENTATION.md`
3. **Validaciones están en backend** - Frontend puede asumir respuestas válidas
4. **JWT requerido** - Todo endpoint requiere header `Authorization: Bearer {token}`
5. **CORS configurado** - Backend permite requests desde cualquier origen
6. **Errores normalizados** - Todos con formato `{ success: false, message: string }`
7. **MongoDB con Prisma** - Datos persistidos correctamente
8. **GitHub Integration Ready** - Configurar `GITHUB_TOKEN` en backend para extraer commits/PRs

---

## 📞 CONTACTO BACKEND TEAM

Para dudas sobre endpoints, modelos o comportamiento, referirse a:
- Documentación: `SCRUM_METRICS_DOCUMENTATION.md`
- Contratos: `src/modules/scrum/domain/scrum-contracts.ts`
- Use Cases: `src/modules/scrum/application/*.use-cases.ts`

¡Feliz implementación! 🚀
