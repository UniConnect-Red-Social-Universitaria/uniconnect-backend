import { MensajeDecorator } from './MensajeDecorator';
import { MensajeDTO } from './IMensaje';

export interface ArchivoDTO {
  nombre: string;
  url: string;
  tamaño?: number;
  tipo?: string;
}

export class MensajeConArchivo extends MensajeDecorator {
  constructor(
    wrapped: any,
    private archivo: ArchivoDTO,
  ) {
    super(wrapped);
  }

  render(): MensajeDTO {
    return {
      ...this.wrapped.render(),
      archivo: this.archivo,
    };
  }

  getArchivo(): ArchivoDTO {
    return this.archivo;
  }
}
