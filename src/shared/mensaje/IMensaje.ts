export interface MensajeDTO {
  contenido: string;
  [key: string]: any;
}

export interface IMensaje {
  render(): MensajeDTO;
  getContenido(): string;
}

export class MensajeBase implements IMensaje {
  constructor(private contenido: string) {}

  render(): MensajeDTO {
    return {
      contenido: this.contenido,
    };
  }

  getContenido(): string {
    return this.contenido;
  }
}
