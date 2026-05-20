import { NotificacionDTO } from '../../../shared/notificacion/INotificacion';
import { INotificacionStrategy, ResultadoEnvio } from '../domain/INotificacionStrategy';
import { CanalNotificacion, PreferenciaCanalRepository } from '../domain/contracts';
import { PrismaNotificacionRepository, CreateNotificacionData } from '../infrastructure/prisma-notificacion.repository';

export class NotificacionService {
  constructor(
    private readonly estrategias: INotificacionStrategy[],
    private readonly preferenciaRepository: PreferenciaCanalRepository,
    private readonly notificacionRepository?: PrismaNotificacionRepository,
  ) {}

  async notificar(
    notificacion: NotificacionDTO,
    usuarioId: string,
    tipoEvento: string,
  ): Promise<ResultadoEnvio[]> {
    const preferencias = await this.preferenciaRepository.obtenerPreferencias(usuarioId, tipoEvento);
    const resultados: ResultadoEnvio[] = [];

    const notificacionConTipo = { ...notificacion, tipoEvento };

    for (const estrategia of this.estrategias) {
      if (!preferencias.canalesActivos.includes(estrategia.canal as CanalNotificacion)) {
        continue;
      }
      try {
        const resultado = await estrategia.enviar(notificacionConTipo);
        resultados.push(resultado);
      } catch (error) {
        resultados.push({
          canal: estrategia.canal,
          exito: false,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    return resultados;
  }

  async notificarYPersistir(
    notificacion: NotificacionDTO,
    usuarioId: string,
    tipoEvento: string,
    titulo: string,
    referenciaId?: string,
  ): Promise<ResultadoEnvio[]> {
    if (this.notificacionRepository) {
      const data: CreateNotificacionData = {
        usuarioId,
        tipo: tipoEvento,
        titulo,
        mensaje: notificacion.mensaje,
        referenciaId,
      };
      this.notificacionRepository.crear(data).catch((err) => {
        console.error('[NotificacionService] Error al persistir notificación:', err);
      });
    }
    return this.notificar(notificacion, usuarioId, tipoEvento);
  }
}
