import { ApplicationError } from '../../../shared/application-error';
import { GroupRecord, GroupStatus } from '../../../domain/contracts';

// ─────────────────────────────────────────────
// Interfaz común de estado (State Pattern)
// ─────────────────────────────────────────────

/**
 * IGroupState define las operaciones que todo estado del ciclo de vida
 * de un grupo debe poder gestionar. Cada implementación encapsula qué
 * transiciones son válidas en ese estado y rechaza las que no lo son.
 */
export interface IGroupState {
  readonly name: string;

  /** Solicitar ingreso al grupo */
  solicitarIngreso(ctx: GroupContext, solicitanteId: string): void;

  /** Aprobar una solicitud de ingreso */
  aprobarSolicitud(ctx: GroupContext, solicitudId: string, adminId: string): void;

  /** Rechazar una solicitud de ingreso */
  rechazarSolicitud(ctx: GroupContext, solicitudId: string, adminId: string): void;

  /** Agregar directamente un miembro */
  agregarMiembro(ctx: GroupContext, nuevoMiembroId: string, adminId: string): void;

  /** El admin quiere salir teniendo otros miembros → debe transferir primero */
  iniciarTransferenciaAdmin(ctx: GroupContext, adminId: string): void;

  /** Transferir la administración a otro miembro */
  transferirAdministracion(ctx: GroupContext, adminId: string, nuevoAdminId: string): void;

  /** Un miembro no-admin abandona el grupo */
  abandonarGrupo(ctx: GroupContext, miembroId: string): void;

  /** El único miembro (admin) abandona el grupo → disuelve el grupo */
  disolverGrupo(ctx: GroupContext, adminId: string): void;
}

// ─────────────────────────────────────────────
// GroupContext — mantiene el estado actual
// ─────────────────────────────────────────────

/**
 * GroupContext envuelve un GroupRecord y delega todas las operaciones
 * al estado activo. Es el único punto de entrada para mutar el ciclo
 * de vida de un grupo.
 */
export class GroupContext {
  private _state: IGroupState;
  private _group: GroupRecord;
  /** Estado que debe persistirse tras la operación, o null si no hubo transición */
  private _pendingEstado: GroupStatus | null = null;

  constructor(group: GroupRecord) {
    this._group = group;
    this._state = GroupStateFactory.fromGroup(group);
  }

  get group(): GroupRecord {
    return this._group;
  }

  get stateName(): string {
    return this._state.name;
  }

  /**
   * El estado a persistir en BD tras la operación.
   * Es null si no hubo cambio de estado.
   */
  get pendingEstado(): GroupStatus | null {
    return this._pendingEstado;
  }

  /** Transiciona al nuevo estado y marca el estado para persistir */
  transitionTo(state: IGroupState): void {
    this._state = state;
    // Mapeamos el nombre del estado al valor del enum de BD
    this._pendingEstado = GroupStateFactory.toGroupStatus(state.name);
  }

  /** Actualiza el record interno (p.ej. tras una operación en BD) */
  updateRecord(group: GroupRecord): void {
    this._group = group;
  }

  // ── Delegaciones al estado activo ──

  solicitarIngreso(solicitanteId: string): void {
    this._state.solicitarIngreso(this, solicitanteId);
  }

  aprobarSolicitud(solicitudId: string, adminId: string): void {
    this._state.aprobarSolicitud(this, solicitudId, adminId);
  }

  rechazarSolicitud(solicitudId: string, adminId: string): void {
    this._state.rechazarSolicitud(this, solicitudId, adminId);
  }

  agregarMiembro(nuevoMiembroId: string, adminId: string): void {
    this._state.agregarMiembro(this, nuevoMiembroId, adminId);
  }

  iniciarTransferenciaAdmin(adminId: string): void {
    this._state.iniciarTransferenciaAdmin(this, adminId);
  }

  transferirAdministracion(adminId: string, nuevoAdminId: string): void {
    this._state.transferirAdministracion(this, adminId, nuevoAdminId);
  }

  abandonarGrupo(miembroId: string): void {
    this._state.abandonarGrupo(this, miembroId);
  }

  disolverGrupo(adminId: string): void {
    this._state.disolverGrupo(this, adminId);
  }
}

// ─────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────

function assertIsAdmin(group: GroupRecord, userId: string, msg?: string): void {
  if (group.administradorId !== userId) {
    throw new ApplicationError(403, msg ?? 'Solo el administrador puede realizar esta acción');
  }
}

function assertIsMember(group: GroupRecord, userId: string, msg?: string): void {
  const esMiembro = group.miembros.some((m) => m.usuarioId === userId);
  if (!esMiembro) {
    throw new ApplicationError(403, msg ?? 'No eres miembro de este grupo');
  }
}

