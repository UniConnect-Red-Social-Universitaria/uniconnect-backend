import { MensajeDecorator } from './MensajeDecorator';
import { MensajeDTO } from './IMensaje';

export interface ReaccionDTO {
  emoji: string;
  usuarioId: string;
  fecha: Date;
}

export class MensajeConReaccion extends MensajeDecorator {
  constructor(
    wrapped: any,
    private reacciones: ReaccionDTO[] = [],
  ) {
    super(wrapped);
  }

  render(): MensajeDTO {
    return {
      ...this.wrapped.render(),
      reacciones: this.reacciones,
    };
  }

  agregarReaccion(reaccion: ReaccionDTO): void {
    this.reacciones.push(reaccion);
  }

  getReacciones(): ReaccionDTO[] {
    return this.reacciones;
  }
}
