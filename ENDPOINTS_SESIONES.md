# Endpoints de Sesiones de Estudio — US-V02

Todas las rutas requieren `Authorization: Bearer <token>` (JWT).

---

## Crear serie recurrente

```
POST /api/sesiones/series
```

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `titulo` | string | sí | |
| `descripcion` | string | sí | |
| `lugar` | string | sí | |
| `frecuencia` | `DIARIA` / `SEMANAL` / `QUINCENAL` | sí | |
| `fechaInicio` | ISO date | sí | Futura |
| `fechaFin` | ISO date | sí | Posterior a fechaInicio |
| `recordatorioMinutos` | number (default 30) | no | Minutos antes para recordatorio |
| `grupoId` | string | no | ID del grupo. Si se envía, se crean asistentes automáticos para todos los miembros |

**201** — Creada. Devuelve la serie con todas sus sesiones y asistentes (si aplica).

---

## Listar sesiones propias

```
GET /api/sesiones
```

Devuelve sesiones no canceladas donde el usuario es creador.

---

## Modificar sesión

```
PATCH /api/sesiones/:sesionId
```

| Body | Tipo | Obligatorio |
|---|---|---|
| `alcance` | `solo_esta` / `esta_y_siguientes` | sí |
| `titulo` | string | no |
| `descripcion` | string | no |
| `lugar` | string | no |
| `fecha` | ISO date | no |
| `recordatorioMinutos` | number | no |

Solo el creador puede modificar.

---

## Cancelar sesión individual o siguientes

```
POST /api/sesiones/:sesionId/cancelar
```

| Body | Tipo | Obligatorio |
|---|---|---|
| `alcance` | `solo_esta` / `esta_y_siguientes` | sí |

Solo el creador puede cancelar.

---

## Cancelar múltiples sesiones específicas (Criterio 3)

```
POST /api/sesiones/cancelar-multiples
```

| Body | Tipo | Obligatorio |
|---|---|---|
| `sesionIds` | `string[]` | sí |

Cancela solo las sesiones indicadas sin afectar el resto de la serie.

Respuesta:
```json
{ "success": true, "message": "3 sesión(es) cancelada(s)", "data": { "canceladas": 3 } }
```

---

## Calendario completo (Criterio 4)

```
GET /api/sesiones/calendario
```

Devuelve todas las sesiones donde el usuario es creador O asistente, ordenadas por fecha.

Cada ítem incluye:

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | |
| `titulo` | string | |
| `descripcion` | string | |
| `lugar` | string | |
| `fecha` | ISO date | |
| `recordatorioMinutos` | number | |
| `cancelada` | boolean | |
| `recurrencia` | `DIARIA` / `SEMANAL` / `QUINCENAL` / `null` | Indicador de recurrencia |
| `serieId` | string | |
| `grupoId` | string / null | |
| `grupoNombre` | string / null | Nombre del grupo asociado |
| `creadorId` | string | |
| `asistentes` | `AsistenteDTO[]` | Lista de participantes con su estado |
| `miAsistencia` | `PENDIENTE` / `CONFIRMADA` / `DECLINADA` / `null` | Estado del usuario autenticado |

---

## Detalle de sesión (Criterio 5)

```
GET /api/sesiones/:sesionId/detalle
```

Misma estructura que un ítem del calendario. Requiere ser creador o asistente de la sesión.

---

## Confirmar asistencia (Criterio 5)

```
POST /api/sesiones/:sesionId/asistir
```

- Valida que la sesión exista y no esté cancelada
- Valida que el usuario sea participante
- Si ya tiene el mismo estado → `409 Conflict`
- Dispara el Observer (Criterio 7): notifica al organizador vía `NotificacionService`

---

## Declinar asistencia (Criterio 5)

```
POST /api/sesiones/:sesionId/declinar
```

Mismas validaciones que confirmar. También dispara el Observer.

---

## AsistenteDTO