function assertNotMember(group: GroupRecord, userId: string, msg?: string): void {
  const esMiembro = group.miembros.some((m) => m.usuarioId === userId);
  if (esMiembro) {
    throw new ApplicationError(409, msg ?? 'El usuario ya es miembro del grupo');
  }
}

function invalidTransition(stateName: string, operation: string): never {
  throw new ApplicationError(
    409,
    `Operación '${operation}' no permitida en el estado '${stateName}'`,
  );
}

// ─────────────────────────────────────────────
// Estado 1: FormingState
// ─────────────────────────────────────────────

/**
 * FormingState — Grupo recién creado. Solo existe el creador/admin.
 * Transiciones válidas:
 *   - solicitarIngreso   → sigue en FormingState (acumula solicitudes)
 *   - aprobarSolicitud   → ActiveState (al tener ≥2 miembros)
 *   - rechazarSolicitud  → sigue en FormingState
 *   - agregarMiembro     → ActiveState
 *   - disolverGrupo      → DissolvedState (admin único sale)
 */
export class FormingState implements IGroupState {
  readonly name = 'FORMING';

  solicitarIngreso(ctx: GroupContext, solicitanteId: string): void {
    assertNotMember(ctx.group, solicitanteId, 'Ya eres miembro de este grupo');
    // La operación real (BD) ocurre en el use-case; aquí validamos el contexto.
  }

  aprobarSolicitud(ctx: GroupContext, _solicitudId: string, adminId: string): void {
    assertIsAdmin(ctx.group, adminId);
    // Tras aprobar, el grupo pasará a tener ≥2 miembros → ActiveState
    ctx.transitionTo(new ActiveState());
  }

  rechazarSolicitud(ctx: GroupContext, _solicitudId: string, adminId: string): void {
    assertIsAdmin(ctx.group, adminId);
    // Sin cambio de estado
  }

  agregarMiembro(ctx: GroupContext, nuevoMiembroId: string, adminId: string): void {
    assertIsAdmin(ctx.group, adminId);
    assertNotMember(ctx.group, nuevoMiembroId);
    ctx.transitionTo(new ActiveState());
  }

  iniciarTransferenciaAdmin(_ctx: GroupContext, _adminId: string): void {
    // No hay otros miembros → no se puede transferir
    throw new ApplicationError(
      400,
      'No hay otros miembros a quienes transferir la administración. Puedes disolver el grupo directamente.',
    );
  }

  transferirAdministracion(_ctx: GroupContext, _adminId: string, _nuevoAdminId: string): void {
    invalidTransition(this.name, 'transferirAdministracion');
  }

  abandonarGrupo(ctx: GroupContext, miembroId: string): void {
    assertIsMember(ctx.group, miembroId);
    // Si el único miembro es el admin y quiere salir, disuelve directamente
    if (ctx.group.administradorId === miembroId) {
      ctx.transitionTo(new ClosingState());
    }
  }

  disolverGrupo(ctx: GroupContext, adminId: string): void {
    assertIsAdmin(ctx.group, adminId);
    ctx.transitionTo(new ClosingState());
  }
}

// ─────────────────────────────────────────────
// Estado 2: ActiveState
// ─────────────────────────────────────────────

/**
 * ActiveState — Grupo con actividad normal (≥2 miembros).
 * Transiciones válidas:
 *   - solicitarIngreso           → sigue en ActiveState
 *   - aprobarSolicitud           → sigue en ActiveState
 *   - rechazarSolicitud          → sigue en ActiveState
 *   - agregarMiembro             → sigue en ActiveState
 *   - iniciarTransferenciaAdmin  → PendingTransferState
 *   - abandonarGrupo (no-admin)  → sigue en ActiveState (o FormingState si queda 1)
 *   - disolverGrupo              → NO permitido (hay otros miembros)
 */
export class ActiveState implements IGroupState {
  readonly name = 'ACTIVE';

  solicitarIngreso(ctx: GroupContext, solicitanteId: string): void {
    assertNotMember(ctx.group, solicitanteId, 'Ya eres miembro de este grupo');
  }

  aprobarSolicitud(ctx: GroupContext, _solicitudId: string, adminId: string): void {
    assertIsAdmin(ctx.group, adminId);
  }

  rechazarSolicitud(ctx: GroupContext, _solicitudId: string, adminId: string): void {
    assertIsAdmin(ctx.group, adminId);
  }

  agregarMiembro(ctx: GroupContext, nuevoMiembroId: string, adminId: string): void {
    assertIsAdmin(ctx.group, adminId);
    assertNotMember(ctx.group, nuevoMiembroId);
  }

