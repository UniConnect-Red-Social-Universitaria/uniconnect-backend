import { NotificacionDTO } from '../../../shared/notificacion/INotificacion';

export interface ResultadoEnvio {
  canal: string;
  exito: boolean;
  error?: string;
}

export interface INotificacionStrategy {
  readonly canal: string;
  enviar(notificacion: NotificacionDTO): Promise<ResultadoEnvio>;
}
