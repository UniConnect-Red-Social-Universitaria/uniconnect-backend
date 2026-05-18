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
      const notificacion = new NotificacionBase(
        `Recordatorio: "${sesion.titulo}" comienza en ${sesion.recordatorioMinutos} minutos.`,
        sesion.creadorId,
        new Date(),
      );

      await this.notificacionService.notificar(notificacion.render(), sesion.creadorId, 'recordatorio');
      await this.sesionRepository.marcarRecordatorioEnviado(sesion.id);
    }
  }
}