  iniciarTransferenciaAdmin(ctx: GroupContext, adminId: string): void {
    assertIsAdmin(ctx.group, adminId);
    if (ctx.group.miembros.length < 2) {
      throw new ApplicationError(400, 'No hay otros miembros a quienes transferir la administración');
    }
    ctx.transitionTo(new PendingTransferState());
  }

  transferirAdministracion(_ctx: GroupContext, _adminId: string, _nuevoAdminId: string): void {
    invalidTransition(this.name, 'transferirAdministracion');
  }

  abandonarGrupo(ctx: GroupContext, miembroId: string): void {
    assertIsMember(ctx.group, miembroId);

    if (ctx.group.administradorId === miembroId) {
      if (ctx.group.miembros.length > 1) {
        throw new ApplicationError(
          400,
          'Debes transferir la administración a otro miembro antes de salir del grupo',
        );
      }
      // Último miembro (admin): puede disolver
      ctx.transitionTo(new ClosingState());
      return;
    }

    // Si tras salir queda solo el admin, vuelve a FormingState
    const miembrosRestantes = ctx.group.miembros.filter((m) => m.usuarioId !== miembroId);
    if (miembrosRestantes.length === 1) {
      ctx.transitionTo(new FormingState());
    }
    // Si quedan ≥2, sigue en ActiveState
  }

  disolverGrupo(_ctx: GroupContext, _adminId: string): void {
    throw new ApplicationError(
      400,
      'No puedes disolver el grupo mientras haya otros miembros. Transfiere la administración primero.',
    );
  }
}

// ─────────────────────────────────────────────
// Estado 3: PendingTransferState
// ─────────────────────────────────────────────

/**
 * PendingTransferState — El admin ha iniciado el proceso de salida.
 * Debe transferir la administración antes de poder abandonar.
 * Transiciones válidas:
 *   - transferirAdministracion  → ActiveState (con nuevo admin)
 *   - rechazarSolicitud         → sigue en PendingTransferState (operaciones normales)
 *   - aprobarSolicitud          → sigue en PendingTransferState
 *   - abandonarGrupo            → NO permitido hasta transferir
 */
export class PendingTransferState implements IGroupState {
  readonly name = 'PENDING_TRANSFER';

  solicitarIngreso(ctx: GroupContext, solicitanteId: string): void {
    assertNotMember(ctx.group, solicitanteId, 'Ya eres miembro de este grupo');
  }

  aprobarSolicitud(ctx: GroupContext, _solicitudId: string, adminId: string): void {
    assertIsAdmin(ctx.group, adminId);
    // Permitido mientras se espera la transferencia
  }

  rechazarSolicitud(ctx: GroupContext, _solicitudId: string, adminId: string): void {
    assertIsAdmin(ctx.group, adminId);
  }

  agregarMiembro(ctx: GroupContext, nuevoMiembroId: string, adminId: string): void {
    assertIsAdmin(ctx.group, adminId);
    assertNotMember(ctx.group, nuevoMiembroId);
  }

  iniciarTransferenciaAdmin(_ctx: GroupContext, _adminId: string): void {
    // Ya está en proceso de transferencia — no es un error, es idempotente
  }

  transferirAdministracion(ctx: GroupContext, adminId: string, nuevoAdminId: string): void {
    assertIsAdmin(ctx.group, adminId);

    if (nuevoAdminId === adminId) {
      throw new ApplicationError(400, 'Ya eres el administrador del grupo');
    }

    const esMiembro = ctx.group.miembros.some((m) => m.usuarioId === nuevoAdminId);
    if (!esMiembro) {
      throw new ApplicationError(404, 'El usuario no es miembro del grupo');
    }

    // Vuelve a estado activo con el nuevo admin
    ctx.transitionTo(new ActiveState());
  }

  abandonarGrupo(_ctx: GroupContext, _miembroId: string): void {
    throw new ApplicationError(
      400,
      'Debes transferir la administración a otro miembro antes de salir del grupo',
    );
  }

  disolverGrupo(_ctx: GroupContext, _adminId: string): void {
    throw new ApplicationError(
      400,
      'No puedes disolver el grupo mientras haya otros miembros. Transfiere la administración primero.',
    );
  }
}

// ─────────────────────────────────────────────
// Estado 4: ClosingState
// ─────────────────────────────────────────────

/**
 * ClosingState — El último miembro (admin) está saliendo.
 * El grupo será eliminado de la BD en la siguiente operación.
 * Este estado es transitorio — se usa solo para señalizar
 * al use-case que debe ejecutar deleteGroup.
 * Ninguna operación adicional es permitida.
 */
