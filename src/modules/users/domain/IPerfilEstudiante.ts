export interface PerfilBaseDTO {
  id: string;
  nombre: string;
  apellido: string;
  carrera: string;
  semestre: number | null;
  asignaturasActivas: string[];
}

export interface IPerfilEstudiante {
  render(): PerfilBaseDTO;
}

export interface EstadisticasPerfil {
  gruposCreados: number;
  gruposParticipa: number;
  mensajesEnviados: number;
}

export type Insignia =
  | 'fundador'
  | 'participante-activo'
  | 'comunicador'
  | 'colaborador';

export interface PerfilConEstadisticasDTO extends PerfilBaseDTO {
  estadisticas: EstadisticasPerfil;
}

export interface PerfilConInsigniasDTO extends PerfilBaseDTO {
  insignias: Insignia[];
}

export interface EstadisticasPerfilRepository {
  obtenerEstadisticas(usuarioId: string): Promise<EstadisticasPerfil>;
}

export function calcularInsignias(stats: EstadisticasPerfil): Insignia[] {
  const insignias: Insignia[] = [];
  if (stats.gruposCreados >= 1) insignias.push('fundador');
  if (stats.gruposParticipa >= 3) insignias.push('participante-activo');
  if (stats.mensajesEnviados >= 10) insignias.push('comunicador');
  if (stats.gruposCreados >= 1 && stats.gruposParticipa >= 1 && stats.mensajesEnviados >= 1)
    insignias.push('colaborador');
  return insignias;
}
