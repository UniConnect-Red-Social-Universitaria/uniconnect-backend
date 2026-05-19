import { NotificacionDTO } from '../../../../shared/notificacion/INotificacion';
import { logger } from '../../../../lib/logger';
import { INotificacionStrategy, ResultadoEnvio } from '../../domain/INotificacionStrategy';
import * as nodemailer from 'nodemailer';

// Asumo que tienes una interfaz parecida a esta en tu dominio
interface IUsuarioRepository {
  obtenerEmailPorId(usuarioId: string): Promise<string | null>;
}

export class EmailInstitucionalStrategy implements INotificacionStrategy {
  readonly canal = 'email';
  
  constructor(
    private readonly transporter: nodemailer.Transporter,
    private readonly usuarioRepository: IUsuarioRepository // Inyectamos esto para buscar el correo
  ) {}

  async enviar(notificacion: NotificacionDTO): Promise<ResultadoEnvio> {
    try {
      // 1. Obtener el email real a partir del ID del destinatario
      const emailReal = await this.usuarioRepository.obtenerEmailPorId(notificacion.destinatario);
      
      if (!emailReal) {
        throw new Error(`Usuario ${notificacion.destinatario} no tiene un email registrado`);
      }

      // 2. Enviar el correo
      const info = await this.transporter.sendMail({
        from: '"UniConnect" <no-reply@uniconnect.edu>',
        to: emailReal,
        subject: 'Notificación UniConnect',
        text: notificacion.mensaje,
        // html: `<b>${notificacion.mensaje}</b>` // Opcional: Puedes enviar HTML
      });

      logger.info(`[Email] Enviado a: ${emailReal} | MessageId: ${info.messageId}`);

      return { canal: this.canal, exito: true };
    } catch (error) {
      logger.error(`[Email] Falló el envío para ${notificacion.destinatario}:`, error);
      throw error; 
    }
  }
}