```json
{
  "id": "string",
  "sesionId": "string",
  "usuarioId": "string",
  "estado": "PENDIENTE | CONFIRMADA | DECLINADA",
  "nombre": "string?",
  "apellido": "string?",
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

---

# 🎯 Prompt para Frontend — US-V02: Sesiones de Estudio Recurrentes

## Historia de Usuario

> Como estudiante, quiero programar sesiones de estudio con generación de series recurrentes, recordatorios temporizados y acceso dual desde web y móvil.

## Criterios de Aceptación

| Criterio | Estado |
|---|---|
| **1 — Serie de sesiones recurrentes** | ✅ Backend listo |
| **2 — Recordatorios automáticos** | ✅ Backend listo |
| **3 — Cancelación individual por fechas** | ✅ Backend listo |
| **4 — Calendario web** | ✅ Backend listo |
| **5 — Confirmación de asistencia móvil** | ✅ Backend listo |
| **6 — Decoradores de notificación** | ✅ Backend listo |
| **7 — Observer de cambios de disponibilidad** | ✅ Backend listo |

## API Base

```
URL base:    http://localhost:3000
Autenticación: Authorization: Bearer <JWT>
```

> Todos los endpoints devuelven `{ success: boolean, message?: string, data?: any }`.

---

## Criterio 1 — Crear serie de estudio recurrente

**Endpoint:** `POST /api/sesiones/series`

```json
// Request
{
  "titulo": "Estudio Cálculo",
  "descripcion": "Repaso semanal",
  "lugar": "Biblioteca 304",
  "frecuencia": "SEMANAL",
  "fechaInicio": "2026-06-01T10:00:00Z",
  "fechaFin": "2026-12-01T12:00:00Z",
  "recordatorioMinutos": 30,
  "grupoId": "abc123" // opcional: si se envía, asistentes automáticos
}
```

**UX requerido:**
- Formulario con campos: título, descripción, lugar, frecuencia (select), fecha inicio (datepicker), fecha fin (datepicker), recordatorio (number input), grupo (selector de grupos donde el usuario es miembro)
- Validar que fechaInicio > ahora y fechaFin > fechaInicio
- Indicador visual de recurrencia en el resumen después de crear
- Mostrar error si la frecuencia no es válida
- Si se selecciona un grupo, mostrar "Se notificará a N miembros"

---

## Criterio 2 — Recordatorios automáticos

**No requiere endpoints adicionales.** El `RecordatorioScheduler` del backend corre automáticamente cada 60 segundos.

**UX requerido (frontend se suscribe a Socket.IO):**

```typescript
// Conectar al socket
const socket = io('http://localhost:3000', {
  auth: { token: '<JWT>' }
});

