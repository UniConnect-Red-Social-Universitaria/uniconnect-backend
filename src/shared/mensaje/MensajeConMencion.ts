import { MensajeDecorator } from './MensajeDecorator';
import { MensajeDTO } from './IMensaje';

export interface MencionDTO {
  usuarioId: string;
  nombre: string;
  correo: string;
}

export class MensajeConMencion extends MensajeDecorator {
  constructor(
    wrapped: any,
    private menciones: MencionDTO[],
  ) {
    super(wrapped);
  }

  render(): MensajeDTO {
    return {
      ...this.wrapped.render(),
      menciones: this.menciones,
    };
  }

  getMenciones(): MencionDTO[] {
    return this.menciones;
  }
}
