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

  /** El admin inicia transferencia nombrando a un candidato */
  iniciarTransferenciaAdmin(ctx: GroupContext, adminId: string, candidatoId: string): void;

  /** El candidato acepta la administración */
  aceptarTransferencia(ctx: GroupContext, candidatoId: string): void;

  /** El candidato rechaza la administración */
  rechazarTransferencia(ctx: GroupContext, candidatoId: string): void;

  /** El admin cancela la transferencia en curso */
  cancelarTransferencia(ctx: GroupContext, adminId: string): void;

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

  iniciarTransferenciaAdmin(adminId: string, candidatoId: string): void {
    this._state.iniciarTransferenciaAdmin(this, adminId, candidatoId);
  }

  aceptarTransferencia(candidatoId: string): void {
    this._state.aceptarTransferencia(this, candidatoId);
  }

  rechazarTransferencia(candidatoId: string): void {
    this._state.rechazarTransferencia(this, candidatoId);
  }

  cancelarTransferencia(adminId: string): void {
    this._state.cancelarTransferencia(this, adminId);
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
 *   - disolverGrupo      → ClosingState (admin único sale)
 */
export class FormingState implements IGroupState {
  readonly name = 'FORMING';

  solicitarIngreso(ctx: GroupContext, solicitanteId: string): void {
    assertNotMember(ctx.group, solicitanteId, 'Ya eres miembro de este grupo');
  }

  aprobarSolicitud(ctx: GroupContext, _solicitudId: string, adminId: string): void {
    assertIsAdmin(ctx.group, adminId);
    ctx.transitionTo(new ActiveState());
  }

  rechazarSolicitud(ctx: GroupContext, _solicitudId: string, adminId: string): void {
    assertIsAdmin(ctx.group, adminId);
  }

  agregarMiembro(ctx: GroupContext, nuevoMiembroId: string, adminId: string): void {
    assertIsAdmin(ctx.group, adminId);
    assertNotMember(ctx.group, nuevoMiembroId);
    ctx.transitionTo(new ActiveState());
  }

  iniciarTransferenciaAdmin(_ctx: GroupContext, _adminId: string, _candidatoId: string): void {
    throw new ApplicationError(
      400,
      'No hay otros miembros a quienes transferir la administración. Puedes disolver el grupo directamente.',
    );
  }

  aceptarTransferencia(_ctx: GroupContext, _candidatoId: string): void {
    invalidTransition(this.name, 'aceptarTransferencia');
  }

  rechazarTransferencia(_ctx: GroupContext, _candidatoId: string): void {
    invalidTransition(this.name, 'rechazarTransferencia');
  }

  cancelarTransferencia(_ctx: GroupContext, _adminId: string): void {
    invalidTransition(this.name, 'cancelarTransferencia');
  }

  abandonarGrupo(ctx: GroupContext, miembroId: string): void {
    assertIsMember(ctx.group, miembroId);
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

  iniciarTransferenciaAdmin(ctx: GroupContext, adminId: string, candidatoId: string): void {
    assertIsAdmin(ctx.group, adminId);

    if (candidatoId === adminId) {
      throw new ApplicationError(400, 'No puedes nombrarte a ti mismo como candidato');
    }

    const esMiembro = ctx.group.miembros.some((m) => m.usuarioId === candidatoId);
    if (!esMiembro) {
      throw new ApplicationError(404, 'El candidato no es miembro del grupo');
    }

    if (ctx.group.miembros.length < 2) {
      throw new ApplicationError(400, 'No hay otros miembros a quienes transferir la administración');
    }

    ctx.transitionTo(new PendingTransferState());
  }

  aceptarTransferencia(_ctx: GroupContext, _candidatoId: string): void {
    invalidTransition(this.name, 'aceptarTransferencia');
  }

  rechazarTransferencia(_ctx: GroupContext, _candidatoId: string): void {
    invalidTransition(this.name, 'rechazarTransferencia');
  }

  cancelarTransferencia(_ctx: GroupContext, _adminId: string): void {
    invalidTransition(this.name, 'cancelarTransferencia');
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
      ctx.transitionTo(new ClosingState());
      return;
    }

    const miembrosRestantes = ctx.group.miembros.filter((m) => m.usuarioId !== miembroId);
    if (miembrosRestantes.length === 1) {
      ctx.transitionTo(new FormingState());
    }
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
 * PendingTransferState — El admin ha nominado un candidato a administrador.
 * El candidato debe aceptar o rechazar; el admin puede cancelar.
 * Transiciones válidas:
 *   - aceptarTransferencia  → TransferAcceptedState
 *   - rechazarTransferencia → TransferRejectedState
 *   - cancelarTransferencia → CancelledTransferState
 *   - aprobarSolicitud / rechazarSolicitud → sigue en PendingTransferState
 *   - abandonarGrupo → NO permitido hasta resolver la transferencia
 */
export class PendingTransferState implements IGroupState {
  readonly name = 'PENDING_TRANSFER';

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

  iniciarTransferenciaAdmin(_ctx: GroupContext, _adminId: string, _candidatoId: string): void {
    throw new ApplicationError(409, 'Ya hay una transferencia de administración en curso');
  }

  aceptarTransferencia(ctx: GroupContext, candidatoId: string): void {
    if (ctx.group.candidatoAdminId !== candidatoId) {
      throw new ApplicationError(403, 'No eres el candidato designado para administrar este grupo');
    }
    ctx.transitionTo(new TransferAcceptedState());
  }

  rechazarTransferencia(ctx: GroupContext, candidatoId: string): void {
    if (ctx.group.candidatoAdminId !== candidatoId) {
      throw new ApplicationError(403, 'No eres el candidato designado para administrar este grupo');
    }
    ctx.transitionTo(new TransferRejectedState());
  }

  cancelarTransferencia(ctx: GroupContext, adminId: string): void {
    assertIsAdmin(ctx.group, adminId);
    ctx.transitionTo(new CancelledTransferState());
  }

  abandonarGrupo(_ctx: GroupContext, _miembroId: string): void {
    throw new ApplicationError(
      400,
      'Hay una transferencia de administración pendiente. Cancélala antes de salir del grupo.',
    );
  }

  disolverGrupo(_ctx: GroupContext, _adminId: string): void {
    throw new ApplicationError(
      400,
      'No puedes disolver el grupo mientras haya una transferencia pendiente. Cancélala primero.',
    );
  }
}

// ─────────────────────────────────────────────
// Estado 4: TransferAcceptedState
// ─────────────────────────────────────────────

/**
 * TransferAcceptedState — El candidato aceptó la administración.
 * Estado transitorio: el use-case actualiza el admin y vuelve a ACTIVO.
 * Se persiste en BD como TRANSFERENCIA_ACEPTADA (historial).
 */
export class TransferAcceptedState implements IGroupState {
  readonly name = 'TRANSFER_ACCEPTED';

  solicitarIngreso(_ctx: GroupContext, _solicitanteId: string): void {
    invalidTransition(this.name, 'solicitarIngreso');
  }
  aprobarSolicitud(_ctx: GroupContext, _s: string, _a: string): void {
    invalidTransition(this.name, 'aprobarSolicitud');
  }
  rechazarSolicitud(_ctx: GroupContext, _s: string, _a: string): void {
    invalidTransition(this.name, 'rechazarSolicitud');
  }
  agregarMiembro(_ctx: GroupContext, _n: string, _a: string): void {
    invalidTransition(this.name, 'agregarMiembro');
  }
  iniciarTransferenciaAdmin(_ctx: GroupContext, _a: string, _c: string): void {
    invalidTransition(this.name, 'iniciarTransferenciaAdmin');
  }
  aceptarTransferencia(_ctx: GroupContext, _c: string): void {
    invalidTransition(this.name, 'aceptarTransferencia');
  }
  rechazarTransferencia(_ctx: GroupContext, _c: string): void {
    invalidTransition(this.name, 'rechazarTransferencia');
  }
  cancelarTransferencia(_ctx: GroupContext, _a: string): void {
    invalidTransition(this.name, 'cancelarTransferencia');
  }
  abandonarGrupo(_ctx: GroupContext, _m: string): void {
    invalidTransition(this.name, 'abandonarGrupo');
  }
  disolverGrupo(_ctx: GroupContext, _a: string): void {
    invalidTransition(this.name, 'disolverGrupo');
  }
}

// ─────────────────────────────────────────────
// Estado 5: TransferRejectedState
// ─────────────────────────────────────────────

/**
 * TransferRejectedState — El candidato rechazó la administración.
 * Estado transitorio: el use-case limpia el candidato y vuelve a ACTIVO.
 * Se persiste en BD como TRANSFERENCIA_RECHAZADA (historial).
 */
export class TransferRejectedState implements IGroupState {
  readonly name = 'TRANSFER_REJECTED';

  solicitarIngreso(_ctx: GroupContext, _s: string): void {
    invalidTransition(this.name, 'solicitarIngreso');
  }
  aprobarSolicitud(_ctx: GroupContext, _s: string, _a: string): void {
    invalidTransition(this.name, 'aprobarSolicitud');
  }
  rechazarSolicitud(_ctx: GroupContext, _s: string, _a: string): void {
    invalidTransition(this.name, 'rechazarSolicitud');
  }
  agregarMiembro(_ctx: GroupContext, _n: string, _a: string): void {
    invalidTransition(this.name, 'agregarMiembro');
  }
  iniciarTransferenciaAdmin(_ctx: GroupContext, _a: string, _c: string): void {
    invalidTransition(this.name, 'iniciarTransferenciaAdmin');
  }
  aceptarTransferencia(_ctx: GroupContext, _c: string): void {
    invalidTransition(this.name, 'aceptarTransferencia');
  }
  rechazarTransferencia(_ctx: GroupContext, _c: string): void {
    invalidTransition(this.name, 'rechazarTransferencia');
  }
  cancelarTransferencia(_ctx: GroupContext, _a: string): void {
    invalidTransition(this.name, 'cancelarTransferencia');
  }
  abandonarGrupo(_ctx: GroupContext, _m: string): void {
    invalidTransition(this.name, 'abandonarGrupo');
  }
  disolverGrupo(_ctx: GroupContext, _a: string): void {
    invalidTransition(this.name, 'disolverGrupo');
  }
}

// ─────────────────────────────────────────────
// Estado 6: CancelledTransferState
// ─────────────────────────────────────────────

/**
 * CancelledTransferState — El admin canceló la transferencia en curso.
 * Estado transitorio: el use-case limpia el candidato y vuelve a ACTIVO.
 * Se persiste en BD como CANCELADO (historial).
 */
export class CancelledTransferState implements IGroupState {
  readonly name = 'TRANSFER_CANCELLED';

  solicitarIngreso(_ctx: GroupContext, _s: string): void {
    invalidTransition(this.name, 'solicitarIngreso');
  }
  aprobarSolicitud(_ctx: GroupContext, _s: string, _a: string): void {
    invalidTransition(this.name, 'aprobarSolicitud');
  }
  rechazarSolicitud(_ctx: GroupContext, _s: string, _a: string): void {
    invalidTransition(this.name, 'rechazarSolicitud');
  }
  agregarMiembro(_ctx: GroupContext, _n: string, _a: string): void {
    invalidTransition(this.name, 'agregarMiembro');
  }
  iniciarTransferenciaAdmin(_ctx: GroupContext, _a: string, _c: string): void {
    invalidTransition(this.name, 'iniciarTransferenciaAdmin');
  }
  aceptarTransferencia(_ctx: GroupContext, _c: string): void {
    invalidTransition(this.name, 'aceptarTransferencia');
  }
  rechazarTransferencia(_ctx: GroupContext, _c: string): void {
    invalidTransition(this.name, 'rechazarTransferencia');
  }
  cancelarTransferencia(_ctx: GroupContext, _a: string): void {
    invalidTransition(this.name, 'cancelarTransferencia');
  }
  abandonarGrupo(_ctx: GroupContext, _m: string): void {
    invalidTransition(this.name, 'abandonarGrupo');
  }
  disolverGrupo(_ctx: GroupContext, _a: string): void {
    invalidTransition(this.name, 'disolverGrupo');
  }
}

// ─────────────────────────────────────────────
// Estado 7: ClosingState
// ─────────────────────────────────────────────

/**
 * ClosingState — El último miembro (admin) está saliendo.
 * Estado transitorio para señalizar al use-case que debe ejecutar deleteGroup.
 */
export class ClosingState implements IGroupState {
  readonly name = 'CLOSING';

  solicitarIngreso(_ctx: GroupContext, _s: string): void {
    invalidTransition(this.name, 'solicitarIngreso');
  }
  aprobarSolicitud(_ctx: GroupContext, _s: string, _a: string): void {
    invalidTransition(this.name, 'aprobarSolicitud');
  }
  rechazarSolicitud(_ctx: GroupContext, _s: string, _a: string): void {
    invalidTransition(this.name, 'rechazarSolicitud');
  }
  agregarMiembro(_ctx: GroupContext, _n: string, _a: string): void {
    invalidTransition(this.name, 'agregarMiembro');
  }
  iniciarTransferenciaAdmin(_ctx: GroupContext, _a: string, _c: string): void {
    invalidTransition(this.name, 'iniciarTransferenciaAdmin');
  }
  aceptarTransferencia(_ctx: GroupContext, _c: string): void {
    invalidTransition(this.name, 'aceptarTransferencia');
  }
  rechazarTransferencia(_ctx: GroupContext, _c: string): void {
    invalidTransition(this.name, 'rechazarTransferencia');
  }
  cancelarTransferencia(_ctx: GroupContext, _a: string): void {
    invalidTransition(this.name, 'cancelarTransferencia');
  }

  abandonarGrupo(ctx: GroupContext, adminId: string): void {
    assertIsAdmin(ctx.group, adminId);
    ctx.transitionTo(new DissolvedState());
  }

  disolverGrupo(ctx: GroupContext, adminId: string): void {
    assertIsAdmin(ctx.group, adminId);
    ctx.transitionTo(new DissolvedState());
  }
}

// ─────────────────────────────────────────────
// Estado 8: DissolvedState
// ─────────────────────────────────────────────

/**
 * DissolvedState — Estado terminal. El grupo ha sido eliminado.
 */
export class DissolvedState implements IGroupState {
  readonly name = 'DISSOLVED';

  solicitarIngreso(_ctx: GroupContext, _s: string): void {
    invalidTransition(this.name, 'solicitarIngreso');
  }
  aprobarSolicitud(_ctx: GroupContext, _s: string, _a: string): void {
    invalidTransition(this.name, 'aprobarSolicitud');
  }
  rechazarSolicitud(_ctx: GroupContext, _s: string, _a: string): void {
    invalidTransition(this.name, 'rechazarSolicitud');
  }
  agregarMiembro(_ctx: GroupContext, _n: string, _a: string): void {
    invalidTransition(this.name, 'agregarMiembro');
  }
  iniciarTransferenciaAdmin(_ctx: GroupContext, _a: string, _c: string): void {
    invalidTransition(this.name, 'iniciarTransferenciaAdmin');
  }
  aceptarTransferencia(_ctx: GroupContext, _c: string): void {
    invalidTransition(this.name, 'aceptarTransferencia');
  }
  rechazarTransferencia(_ctx: GroupContext, _c: string): void {
    invalidTransition(this.name, 'rechazarTransferencia');
  }
  cancelarTransferencia(_ctx: GroupContext, _a: string): void {
    invalidTransition(this.name, 'cancelarTransferencia');
  }
  abandonarGrupo(_ctx: GroupContext, _m: string): void {
    invalidTransition(this.name, 'abandonarGrupo');
  }
  disolverGrupo(_ctx: GroupContext, _a: string): void {
    invalidTransition(this.name, 'disolverGrupo');
  }
}

// ─────────────────────────────────────────────
// Factory — determina el estado inicial desde un GroupRecord
// ─────────────────────────────────────────────

export class GroupStateFactory {
  /**
   * Re-hidrata el estado del patrón State desde el campo `estado` persistido en BD.
   * Los estados TRANSFERENCIA_ACEPTADA, TRANSFERENCIA_RECHAZADA y CANCELADO
   * se tratan como ACTIVO al recargar (son estados de historial).
   */
  static fromGroup(group: GroupRecord): IGroupState {
    switch (group.estado) {
      case 'PENDIENTE_TRANSFERENCIA':
        return new PendingTransferState();
      case 'CERRADO':
        return new DissolvedState();
      case 'TRANSFERENCIA_ACEPTADA':
      case 'TRANSFERENCIA_RECHAZADA':
      case 'CANCELADO':
      case 'ACTIVO':
      default:
        return group.miembros.length <= 1 ? new FormingState() : new ActiveState();
    }
  }

  /**
   * Convierte el nombre del estado del patrón State al valor del enum de BD.
   * Retorna null para estados que no deben persistirse.
   */
  static toGroupStatus(stateName: string): GroupStatus | null {
    switch (stateName) {
      case 'FORMING':
      case 'ACTIVE':
        return 'ACTIVO';
      case 'PENDING_TRANSFER':
        return 'PENDIENTE_TRANSFERENCIA';
      case 'TRANSFER_ACCEPTED':
        return 'TRANSFERENCIA_ACEPTADA';
      case 'TRANSFER_REJECTED':
        return 'TRANSFERENCIA_RECHAZADA';
      case 'TRANSFER_CANCELLED':
        return 'CANCELADO';
      case 'CLOSING':
      case 'DISSOLVED':
        return 'CERRADO';
      default:
        return null;
    }
  }
}
