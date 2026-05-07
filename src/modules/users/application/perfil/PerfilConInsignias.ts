import {
  IPerfilEstudiante,
  Insignia,
  PerfilConInsigniasDTO,
} from '../../domain/IPerfilEstudiante';
import { PerfilDecorator } from './PerfilDecorator';

export class PerfilConInsignias extends PerfilDecorator {
  constructor(
    wrapped: IPerfilEstudiante,
    private readonly insignias: Insignia[],
  ) {
    super(wrapped);
  }

  render(): PerfilConInsigniasDTO {
    return {
      ...this.wrapped.render(),
      insignias: this.insignias,
    };
  }
}