// Escuchar notificaciones en tiempo real
socket.on('notificacion:nueva', (payload) => {
  // payload.mensaje: 'Recordatorio: "Estudio Cálculo" comienza en 30 minutos.'
  // payload.tipoEvento: 'recordatorio'
  // payload.timestamp: Date
});
```

**Experiencia:**
- Mostrar badge/contador de notificaciones no leídas (usar `GET /api/notificaciones?noLeidas=true`)
- Al hacer clic en una notificación de recordatorio, navegar al detalle de la sesión (`/sesiones/:sesionId/detalle`)
- Sound/vibración opcional al recibir recordatorio
- La notificación se marca como leída al abrirla (`POST /api/notificaciones/:id/leer`)

---

## Criterio 3 — Cancelación por fechas específicas

### Cancelar sesión individual
```
POST /api/sesiones/:sesionId/cancelar
Body: { "alcance": "solo_esta" }
```

### Cancelar varias sesiones específicas
```
POST /api/sesiones/cancelar-multiples
Body: { "sesionIds": ["id1", "id2", "id3"] }
```

**UX requerido:**
- En el calendario/web: cada sesión tiene un botón "Cancelar"
- Modal de confirmación con opciones:
  - "Solo esta sesión"
  - "Esta y las siguientes"
  - **NUEVO:** Checkbox selector de fechas específicas para cancelar múltiples a la vez
- Selector múltiple: mostrar checkboxes en cada sesión de la serie → botón "Cancelar seleccionadas"
- Confirmación: "¿Cancelar N sesiones? Esta acción no se puede deshacer"
- La sesión cancelada debe mostrarse visualmente (tachada, gris, con badge "Cancelada")
- Las sesiones canceladas no deben contar para el calendario ni recordatorios

---

## Criterio 4 — Calendario web

### Obtener calendario
```
GET /api/sesiones/calendario
```

**Respuesta:** Array de `CalendarioSesionDTO` ordenado por fecha.

**UX requerido (Dashboard web):**
- Vista de calendario (semanal o mensual) con todas las sesiones
- Cada sesión muestra:
  - Título
  - Hora
  - Lugar
  - 📅 Icono de recurrencia si aplica (DIARIA 🔁, SEMANAL 📆, QUINCENAL 📅)
  - Badge "Cancelada" si `cancelada: true`
  - Badge de asistencia personal (`miAsistencia`): ✅ Confirmada, ❌ Declinada, ⏳ Pendiente
  - Nombre del grupo si aplica
  - Número de asistentes confirmados
- Filtros opcionales: por grupo, por recurrencia, por estado de asistencia
- Al hacer clic en una sesión: navegar a detalle o modal con info completa
- Las sesiones del grupo deben mostrar los nombres de los miembros que confirmaron

---

## Criterio 5 — Confirmación de asistencia (App Móvil / Web)

### Detalle de sesión
```
GET /api/sesiones/:sesionId/detalle
```

### Confirmar / Declinar
```
POST /api/sesiones/:sesionId/asistir
POST /api/sesiones/:sesionId/declinar
```

**UX requerido (App Móvil primero, Web después):**
- Pantalla de detalle de sesión con:
  - Título, descripción, lugar, fecha/hora
  - Indicador de recurrencia
  - Nombre del grupo (si aplica)
  - Quién creó la sesión
  - Lista de participantes con su estado:
    - ✅ Confirmada (verde)
    - ❌ Declinada (rojo)
    - ⏳ Pendiente (amarillo/gris)
  - Botones grandes: **"Asistiré"** / **"No podré asistir"**
- Si el usuario ya confirmó: botón "No podré asistir" para cambiar
- Si el usuario ya decline: botón "Asistiré" para cambiar
- Si ya tiene ese estado exacto: mostrar mensaje "Ya registraste esta respuesta"
- Feedback visual inmediato después de confirmar/declinar (optimistic update)
- La lista de asistentes se actualiza sin recargar la página

---

## Criterio 6 — Decoradores de notificación

**No requiere endpoints.** El backend ya construye notificaciones con decoradores (prioridad, acción, encuesta).

**UX requerido:**
- Las notificaciones recibidas vía Socket.IO pueden incluir:
  - `prioridad`: `normal` | `urgente`
  - `accion`: `{ label: string, endpoint: string }` — botón actionable
- Renderizar notificaciones urgentes con estilo destacado
- Si tiene `accion`, mostrar botón que navegue al `endpoint`

---

## Criterio 7 — Observer de cambios de disponibilidad

**No requiere endpoints adicionales.** El backend ya notifica automáticamente al organizador cuando alguien cambia su asistencia.

**UX requerido (vía Socket.IO):**
```typescript
// El organizador recibe en tiempo real cuando alguien confirma/declina
socket.on('notificacion:nueva', (payload) => {
  // payload.mensaje: 'Juan Pérez confirmó asistencia a "Estudio Cálculo"'
  // payload.tipoEvento: 'recordatorio'
});
```

- En el detalle de la sesión (vista del organizador), el estado de los asistentes debe actualizarse en tiempo real vía Socket.IO
- Mostrar toast/notificación push cuando alguien cambia su estado
- El contador de confirmados se actualiza automáticamente

---

## Socket.IO — Eventos en Tiempo Real

| Evento | Dirección | Cuándo ocurre |
|---|---|---|
| `notificacion:nueva` | Backend → Frontend | Recordatorio, cambio de asistencia, etc. |
| `notificacion:nueva` (grupo) | Backend → Sala del grupo | Notificaciones grupales |

**Conexión:**
```typescript
const socket = io(BASE_URL, {
  auth: { token: jwtToken }
});

socket.on('connect', () => console.log('Conectado'));
socket.on('notificacion:nueva', (data) => {
  // data.mensaje: string
  // data.timestamp: string
  // data.tipoEvento: string
});
```

---

## Integración con Grupos

- Al crear una serie con `grupoId`, el backend automáticamente agrega a todos los miembros del grupo como `PENDIENTE` en cada sesión
- El selector de grupo debe listar los grupos donde el usuario es miembro: `GET /api/grupos`
- Al ver el calendario, las sesiones de grupo muestran `grupoNombre`

---

## Resumen de Tareas para Frontend

| # | Tarea | Criterio |
|---|---|---|
| 1 | Formulario crear serie recurrente con validaciones | C1 |
| 2 | Selector de grupo al crear serie | C1 |
| 3 | Vista calendario semanal/mensual | C4 |
| 4 | Indicador visual de recurrencia en calendario | C4 |
| 5 | Badge de estado de cancelación | C3, C4 |
| 6 | Badge de asistencia personal (`miAsistencia`) | C4, C5 |
| 7 | Botón cancelar con modal de selección de fechas | C3 |
| 8 | Selección múltiple de sesiones para cancelar | C3 |
| 9 | Pantalla detalle de sesión con lista de asistentes | C5 |
| 10 | Botones Asistir/Declinar con optimistic update | C5 |
| 11 | Integración Socket.IO para notificaciones en tiempo real | C2, C7 |
| 12 | Toast/notificaciones push al recibir eventos | C2, C7 |
| 13 | Panel de notificaciones con badge de no leídas | C2, C6 |
| 14 | Notificaciones urgentes con estilo destacado | C6 |
| 15 | Botón actionable en notificaciones con `accion` | C6 |
| 16 | Actualización en tiempo real de lista de asistentes (organizador) | C7 |

