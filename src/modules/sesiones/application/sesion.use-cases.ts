import { AuthenticatedUser, UserRepository } from '../../../domain/contracts';
import { ApplicationError } from '../../../shared/application-error';
import {
  AlcanceModificacion,
  CalendarioSesionDTO,
  EstadoAsistencia,
  FrecuenciaRecurrencia,
  ISesionEstudioRepository,
  ModificarSesionData,
} from '../domain/contracts';
import { SesionSubject } from '../domain/SesionSubject';

const FRECUENCIAS_VALIDAS: FrecuenciaRecurrencia[] = ['DIARIA', 'SEMANAL', 'QUINCENAL'];
const ALCANCES_VALIDOS: AlcanceModificacion[] = ['solo_esta', 'esta_y_siguientes'];

export class SesionEstudioUseCases {
  constructor(
    private readonly sesionRepository: ISesionEstudioRepository,
    private readonly sesionSubject: SesionSubject,
    private readonly userRepository?: UserRepository,
  ) {}

  async crearSerie(
    usuario: AuthenticatedUser | undefined,
    titulo: unknown,
    descripcion: unknown,
    lugar: unknown,
    frecuencia: unknown,
    fechaInicio: unknown,
    fechaFin: unknown,
    recordatorioMinutos: unknown,
    grupoId?: unknown,
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

    const grupoIdValido = typeof grupoId === 'string' && grupoId.trim() ? grupoId.trim() : undefined;

    const serie = await this.sesionRepository.crearSerie({
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      lugar: lugar.trim(),
      frecuencia: frecuencia as FrecuenciaRecurrencia,
      fechaInicio: inicio,
      fechaFin: fin,
      recordatorioMinutos: minutos,
      creadorId: authUser.id,
      grupoId: grupoIdValido,
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

  // ── Criterio 3: Cancelar múltiples sesiones específicas ──

  async cancelarSesionesPorIds(
    usuario: AuthenticatedUser | undefined,
    sesionIds: unknown,
  ) {
    const authUser = this.requireAuth(usuario);
    if (!Array.isArray(sesionIds) || sesionIds.length === 0)
      throw new ApplicationError(400, 'Debes enviar un arreglo de sesionIds');

    const ids = sesionIds.filter((id): id is string => typeof id === 'string');
    if (ids.length === 0)
      throw new ApplicationError(400, 'IDs de sesión inválidos');

    const canceladas = await this.sesionRepository.cancelarSesionesPorIds(ids, authUser.id);
    if (canceladas === 0)
      throw new ApplicationError(404, 'No se encontraron sesiones para cancelar');

    return { message: `${canceladas} sesión(es) cancelada(s)`, data: { canceladas } };
  }

  // ── Criterio 4: Calendario web ──

  async obtenerCalendario(usuario: AuthenticatedUser | undefined) {
    const authUser = this.requireAuth(usuario);
    const sesiones = await this.sesionRepository.obtenerSesionesDeUsuarioComoAsistenteOcreador(authUser.id);

    const calendario: CalendarioSesionDTO[] = await Promise.all(
      sesiones.map(async (s) => {
        const recurrencia = await this.sesionRepository.obtenerFrecuenciaSerie(s.serieId);
        let grupoNombre: string | undefined;
        if (s.grupoId) {
          grupoNombre = await this.sesionRepository.obtenerGrupoNombre(s.grupoId) ?? undefined;
        }
        const miAsistencia = s.asistentes?.find(a => a.usuarioId === authUser.id)?.estado ?? null;
        return {
          id: s.id,
          titulo: s.titulo,
          descripcion: s.descripcion,
          lugar: s.lugar,
          fecha: s.fecha,
          recordatorioMinutos: s.recordatorioMinutos,
          cancelada: s.cancelada,
          recurrencia,
          serieId: s.serieId,
          grupoId: s.grupoId,
          grupoNombre,
          creadorId: s.creadorId,
          asistentes: s.asistentes ?? [],
          miAsistencia,
        };
      }),
    );

    calendario.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

    return { data: calendario };
  }

  // ── Criterio 5: Detalle de sesión y asistencia ──

  async obtenerDetalleSesion(
    usuario: AuthenticatedUser | undefined,
    sesionId: unknown,
  ) {
    const authUser = this.requireAuth(usuario);
    if (typeof sesionId !== 'string') throw new ApplicationError(400, 'sesionId inválido');

    const sesion = await this.sesionRepository.obtenerSesionPorId(sesionId);
    if (!sesion) throw new ApplicationError(404, 'Sesión no encontrada');

    const esCreador = sesion.creadorId === authUser.id;
    const esAsistente = sesion.asistentes?.some(a => a.usuarioId === authUser.id);
    if (!esCreador && !esAsistente)
      throw new ApplicationError(403, 'No tienes acceso a esta sesión');

    const recurrencia = await this.sesionRepository.obtenerFrecuenciaSerie(sesion.serieId);
    let grupoNombre: string | undefined;
    if (sesion.grupoId) {
      grupoNombre = await this.sesionRepository.obtenerGrupoNombre(sesion.grupoId) ?? undefined;
    }
    const miAsistencia = sesion.asistentes?.find(a => a.usuarioId === authUser.id)?.estado ?? null;

    const detalle: CalendarioSesionDTO = {
      id: sesion.id,
      titulo: sesion.titulo,
      descripcion: sesion.descripcion,
      lugar: sesion.lugar,
      fecha: sesion.fecha,
      recordatorioMinutos: sesion.recordatorioMinutos,
      cancelada: sesion.cancelada,
      recurrencia,
      serieId: sesion.serieId,
      grupoId: sesion.grupoId,
      grupoNombre,
      creadorId: sesion.creadorId,
      asistentes: sesion.asistentes ?? [],
      miAsistencia,
    };

    return { data: detalle };
  }

  async confirmarAsistencia(
    usuario: AuthenticatedUser | undefined,
    sesionId: unknown,
  ) {
    return this.actualizarAsistencia(usuario, sesionId, 'CONFIRMADA');
  }

  async declinarAsistencia(
    usuario: AuthenticatedUser | undefined,
    sesionId: unknown,
  ) {
    return this.actualizarAsistencia(usuario, sesionId, 'DECLINADA');
  }

  private async actualizarAsistencia(
    usuario: AuthenticatedUser | undefined,
    sesionId: unknown,
    estado: EstadoAsistencia,
  ) {
    const authUser = this.requireAuth(usuario);
    if (typeof sesionId !== 'string') throw new ApplicationError(400, 'sesionId inválido');

    const sesion = await this.sesionRepository.obtenerSesionPorId(sesionId);
    if (!sesion) throw new ApplicationError(404, 'Sesión no encontrada');
    if (sesion.cancelada) throw new ApplicationError(400, 'No puedes confirmar asistencia a una sesión cancelada');

    const esAsistente = sesion.asistentes?.some(a => a.usuarioId === authUser.id);
    if (!esAsistente && sesion.creadorId !== authUser.id)
      throw new ApplicationError(403, 'No eres participante de esta sesión');

    const previa = sesion.asistentes?.find(a => a.usuarioId === authUser.id);
    if (previa && previa.estado === estado)
      throw new ApplicationError(409, `Ya tienes estado "${estado}" en esta sesión`);

    const resultado = await this.sesionRepository.actualizarEstadoAsistencia(sesionId, authUser.id, estado);

    // Observer — notificar al organizador si el participante no es el creador
    if (sesion.creadorId !== authUser.id && this.userRepository) {
      const userInfo = await this.userRepository.findSafeById(authUser.id);
      const nombreCompleto = userInfo ? `${userInfo.nombre} ${userInfo.apellido}` : authUser.nombre;

      this.sesionSubject.notificarCambioAsistencia({
        sesionId,
        sesionTitulo: sesion.titulo,
        usuarioId: authUser.id,
        usuarioNombre: nombreCompleto,
        organizadorId: sesion.creadorId,
        nuevoEstado: estado,
      });
    }

    return { message: `Asistencia ${estado === 'CONFIRMADA' ? 'confirmada' : 'declinada'}`, data: resultado };
  }

  private requireAuth(usuario: AuthenticatedUser | undefined) {
    if (!usuario) throw new ApplicationError(401, 'Usuario no autenticado');
    return usuario;
  }
}
