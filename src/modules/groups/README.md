# Módulo de Grupos — Patrón State (US-ST01)

## Descripción

El ciclo de vida de un grupo de estudio está modelado con el **patrón de diseño State**.
Cada estado del grupo es una clase independiente que implementa la interfaz `IGroupState`.
El contexto (`GroupContext`) delega todas las operaciones al estado activo y registra
la transición pendiente que debe persistirse en base de datos.

---

## Diagrama UML — Patrón State

```
┌──────────────────────────────────────────────────────────────────────┐
│                          <<interface>>                               │
│                           IGroupState                                │
├──────────────────────────────────────────────────────────────────────┤
│ + name: string                                                       │
│ + solicitarIngreso(ctx, solicitanteId)                               │
│ + aprobarSolicitud(ctx, solicitudId, adminId)                        │
│ + rechazarSolicitud(ctx, solicitudId, adminId)                       │
│ + agregarMiembro(ctx, nuevoMiembroId, adminId)                       │
│ + iniciarTransferenciaAdmin(ctx, adminId, candidatoId)               │
│ + aceptarTransferencia(ctx, candidatoId)                             │
│ + rechazarTransferencia(ctx, candidatoId)                            │
│ + cancelarTransferencia(ctx, adminId)                                │
│ + abandonarGrupo(ctx, miembroId)                                     │
│ + disolverGrupo(ctx, adminId)                                        │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ implements
         ┌─────────────────┼──────────────────────────┐
         │                 │                          │
         ▼                 ▼                          ▼
  ┌─────────────┐  ┌────────────────┐  ┌──────────────────────────┐
  │ FormingState│  │  ActiveState   │  │   PendingTransferState   │
  │  name:      │  │  name: ACTIVE  │  │  name: PENDING_TRANSFER  │
  │  FORMING    │  │                │  │                          │
  └─────────────┘  └────────────────┘  └──────────────────────────┘
         │                 │                          │
         │                 │            ┌─────────────┼──────────────┐
         │                 │            ▼             ▼              ▼
         │                 │  ┌──────────────────┐ ┌───────────────┐ ┌──────────────────────┐
         │                 │  │TransferAccepted  │ │TransferRejec  │ │ CancelledTransfer    │
         │                 │  │State             │ │tedState       │ │ State                │
         │                 │  │name:             │ │name:          │ │ name:                │
         │                 │  │TRANSFER_ACCEPTED │ │TRANSFER_      │ │ TRANSFER_CANCELLED   │
         │                 │  └──────────────────┘ │REJECTED       │ └──────────────────────┘
         │                 │                       └───────────────┘
         └─────────────────┴──────────────────────────────────────────────┐
                                                                          │
                                                              ┌───────────┴──────────┐
                                                              │    ClosingState      │
                                                              │    name: CLOSING     │
                                                              └───────────┬──────────┘
                                                                          │
                                                              ┌───────────▼──────────┐
                                                              │   DissolvedState     │
                                                              │   name: DISSOLVED    │
                                                              └──────────────────────┘
```

### GroupContext (Contexto)

```
┌────────────────────────────────────────────────────┐
│                   GroupContext                     │
├────────────────────────────────────────────────────┤
│ - _state: IGroupState                              │
│ - _group: GroupRecord                              │
│ - _pendingEstado: GroupStatus | null               │
├────────────────────────────────────────────────────┤
│ + transitionTo(state: IGroupState): void           │
│ + solicitarIngreso(solicitanteId): void            │
│ + iniciarTransferenciaAdmin(adminId, cand): void   │
│ + aceptarTransferencia(candidatoId): void          │
│ + rechazarTransferencia(candidatoId): void         │
│ + cancelarTransferencia(adminId): void             │
│ + abandonarGrupo(miembroId): void                  │
│ + disolverGrupo(adminId): void                     │
│ + pendingEstado: GroupStatus | null  (get)         │
└─────────────────────────┬──────────────────────────┘
                          │ holds reference
                          ▼
                   ┌─────────────┐
                   │ IGroupState │  (activo en runtime)
                   └─────────────┘
```

---

## Diagrama de Transiciones

