import { IMensaje, MensajeDTO } from './IMensaje';

export abstract class MensajeDecorator implements IMensaje {
  constructor(protected readonly wrapped: IMensaje) {}

  getContenido(): string {
    return this.wrapped.getContenido();
  }

  render(): MensajeDTO {
    return this.wrapped.render();
  }
}
