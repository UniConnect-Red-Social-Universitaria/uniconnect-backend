import { IPerfilEstudiante, PerfilBaseDTO } from '../../domain/IPerfilEstudiante';

export class PerfilBase implements IPerfilEstudiante {
  constructor(private readonly datos: PerfilBaseDTO) {}

  render(): PerfilBaseDTO {
    return { ...this.datos };
  }
}
