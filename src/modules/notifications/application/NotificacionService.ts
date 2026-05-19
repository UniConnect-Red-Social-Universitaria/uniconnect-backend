import { NotificacionDTO } from '../../../shared/notificacion/INotificacion';
import { INotificacionStrategy, ResultadoEnvio } from '../domain/INotificacionStrategy';
import { CanalNotificacion, PreferenciaCanalRepository } from '../domain/contracts';

export class NotificacionService {
  constructor(
    private readonly estrategias: INotificacionStrategy[],
    private readonly preferenciaRepository: PreferenciaCanalRepository,
  ) {}

  // ✅ Inyecta tipoEvento en la notificación antes de enviar:
async notificar(
  notificacion: NotificacionDTO,
  usuarioId: string,
  tipoEvento: string,
): Promise<ResultadoEnvio[]> {
  const preferencias = await this.preferenciaRepository.obtenerPreferencias(usuarioId, tipoEvento);
  const resultados: ResultadoEnvio[] = [];

  const notificacionConTipo = { ...notificacion, tipoEvento }; // ← AGREGA

  for (const estrategia of this.estrategias) {
    if (!preferencias.canalesActivos.includes(estrategia.canal as CanalNotificacion)) {
      continue;
    }
    try {
      const resultado = await estrategia.enviar(notificacionConTipo); // ← usa notificacionConTipo
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
}