```
                ┌────────────┐
                │  FORMING   │◄──────────────────────────────────────┐
                │ (1 miembro)│                                       │
                └─────┬──────┘                                       │
          aprobar/    │                                               │ miembro no-admin
          agregar     │                                               │ sale → queda 1
                      ▼                                               │
                ┌────────────┐   iniciarTransferencia(candidatoId)  │
                │   ACTIVE   │──────────────────────────────────────►│──┐
                │ (≥2 miemb.)│                                          │
                └────────────┘                                          ▼
                      ▲                               ┌─────────────────────────────┐
                      │                               │   PENDIENTE_TRANSFERENCIA   │
                      │         ┌─────────────────────┤  (candidatoAdminId != null) │
                      │         │                     └──────────────────┬──────────┘
                      │         │                                        │
                      │    cancelar (admin)                        aceptar / rechazar
                      │    → ACTIVO                                (candidato)
                      │         │                                        │
                      │         ▼                           ┌────────────┴────────────┐
                      │   ┌──────────┐                      ▼                         ▼
                      │   │CANCELADO │       ┌──────────────────────┐  ┌─────────────────────────┐
                      │   │→ ACTIVO  │       │ TRANSFERENCIA_ACEPTADA│  │TRANSFERENCIA_RECHAZADA  │
                      └───┘          │       │ admin cambia → ACTIVO │  │ admin mantiene → ACTIVO │
                                     │       └──────────────────────┘  └─────────────────────────┘
                                     │                    │                          │
                                     └────────────────────┴──────────────────────────┘
                                                          ▼
                                                     ┌────────────┐
                                                     │   ACTIVO   │
                                                     └────────────┘
```

---

## Mapeo Estado (in-memory) ↔ BD (`EstadoGrupo`)

| Clase de Estado          | `name`               | `EstadoGrupo` en BD        | Al recargar desde BD       |
|--------------------------|----------------------|----------------------------|----------------------------|
| `FormingState`           | `FORMING`            | `ACTIVO`                   | → `FormingState` (1 mb.)   |
| `ActiveState`            | `ACTIVE`             | `ACTIVO`                   | → `ActiveState` (≥2 mb.)   |
| `PendingTransferState`   | `PENDING_TRANSFER`   | `PENDIENTE_TRANSFERENCIA`  | → `PendingTransferState`   |
| `TransferAcceptedState`  | `TRANSFER_ACCEPTED`  | `TRANSFERENCIA_ACEPTADA`   | → `ActiveState` (historial)|
| `TransferRejectedState`  | `TRANSFER_REJECTED`  | `TRANSFERENCIA_RECHAZADA`  | → `ActiveState` (historial)|
| `CancelledTransferState` | `TRANSFER_CANCELLED` | `CANCELADO`                | → `ActiveState` (historial)|
| `ClosingState`           | `CLOSING`            | `CERRADO`                  | → `DissolvedState`         |
| `DissolvedState`         | `DISSOLVED`          | `CERRADO`                  | → `DissolvedState`         |

---

## Endpoints HTTP del flujo de transferencia

| Método   | Ruta                                     | Quién lo llama | Acción                                         |
|----------|------------------------------------------|----------------|------------------------------------------------|
| `POST`   | `/api/grupos/:id/administrador/iniciar`  | Admin          | Nomina candidato → `PENDIENTE_TRANSFERENCIA`   |
| `POST`   | `/api/grupos/:id/administrador/aceptar`  | Candidato      | Acepta → admin cambia, estado `TRANSFERENCIA_ACEPTADA` → `ACTIVO` |
| `POST`   | `/api/grupos/:id/administrador/rechazar` | Candidato      | Rechaza → admin mantiene rol, estado `ACTIVO`  |
| `DELETE` | `/api/grupos/:id/administrador/cancelar` | Admin          | Cancela nominación → estado `ACTIVO`           |

---

## Patrón Observer integrado

El `Subject` es `GroupUseCases`. Al emitir un evento de ciclo de vida,
**todos los observers suscritos** reciben el evento con el `nuevoEstado` como payload:

```
GroupUseCases (Subject)
       │
       ├──► SocketGroupObserver      → emite eventos WebSocket a los usuarios afectados
       │
       └──► PersistenciaGroupObserver → registra la transición en el log de auditoría
```

Eventos emitidos con `nuevoEstado`:

| Método del Observer           | `nuevoEstado`               | Socket event                            |
|-------------------------------|-----------------------------|-----------------------------------------|
| `onTransferenciaPendiente`    | `PENDIENTE_TRANSFERENCIA`   | `grupo:admin:transferencia_pendiente`   |
| `onTransferenciaAceptada`     | `TRANSFERENCIA_ACEPTADA`    | `grupo:admin:transferencia_aceptada`    |
| `onTransferenciaRechazada`    | `ACTIVO`                    | `grupo:admin:transferencia_rechazada`   |
| `onTransferenciaCancelada`    | `ACTIVO`                    | `grupo:admin:transferencia_cancelada`   |

---

## Archivos del módulo

```
src/modules/groups/
├── application/
│   └── group.use-cases.ts          # Subject del Observer + orquestación
├── domain/
│   ├── contracts.ts                # Re-export de GroupRecord, GroupRepository
│   └── group-state.ts              # IGroupState, GroupContext, 8 estados, GroupStateFactory
├── infrastructure/
│   ├── persistencia-group.observer.ts  # Observer de persistencia/auditoría
│   ├── prisma-grupo.repository.ts      # Implementación del repositorio
│   ├── prisma-solicitud-grupo.repository.ts
│   └── socket-group.observer.ts        # Observer de WebSocket
└── interfaces/http/
    ├── grupo.controller.ts
    └── grupo.routes.ts
```
