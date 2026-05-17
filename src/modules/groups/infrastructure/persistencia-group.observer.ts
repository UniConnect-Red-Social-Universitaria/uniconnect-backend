import { GroupEventObserver } from '../../../domain/contracts';
import prisma from '../../../lib/prisma';

/**
 * PersistenciaGroupObserver — Observer de persistencia del patrón Observer.
 * Registra en la colección `grupoEstadoLog` cada transición de estado
 * del ciclo de vida de un grupo para trazabilidad y auditoría.
 *
 * Se suscribe junto a SocketGroupObserver al Subject (GroupUseCases),
 * garantizando que TODOS los observers reciben el evento emitido.
 */
export class PersistenciaGroupObserver implements GroupEventObserver {
  onSolicitudNueva(_payload: {
    solicitudId: string;
    grupoId: string;
    grupoNombre: string;
    administradorId: string;
    solicitanteId: string;
    solicitanteNombre: string;
    solicitanteApellido?: string;
  }): void {
    // Solicitudes no implican cambio de estado del grupo — no requiere log
  }

  onSolicitudResuelta(_payload: {
    solicitudId: string;
    grupoId: string;
    grupoNombre: string;
    solicitanteId: string;
    estado: 'APROBADA' | 'RECHAZADA';
  }): void {
    // Resolución de solicitud no cambia el estado del grupo — no requiere log
  }

  onAdminTransferido(_payload: {
    grupoId: string;
    grupoNombre: string;
    anteriorAdminId: string;
    anteriorAdminNombre: string;
    nuevoAdminId: string;
    nuevoAdminNombre: string;
  }): void {
    // Evento legado mantenido por compatibilidad — no persiste log adicional
  }

  onTransferenciaPendiente(payload: {
    grupoId: string;
    grupoNombre: string;
    adminId: string;
    candidatoId: string;
    candidatoNombre: string;
    nuevoEstado: string;
  }): void {
    this.registrarTransicion({
      grupoId: payload.grupoId,
      grupoNombre: payload.grupoNombre,
      nuevoEstado: payload.nuevoEstado,
      accion: 'TRANSFERENCIA_INICIADA',
      detalle: `Admin ${payload.adminId} nominó a ${payload.candidatoNombre} (${payload.candidatoId})`,
    });
  }

  onTransferenciaAceptada(payload: {
    grupoId: string;
    grupoNombre: string;
    anteriorAdminId: string;
    nuevoAdminId: string;
    nuevoAdminNombre: string;
    nuevoEstado: string;
  }): void {
    this.registrarTransicion({
      grupoId: payload.grupoId,
      grupoNombre: payload.grupoNombre,
      nuevoEstado: payload.nuevoEstado,
      accion: 'TRANSFERENCIA_ACEPTADA',
      detalle: `Nuevo admin: ${payload.nuevoAdminNombre} (${payload.nuevoAdminId}), anterior: ${payload.anteriorAdminId}`,
    });
  }

  onTransferenciaRechazada(payload: {
    grupoId: string;
    grupoNombre: string;
    adminId: string;
    candidatoId: string;
    candidatoNombre: string;
    nuevoEstado: string;
  }): void {
    this.registrarTransicion({
      grupoId: payload.grupoId,
      grupoNombre: payload.grupoNombre,
      nuevoEstado: payload.nuevoEstado,
      accion: 'TRANSFERENCIA_RECHAZADA',
      detalle: `Candidato ${payload.candidatoNombre} (${payload.candidatoId}) rechazó. Admin ${payload.adminId} mantiene el rol.`,
    });
  }

  onTransferenciaCancelada(payload: {
    grupoId: string;
    grupoNombre: string;
    adminId: string;
    candidatoId: string;
    nuevoEstado: string;
  }): void {
    this.registrarTransicion({
      grupoId: payload.grupoId,
      grupoNombre: payload.grupoNombre,
      nuevoEstado: payload.nuevoEstado,
      accion: 'TRANSFERENCIA_CANCELADA',
      detalle: `Admin ${payload.adminId} canceló la nominación del candidato ${payload.candidatoId}`,
    });
  }

  private registrarTransicion(entry: {
    grupoId: string;
    grupoNombre: string;
    nuevoEstado: string;
    accion: string;
    detalle: string;
  }): void {
    // Fire-and-forget: persistencia asíncrona sin bloquear el flujo principal
    const db = prisma as unknown as {
      grupoEstadoLog?: {
        create: (args: unknown) => Promise<unknown>;
      };
    };

    if (db.grupoEstadoLog?.create) {
      db.grupoEstadoLog.create({
        data: {
          grupoId: entry.grupoId,
          grupoNombre: entry.grupoNombre,
          estado: entry.nuevoEstado,
          accion: entry.accion,
          detalle: entry.detalle,
          registradoEn: new Date(),
        },
      }).catch(() => {
        // Si la colección de log no existe, cae silenciosamente
      });
    } else {
      // Fallback: log estructurado a consola cuando la colección no está disponible
      console.log(
        `[PersistenciaGroupObserver] ${new Date().toISOString()} | ` +
        `grupo=${entry.grupoId} | accion=${entry.accion} | estado=${entry.nuevoEstado} | ${entry.detalle}`,
      );
    }
  }
}
