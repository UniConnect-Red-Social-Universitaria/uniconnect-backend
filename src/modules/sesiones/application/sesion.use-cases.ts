import { AuthenticatedUser } from '../../../domain/contracts';
import { ApplicationError } from '../../../shared/application-error';
import {
  AlcanceModificacion,
  FrecuenciaRecurrencia,
  ISesionEstudioRepository,
  ModificarSesionData,
} from '../domain/contracts';

const FRECUENCIAS_VALIDAS: FrecuenciaRecurrencia[] = ['DIARIA', 'SEMANAL', 'QUINCENAL'];
const ALCANCES_VALIDOS: AlcanceModificacion[] = ['solo_esta', 'esta_y_siguientes'];

export class SesionEstudioUseCases {
  constructor(private readonly sesionRepository: ISesionEstudioRepository) {}

  async crearSerie(
    usuario: AuthenticatedUser | undefined,
    titulo: unknown,
    descripcion: unknown,
    lugar: unknown,
    frecuencia: unknown,
    fechaInicio: unknown,
    fechaFin: unknown,
    recordatorioMinutos: unknown,
  ) {
    const authUser = this.requireAuth(usuario);

    if (typeof titulo !== 'string' || !titulo.trim())
      throw new ApplicationError(400, 'El título es requerido');
    if (typeof descripcion !== 'string' || !descripcion.trim())
      throw new ApplicationError(400, 'La descripción es requerida');
    if (typeof lugar !== 'string' || !lugar.trim())
      throw new ApplicationError(400, 'El lugar es requerido');
    if (typeof frecuencia !== 'string' || !(FRECUENCIAS_VALIDAS as string[]).includes(frecuencia))
      throw new ApplicationError(400, `frecuencia debe ser: ${FRECUENCIAS_VALIDAS.join(', ')}`);
    if (typeof fechaInicio !== 'string' || typeof fechaFin !== 'string')
      throw new ApplicationError(400, 'fechaInicio y fechaFin son requeridos en formato ISO');

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime()))
      throw new ApplicationError(400, 'Fechas con formato inválido');
    if (inicio >= fin)
      throw new ApplicationError(400, 'fechaFin debe ser posterior a fechaInicio');
    if (inicio <= new Date())
      throw new ApplicationError(400, 'fechaInicio debe ser una fecha futura');

    const minutos = typeof recordatorioMinutos === 'number' && recordatorioMinutos > 0
      ? recordatorioMinutos
      : 30;

    const serie = await this.sesionRepository.crearSerie({
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      lugar: lugar.trim(),
      frecuencia: frecuencia as FrecuenciaRecurrencia,
      fechaInicio: inicio,
      fechaFin: fin,
      recordatorioMinutos: minutos,
      creadorId: authUser.id,
    });

    return { message: 'Serie de sesiones creada', data: serie };
  }

  async obtenerSesiones(usuario: AuthenticatedUser | undefined) {
    const authUser = this.requireAuth(usuario);
    const sesiones = await this.sesionRepository.obtenerSesionesDeUsuario(authUser.id);
    return { data: sesiones };
  }

  async modificarSesion(
    usuario: AuthenticatedUser | undefined,
    sesionId: unknown,
    alcance: unknown,
    titulo: unknown,
    descripcion: unknown,
    lugar: unknown,
    fecha: unknown,
    recordatorioMinutos: unknown,
  ) {
    const authUser = this.requireAuth(usuario);
    if (typeof sesionId !== 'string') throw new ApplicationError(400, 'sesionId inválido');
    if (typeof alcance !== 'string' || !(ALCANCES_VALIDOS as string[]).includes(alcance))
      throw new ApplicationError(400, `alcance debe ser: ${ALCANCES_VALIDOS.join(', ')}`);

    const sesion = await this.sesionRepository.obtenerSesionPorId(sesionId);
    if (!sesion) throw new ApplicationError(404, 'Sesión no encontrada');
    if (sesion.creadorId !== authUser.id)
      throw new ApplicationError(403, 'No tienes permiso para modificar esta sesión');

    const data: ModificarSesionData = {};
    if (typeof titulo === 'string' && titulo.trim()) data.titulo = titulo.trim();
    if (typeof descripcion === 'string' && descripcion.trim()) data.descripcion = descripcion.trim();
    if (typeof lugar === 'string' && lugar.trim()) data.lugar = lugar.trim();
    if (typeof fecha === 'string') {
      const d = new Date(fecha);
      if (!isNaN(d.getTime())) data.fecha = d;
    }
    if (typeof recordatorioMinutos === 'number' && recordatorioMinutos > 0)
      data.recordatorioMinutos = recordatorioMinutos;

    const actualizadas = await this.sesionRepository.modificarSesion(
      sesionId,
      alcance as AlcanceModificacion,
      data,
    );

    return { message: 'Sesión(es) actualizada(s)', data: actualizadas };
  }

  async cancelarSesion(
    usuario: AuthenticatedUser | undefined,
    sesionId: unknown,
    alcance: unknown,
  ) {
    const authUser = this.requireAuth(usuario);
    if (typeof sesionId !== 'string') throw new ApplicationError(400, 'sesionId inválido');
    if (typeof alcance !== 'string' || !(ALCANCES_VALIDOS as string[]).includes(alcance))
      throw new ApplicationError(400, `alcance debe ser: ${ALCANCES_VALIDOS.join(', ')}`);

    const sesion = await this.sesionRepository.obtenerSesionPorId(sesionId);
    if (!sesion) throw new ApplicationError(404, 'Sesión no encontrada');
    if (sesion.creadorId !== authUser.id)
      throw new ApplicationError(403, 'No tienes permiso para cancelar esta sesión');

    await this.sesionRepository.cancelarSesion(sesionId, alcance as AlcanceModificacion);
    return { message: 'Sesión(es) cancelada(s)' };
  }

  private requireAuth(usuario: AuthenticatedUser | undefined) {
    if (!usuario) throw new ApplicationError(401, 'Usuario no autenticado');
    return usuario;
  }
}
