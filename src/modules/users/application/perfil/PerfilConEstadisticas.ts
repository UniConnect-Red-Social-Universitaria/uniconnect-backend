import {
  EstadisticasPerfil,
  IPerfilEstudiante,
  PerfilConEstadisticasDTO,
} from '../../domain/IPerfilEstudiante';
import { PerfilDecorator } from './PerfilDecorator';

export class PerfilConEstadisticas extends PerfilDecorator {
  constructor(
    wrapped: IPerfilEstudiante,
    private readonly estadisticas: EstadisticasPerfil,
  ) {
    super(wrapped);
  }

  render(): PerfilConEstadisticasDTO {
    return {
      ...this.wrapped.render(),
      estadisticas: this.estadisticas,
    };
  }
}
