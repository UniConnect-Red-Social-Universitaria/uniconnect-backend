import { IPerfilEstudiante, PerfilBaseDTO } from '../../domain/IPerfilEstudiante';

export abstract class PerfilDecorator implements IPerfilEstudiante {
  constructor(protected readonly wrapped: IPerfilEstudiante) {}

  render(): PerfilBaseDTO {
    return this.wrapped.render();
  }
}
