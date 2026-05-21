import { NotificacionService } from '../../notifications/application/NotificacionService';
import { NotificacionBase } from '../../../shared/notificacion/INotificacion';
import { ISesionEstudioRepository } from '../domain/contracts';

export class RecordatorioScheduler {
  private intervalo: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly sesionRepository: ISesionEstudioRepository,
    private readonly notificacionService: NotificacionService,
  ) {}

  iniciar(): void {
    this.intervalo = setInterval(() => void this.verificar(), 60_000);
  }

  detener(): void {
    if (this.intervalo) clearInterval(this.intervalo);
  }

  private async verificar(): Promise<void> {
    const pendientes = await this.sesionRepository.obtenerSesionesPendientesRecordatorio(new Date());

    for (const sesion of pendientes) {
      // Obtener los IDs de todos los destinatarios
      const destinatariosIds = new Set<string>();

      // El creador siempre recibe recordatorio
      destinatariosIds.add(sesion.creadorId);

      // Si tiene asistentes registrados, notificar a todos
      if (sesion.asistentes && sesion.asistentes.length > 0) {
        for (const asistente of sesion.asistentes) {
          destinatariosIds.add(asistente.usuarioId);
        }
      }

      // Notificar a cada destinatario y persistir la notificación
      for (const destinatarioId of destinatariosIds) {
        const notificacion = new NotificacionBase(
          `Recordatorio: "${sesion.titulo}" comienza en ${sesion.recordatorioMinutos} minutos.`,
          destinatarioId,
          new Date(),
        );

        await this.notificacionService
          .notificarYPersistir(
            notificacion.render(),
            destinatarioId,
            'recordatorio',
            `Recordatorio: ${sesion.titulo}`,
            sesion.id,
          )
          .catch((error) =>
            console.error(`[RecordatorioScheduler] Error al notificar a ${destinatarioId}:`, error),
          );
      }

      await this.sesionRepository.marcarRecordatorioEnviado(sesion.id);
    }
  }
}