export class ClosingState implements IGroupState {
  readonly name = 'CLOSING';

  solicitarIngreso(_ctx: GroupContext, _solicitanteId: string): void {
    invalidTransition(this.name, 'solicitarIngreso');
  }

  aprobarSolicitud(_ctx: GroupContext, _solicitudId: string, _adminId: string): void {
    invalidTransition(this.name, 'aprobarSolicitud');
  }

  rechazarSolicitud(_ctx: GroupContext, _solicitudId: string, _adminId: string): void {
    invalidTransition(this.name, 'rechazarSolicitud');
  }

  agregarMiembro(_ctx: GroupContext, _nuevoMiembroId: string, _adminId: string): void {
    invalidTransition(this.name, 'agregarMiembro');
  }

  iniciarTransferenciaAdmin(_ctx: GroupContext, _adminId: string): void {
    invalidTransition(this.name, 'iniciarTransferenciaAdmin');
  }

  transferirAdministracion(_ctx: GroupContext, _adminId: string, _nuevoAdminId: string): void {
    invalidTransition(this.name, 'transferirAdministracion');
  }

  abandonarGrupo(ctx: GroupContext, adminId: string): void {
    assertIsAdmin(ctx.group, adminId);
    // Confirmamos: el use-case procederá a deleteGroup
    ctx.transitionTo(new DissolvedState());
  }

  disolverGrupo(ctx: GroupContext, adminId: string): void {
    assertIsAdmin(ctx.group, adminId);
    ctx.transitionTo(new DissolvedState());
  }
}

// ─────────────────────────────────────────────
// Estado 5: DissolvedState
// ─────────────────────────────────────────────

/**
 * DissolvedState — Estado terminal. El grupo ha sido eliminado.
 * Ninguna operación es permitida.
 */
export class DissolvedState implements IGroupState {
  readonly name = 'DISSOLVED';

  solicitarIngreso(_ctx: GroupContext, _solicitanteId: string): void {
    invalidTransition(this.name, 'solicitarIngreso');
  }

  aprobarSolicitud(_ctx: GroupContext, _solicitudId: string, _adminId: string): void {
    invalidTransition(this.name, 'aprobarSolicitud');
  }

  rechazarSolicitud(_ctx: GroupContext, _solicitudId: string, _adminId: string): void {
    invalidTransition(this.name, 'rechazarSolicitud');
  }

  agregarMiembro(_ctx: GroupContext, _nuevoMiembroId: string, _adminId: string): void {
    invalidTransition(this.name, 'agregarMiembro');
  }

  iniciarTransferenciaAdmin(_ctx: GroupContext, _adminId: string): void {
    invalidTransition(this.name, 'iniciarTransferenciaAdmin');
  }

  transferirAdministracion(_ctx: GroupContext, _adminId: string, _nuevoAdminId: string): void {
    invalidTransition(this.name, 'transferirAdministracion');
  }

  abandonarGrupo(_ctx: GroupContext, _miembroId: string): void {
    invalidTransition(this.name, 'abandonarGrupo');
  }

  disolverGrupo(_ctx: GroupContext, _adminId: string): void {
    invalidTransition(this.name, 'disolverGrupo');
  }
}

// ─────────────────────────────────────────────
// Factory — determina el estado inicial desde un GroupRecord
// ─────────────────────────────────────────────

export class GroupStateFactory {
  /**
   * Re-hidrata el estado del patrón State desde el campo `estado` persistido en BD.
   * Si el estado guardado es PENDIENTE_TRANSFERENCIA, el grupo se restaura directamente
   * en PendingTransferState sin depender del número de miembros.
   */
  static fromGroup(group: GroupRecord): IGroupState {
    switch (group.estado) {
      case 'PENDIENTE_TRANSFERENCIA':
        return new PendingTransferState();
      case 'CERRADO':
        return new DissolvedState();
      case 'ACTIVO':
      default:
        // Estado ACTIVO: diferenciamos entre grupo con 1 miembro (FORMING) y más (ACTIVE)
        return group.miembros.length <= 1 ? new FormingState() : new ActiveState();
    }
  }

  /**
   * Convierte el nombre del estado del patrón State al valor del enum de BD.
   * Retorna null para estados transitorios que no deben persistirse.
   */
  static toGroupStatus(stateName: string): GroupStatus | null {
    switch (stateName) {
      case 'FORMING':
      case 'ACTIVE':
        return 'ACTIVO';
      case 'PENDING_TRANSFER':
        return 'PENDIENTE_TRANSFERENCIA';
      case 'CLOSING':
      case 'DISSOLVED':
        return 'CERRADO';
      default:
        return null;
    }
  }
}
