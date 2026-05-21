import { SesionEstudioUseCases } from '../src/modules/sesiones/application/sesion.use-cases';
import type { ISesionEstudioRepository, SesionDTO, SerieDTO, AsistenteDTO } from '../src/modules/sesiones/domain/contracts';
import type { SesionSubject } from '../src/modules/sesiones/domain/SesionSubject';

const USUARIO = { id: 'user-1', correo: 'test@ucaldas.edu.co', nombre: 'Test', materiasCursando: [] };

function makeRepo(overrides: Partial<ISesionEstudioRepository> = {}): ISesionEstudioRepository {
  return {
    crearSerie: jest.fn(),
    obtenerSesionesDeUsuario: jest.fn().mockResolvedValue([]),
    obtenerSesionPorId: jest.fn(),
    modificarSesion: jest.fn(),
    cancelarSesion: jest.fn(),
    cancelarSesionesPorIds: jest.fn().mockResolvedValue(0),
    marcarRecordatorioEnviado: jest.fn(),
    obtenerSesionesPendientesRecordatorio: jest.fn().mockResolvedValue([]),
    crearAsistentesBatch: jest.fn().mockResolvedValue([]),
    obtenerAsistentes: jest.fn().mockResolvedValue([]),
    actualizarEstadoAsistencia: jest.fn(),
    obtenerSesionesDeGrupo: jest.fn().mockResolvedValue([]),
    obtenerSesionesDeUsuarioComoAsistenteOcreador: jest.fn().mockResolvedValue([]),
    obtenerMiembrosGrupo: jest.fn().mockResolvedValue([]),
    obtenerFrecuenciaSerie: jest.fn().mockResolvedValue('SEMANAL'),
    obtenerGrupoNombre: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
}

function makeSesionSubject(): SesionSubject {
  return { notificarCambioAsistencia: jest.fn() } as unknown as SesionSubject;
}

function fechasFuturas() {
  const inicio = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();
  const fin = new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString();
  return { inicio, fin };
}

const SERIE_MOCK: SerieDTO = {
  id: 'serie-1',
  titulo: 'Álgebra lineal',
  descripcion: 'Sesiones de álgebra',
  lugar: 'Biblioteca bloque E',
  frecuencia: 'SEMANAL',
  fechaInicio: new Date(),
  fechaFin: new Date(),
  recordatorioMinutos: 30,
  creadorId: 'user-1',
  sesiones: [],
  createdAt: new Date(),
};

const SESION_MOCK: SesionDTO = {
  id: 'ses-1',
  titulo: 'Álgebra lineal',
  descripcion: 'Sesiones de álgebra',
  lugar: 'Biblioteca bloque E',
  fecha: new Date(),
  recordatorioMinutos: 30,
  cancelada: false,
  modificada: false,
  recordatorioEnviado: false,
  serieId: 'serie-1',
  creadorId: 'user-1',
  createdAt: new Date(),
};

describe('SesionEstudioUseCases', () => {

  // ─── crearSerie ───────────────────────────────────────────────────────────────

  describe('crearSerie', () => {
    it('lanza 401 si no hay usuario autenticado', async () => {
      const uc = new SesionEstudioUseCases(makeRepo(), makeSesionSubject());
      await expect(
        uc.crearSerie(undefined, 'T', 'D', 'L', 'SEMANAL', new Date().toISOString(), new Date().toISOString(), undefined),
      ).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si el título está vacío', async () => {
      const { inicio, fin } = fechasFuturas();
      const uc = new SesionEstudioUseCases(makeRepo(), makeSesionSubject());
      await expect(uc.crearSerie(USUARIO, '   ', 'D', 'L', 'SEMANAL', inicio, fin, undefined)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si la descripción está vacía', async () => {
      const { inicio, fin } = fechasFuturas();
      const uc = new SesionEstudioUseCases(makeRepo(), makeSesionSubject());
      await expect(uc.crearSerie(USUARIO, 'Título', '', 'L', 'SEMANAL', inicio, fin, undefined)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si el lugar está vacío', async () => {
      const { inicio, fin } = fechasFuturas();
      const uc = new SesionEstudioUseCases(makeRepo(), makeSesionSubject());
      await expect(uc.crearSerie(USUARIO, 'Título', 'Desc', '  ', 'SEMANAL', inicio, fin, undefined)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si la frecuencia no es válida', async () => {
      const { inicio, fin } = fechasFuturas();
      const uc = new SesionEstudioUseCases(makeRepo(), makeSesionSubject());
      await expect(uc.crearSerie(USUARIO, 'T', 'D', 'L', 'MENSUAL', inicio, fin, undefined)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si fechaInicio no es string', async () => {
      const uc = new SesionEstudioUseCases(makeRepo(), makeSesionSubject());
      await expect(uc.crearSerie(USUARIO, 'T', 'D', 'L', 'SEMANAL', 12345, 'fin', undefined)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si las fechas tienen formato inválido', async () => {
      const uc = new SesionEstudioUseCases(makeRepo(), makeSesionSubject());
      await expect(uc.crearSerie(USUARIO, 'T', 'D', 'L', 'SEMANAL', 'no-es-fecha', 'tampoco', undefined)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si fechaFin es anterior a fechaInicio', async () => {
      const inicio = new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString();
      const fin = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();
      const uc = new SesionEstudioUseCases(makeRepo(), makeSesionSubject());
      await expect(uc.crearSerie(USUARIO, 'T', 'D', 'L', 'SEMANAL', inicio, fin, undefined)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si fechaInicio está en el pasado', async () => {
      const inicio = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const fin = new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString();
      const uc = new SesionEstudioUseCases(makeRepo(), makeSesionSubject());
      await expect(uc.crearSerie(USUARIO, 'T', 'D', 'L', 'SEMANAL', inicio, fin, undefined)).rejects.toMatchObject({ status: 400 });
    });

    it('crea la serie y usa 30 min de recordatorio por defecto cuando no se provee', async () => {
      const { inicio, fin } = fechasFuturas();
      const repo = makeRepo({ crearSerie: jest.fn().mockResolvedValue(SERIE_MOCK) });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      const result = await uc.crearSerie(USUARIO, 'Álgebra', 'Desc', 'Biblio', 'SEMANAL', inicio, fin, undefined);
      expect(repo.crearSerie).toHaveBeenCalledWith(expect.objectContaining({ recordatorioMinutos: 30 }));
      expect(result.data).toEqual(SERIE_MOCK);
    });

    it('respeta el recordatorioMinutos cuando se provee', async () => {
      const { inicio, fin } = fechasFuturas();
      const repo = makeRepo({ crearSerie: jest.fn().mockResolvedValue(SERIE_MOCK) });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      await uc.crearSerie(USUARIO, 'Álgebra', 'Desc', 'Biblio', 'SEMANAL', inicio, fin, 60);
      expect(repo.crearSerie).toHaveBeenCalledWith(expect.objectContaining({ recordatorioMinutos: 60 }));
    });

    it('acepta las tres frecuencias válidas', async () => {
      const { inicio, fin } = fechasFuturas();
      const repo = makeRepo({ crearSerie: jest.fn().mockResolvedValue(SERIE_MOCK) });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      for (const frecuencia of ['DIARIA', 'SEMANAL', 'QUINCENAL'] as const) {
        await expect(uc.crearSerie(USUARIO, 'T', 'D', 'L', frecuencia, inicio, fin, undefined)).resolves.toBeDefined();
      }
    });
  });

  // ─── obtenerSesiones ──────────────────────────────────────────────────────────

  describe('obtenerSesiones', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new SesionEstudioUseCases(makeRepo(), makeSesionSubject());
      await expect(uc.obtenerSesiones(undefined)).rejects.toMatchObject({ status: 401 });
    });

    it('retorna la lista de sesiones del usuario', async () => {
      const repo = makeRepo({ obtenerSesionesDeUsuario: jest.fn().mockResolvedValue([SESION_MOCK]) });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      const result = await uc.obtenerSesiones(USUARIO);
      expect(result.data).toEqual([SESION_MOCK]);
      expect(repo.obtenerSesionesDeUsuario).toHaveBeenCalledWith('user-1');
    });

    it('retorna lista vacía cuando el usuario no tiene sesiones', async () => {
      const repo = makeRepo({ obtenerSesionesDeUsuario: jest.fn().mockResolvedValue([]) });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      const result = await uc.obtenerSesiones(USUARIO);
      expect(result.data).toEqual([]);
    });
  });

  // ─── modificarSesion ──────────────────────────────────────────────────────────

  describe('modificarSesion', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new SesionEstudioUseCases(makeRepo(), makeSesionSubject());
      await expect(uc.modificarSesion(undefined, 'ses-1', 'solo_esta', undefined, undefined, undefined, undefined, undefined)).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si el alcance es inválido', async () => {
      const repo = makeRepo({ obtenerSesionPorId: jest.fn().mockResolvedValue(SESION_MOCK) });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      await expect(uc.modificarSesion(USUARIO, 'ses-1', 'todas', undefined, undefined, undefined, undefined, undefined)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si la sesión no existe', async () => {
      const repo = makeRepo({ obtenerSesionPorId: jest.fn().mockResolvedValue(null) });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      await expect(uc.modificarSesion(USUARIO, 'ses-inexistente', 'solo_esta', undefined, undefined, undefined, undefined, undefined)).rejects.toMatchObject({ status: 404 });
    });

    it('lanza 403 si el usuario no es dueño de la sesión', async () => {
      const otroUsuario = { ...USUARIO, id: 'otro-user' };
      const repo = makeRepo({ obtenerSesionPorId: jest.fn().mockResolvedValue(SESION_MOCK) });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      await expect(uc.modificarSesion(otroUsuario, 'ses-1', 'solo_esta', undefined, undefined, undefined, undefined, undefined)).rejects.toMatchObject({ status: 403 });
    });

    it('modifica solo esta sesión correctamente', async () => {
      const sesionModificada = { ...SESION_MOCK, titulo: 'Nuevo título', modificada: true };
      const repo = makeRepo({
        obtenerSesionPorId: jest.fn().mockResolvedValue(SESION_MOCK),
        modificarSesion: jest.fn().mockResolvedValue([sesionModificada]),
      });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      const result = await uc.modificarSesion(USUARIO, 'ses-1', 'solo_esta', 'Nuevo título', undefined, undefined, undefined, undefined);
      expect(repo.modificarSesion).toHaveBeenCalledWith('ses-1', 'solo_esta', expect.objectContaining({ titulo: 'Nuevo título' }));
      expect(result.data).toEqual([sesionModificada]);
    });

    it('modifica esta sesión y siguientes con el alcance correcto', async () => {
      const repo = makeRepo({
        obtenerSesionPorId: jest.fn().mockResolvedValue(SESION_MOCK),
        modificarSesion: jest.fn().mockResolvedValue([SESION_MOCK]),
      });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      await uc.modificarSesion(USUARIO, 'ses-1', 'esta_y_siguientes', 'Título', 'Desc', 'Nuevo lugar', undefined, undefined);
      expect(repo.modificarSesion).toHaveBeenCalledWith('ses-1', 'esta_y_siguientes', expect.objectContaining({ lugar: 'Nuevo lugar' }));
    });

    it('incluye fecha cuando se pasa string válido', async () => {
      const fechaStr = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      const repo = makeRepo({
        obtenerSesionPorId: jest.fn().mockResolvedValue(SESION_MOCK),
        modificarSesion: jest.fn().mockResolvedValue([SESION_MOCK]),
      });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      await uc.modificarSesion(USUARIO, 'ses-1', 'solo_esta', undefined, undefined, undefined, fechaStr, undefined);
      expect(repo.modificarSesion).toHaveBeenCalledWith('ses-1', 'solo_esta', expect.objectContaining({ fecha: expect.any(Date) }));
    });

    it('omite fecha cuando el string es inválido', async () => {
      const repo = makeRepo({
        obtenerSesionPorId: jest.fn().mockResolvedValue(SESION_MOCK),
        modificarSesion: jest.fn().mockResolvedValue([SESION_MOCK]),
      });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      await uc.modificarSesion(USUARIO, 'ses-1', 'solo_esta', undefined, undefined, undefined, 'no-es-fecha', undefined);
      const callArg = (repo.modificarSesion as jest.Mock).mock.calls[0][2];
      expect(callArg).not.toHaveProperty('fecha');
    });

    it('incluye recordatorioMinutos cuando es número positivo', async () => {
      const repo = makeRepo({
        obtenerSesionPorId: jest.fn().mockResolvedValue(SESION_MOCK),
        modificarSesion: jest.fn().mockResolvedValue([SESION_MOCK]),
      });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      await uc.modificarSesion(USUARIO, 'ses-1', 'solo_esta', undefined, undefined, undefined, undefined, 45);
      expect(repo.modificarSesion).toHaveBeenCalledWith('ses-1', 'solo_esta', expect.objectContaining({ recordatorioMinutos: 45 }));
    });
  });

  // ─── cancelarSesion ───────────────────────────────────────────────────────────

  describe('cancelarSesion', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new SesionEstudioUseCases(makeRepo(), makeSesionSubject());
      await expect(uc.cancelarSesion(undefined, 'ses-1', 'solo_esta')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si el alcance es inválido', async () => {
      const repo = makeRepo({ obtenerSesionPorId: jest.fn().mockResolvedValue(SESION_MOCK) });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      await expect(uc.cancelarSesion(USUARIO, 'ses-1', 'invalido')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si la sesión no existe', async () => {
      const repo = makeRepo({ obtenerSesionPorId: jest.fn().mockResolvedValue(null) });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      await expect(uc.cancelarSesion(USUARIO, 'ses-inexistente', 'solo_esta')).rejects.toMatchObject({ status: 404 });
    });

    it('lanza 403 si el usuario no es dueño de la sesión', async () => {
      const otroUsuario = { ...USUARIO, id: 'otro-user' };
      const repo = makeRepo({ obtenerSesionPorId: jest.fn().mockResolvedValue(SESION_MOCK) });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      await expect(uc.cancelarSesion(otroUsuario, 'ses-1', 'solo_esta')).rejects.toMatchObject({ status: 403 });
    });

    it('cancela solo esta sesión correctamente', async () => {
      const repo = makeRepo({
        obtenerSesionPorId: jest.fn().mockResolvedValue(SESION_MOCK),
        cancelarSesion: jest.fn().mockResolvedValue(undefined),
      });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      const result = await uc.cancelarSesion(USUARIO, 'ses-1', 'solo_esta');
      expect(repo.cancelarSesion).toHaveBeenCalledWith('ses-1', 'solo_esta');
      expect(result.message).toMatch(/cancelad/i);
    });

    it('cancela esta sesión y siguientes correctamente', async () => {
      const repo = makeRepo({
        obtenerSesionPorId: jest.fn().mockResolvedValue(SESION_MOCK),
        cancelarSesion: jest.fn().mockResolvedValue(undefined),
      });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      await uc.cancelarSesion(USUARIO, 'ses-1', 'esta_y_siguientes');
      expect(repo.cancelarSesion).toHaveBeenCalledWith('ses-1', 'esta_y_siguientes');
    });
  });

  // ─── cancelarSesionesPorIds ───────────────────────────────────────────────────

  describe('cancelarSesionesPorIds', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new SesionEstudioUseCases(makeRepo(), makeSesionSubject());
      await expect(uc.cancelarSesionesPorIds(undefined, ['ses-1'])).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si sesionIds no es array', async () => {
      const uc = new SesionEstudioUseCases(makeRepo(), makeSesionSubject());
      await expect(uc.cancelarSesionesPorIds(USUARIO, 'ses-1')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si sesionIds es array vacío', async () => {
      const uc = new SesionEstudioUseCases(makeRepo(), makeSesionSubject());
      await expect(uc.cancelarSesionesPorIds(USUARIO, [])).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si todos los ids son inválidos (no strings)', async () => {
      const uc = new SesionEstudioUseCases(makeRepo(), makeSesionSubject());
      await expect(uc.cancelarSesionesPorIds(USUARIO, [123, null])).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si ninguna sesión fue cancelada', async () => {
      const repo = makeRepo({ cancelarSesionesPorIds: jest.fn().mockResolvedValue(0) });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      await expect(uc.cancelarSesionesPorIds(USUARIO, ['ses-inexistente'])).rejects.toMatchObject({ status: 404 });
    });

    it('cancela múltiples sesiones y retorna el conteo', async () => {
      const repo = makeRepo({ cancelarSesionesPorIds: jest.fn().mockResolvedValue(3) });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      const result = await uc.cancelarSesionesPorIds(USUARIO, ['ses-1', 'ses-2', 'ses-3']);
      expect(repo.cancelarSesionesPorIds).toHaveBeenCalledWith(['ses-1', 'ses-2', 'ses-3'], 'user-1');
      expect(result.data.canceladas).toBe(3);
    });
  });

  // ─── obtenerCalendario ────────────────────────────────────────────────────────

  describe('obtenerCalendario', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new SesionEstudioUseCases(makeRepo(), makeSesionSubject());
      await expect(uc.obtenerCalendario(undefined)).rejects.toMatchObject({ status: 401 });
    });

    it('retorna lista vacía cuando no hay sesiones', async () => {
      const uc = new SesionEstudioUseCases(makeRepo(), makeSesionSubject());
      const result = await uc.obtenerCalendario(USUARIO);
      expect(result.data).toHaveLength(0);
    });

    it('construye el calendario con recurrencia y ordena por fecha', async () => {
      const ahora = Date.now();
      const s1: SesionDTO = { ...SESION_MOCK, id: 'ses-2', fecha: new Date(ahora + 48 * 60 * 60 * 1000), serieId: 'serie-1' };
      const s2: SesionDTO = { ...SESION_MOCK, id: 'ses-1', fecha: new Date(ahora + 24 * 60 * 60 * 1000), serieId: 'serie-1' };
      const repo = makeRepo({
        obtenerSesionesDeUsuarioComoAsistenteOcreador: jest.fn().mockResolvedValue([s1, s2]),
        obtenerFrecuenciaSerie: jest.fn().mockResolvedValue('SEMANAL'),
      });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      const result = await uc.obtenerCalendario(USUARIO);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe('ses-1');
      expect(result.data[0].recurrencia).toBe('SEMANAL');
    });

    it('busca nombre de grupo cuando la sesión tiene grupoId', async () => {
      const sesionConGrupo: SesionDTO = { ...SESION_MOCK, grupoId: 'grupo-1' };
      const repo = makeRepo({
        obtenerSesionesDeUsuarioComoAsistenteOcreador: jest.fn().mockResolvedValue([sesionConGrupo]),
        obtenerGrupoNombre: jest.fn().mockResolvedValue('Grupo Álgebra'),
      });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      const result = await uc.obtenerCalendario(USUARIO);
      expect(repo.obtenerGrupoNombre).toHaveBeenCalledWith('grupo-1');
      expect(result.data[0].grupoNombre).toBe('Grupo Álgebra');
    });
  });

  // ─── obtenerDetalleSesion ─────────────────────────────────────────────────────

  describe('obtenerDetalleSesion', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new SesionEstudioUseCases(makeRepo(), makeSesionSubject());
      await expect(uc.obtenerDetalleSesion(undefined, 'ses-1')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si sesionId no es string', async () => {
      const uc = new SesionEstudioUseCases(makeRepo(), makeSesionSubject());
      await expect(uc.obtenerDetalleSesion(USUARIO, 123)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si la sesión no existe', async () => {
      const repo = makeRepo({ obtenerSesionPorId: jest.fn().mockResolvedValue(null) });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      await expect(uc.obtenerDetalleSesion(USUARIO, 'inexistente')).rejects.toMatchObject({ status: 404 });
    });

    it('lanza 403 si el usuario no es creador ni asistente', async () => {
      const sesionDeOtro = { ...SESION_MOCK, creadorId: 'otro-user', asistentes: [] };
      const repo = makeRepo({ obtenerSesionPorId: jest.fn().mockResolvedValue(sesionDeOtro) });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      await expect(uc.obtenerDetalleSesion(USUARIO, 'ses-1')).rejects.toMatchObject({ status: 403 });
    });

    it('retorna el detalle cuando el usuario es el creador', async () => {
      const repo = makeRepo({ obtenerSesionPorId: jest.fn().mockResolvedValue(SESION_MOCK) });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      const result = await uc.obtenerDetalleSesion(USUARIO, 'ses-1');
      expect(result.data.id).toBe('ses-1');
      expect(result.data.recurrencia).toBe('SEMANAL');
    });

    it('retorna el detalle cuando el usuario es asistente', async () => {
      const asistente: AsistenteDTO = { id: 'a-1', sesionId: 'ses-1', usuarioId: 'user-1', estado: 'CONFIRMADA', createdAt: new Date(), updatedAt: new Date() };
      const sesionAsistente = { ...SESION_MOCK, creadorId: 'otro-user', asistentes: [asistente] };
      const repo = makeRepo({ obtenerSesionPorId: jest.fn().mockResolvedValue(sesionAsistente) });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      const result = await uc.obtenerDetalleSesion(USUARIO, 'ses-1');
      expect(result.data.miAsistencia).toBe('CONFIRMADA');
    });
  });

  // ─── confirmarAsistencia ──────────────────────────────────────────────────────

  describe('confirmarAsistencia', () => {
    const asistenteBase: AsistenteDTO = { id: 'a-1', sesionId: 'ses-1', usuarioId: 'user-1', estado: 'PENDIENTE', createdAt: new Date(), updatedAt: new Date() };
    const sesionConAsistente: SesionDTO = { ...SESION_MOCK, asistentes: [asistenteBase] };

    it('lanza 401 si no hay usuario', async () => {
      const uc = new SesionEstudioUseCases(makeRepo(), makeSesionSubject());
      await expect(uc.confirmarAsistencia(undefined, 'ses-1')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si sesionId no es string', async () => {
      const uc = new SesionEstudioUseCases(makeRepo(), makeSesionSubject());
      await expect(uc.confirmarAsistencia(USUARIO, 999)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si la sesión no existe', async () => {
      const repo = makeRepo({ obtenerSesionPorId: jest.fn().mockResolvedValue(null) });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      await expect(uc.confirmarAsistencia(USUARIO, 'ses-inexistente')).rejects.toMatchObject({ status: 404 });
    });

    it('lanza 400 si la sesión está cancelada', async () => {
      const sesionCancelada = { ...sesionConAsistente, cancelada: true };
      const repo = makeRepo({ obtenerSesionPorId: jest.fn().mockResolvedValue(sesionCancelada) });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      await expect(uc.confirmarAsistencia(USUARIO, 'ses-1')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 403 si el usuario no es participante ni creador', async () => {
      const sesionDeOtro = { ...SESION_MOCK, creadorId: 'otro', asistentes: [] };
      const repo = makeRepo({ obtenerSesionPorId: jest.fn().mockResolvedValue(sesionDeOtro) });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      await expect(uc.confirmarAsistencia(USUARIO, 'ses-1')).rejects.toMatchObject({ status: 403 });
    });

    it('lanza 409 si ya tiene el estado CONFIRMADA', async () => {
      const asistenteConfirmado = { ...asistenteBase, estado: 'CONFIRMADA' as const };
      const sesion = { ...SESION_MOCK, asistentes: [asistenteConfirmado] };
      const repo = makeRepo({ obtenerSesionPorId: jest.fn().mockResolvedValue(sesion) });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      await expect(uc.confirmarAsistencia(USUARIO, 'ses-1')).rejects.toMatchObject({ status: 409 });
    });

    it('confirma asistencia como creador (sin disparar observer)', async () => {
      const asistenciaActualizada = { ...asistenteBase, estado: 'CONFIRMADA' as const };
      const repo = makeRepo({
        obtenerSesionPorId: jest.fn().mockResolvedValue(sesionConAsistente),
        actualizarEstadoAsistencia: jest.fn().mockResolvedValue(asistenciaActualizada),
      });
      const subject = makeSesionSubject();
      const uc = new SesionEstudioUseCases(repo, subject);
      const result = await uc.confirmarAsistencia(USUARIO, 'ses-1');
      expect(result.message).toMatch(/confirmada/i);
      expect(subject.notificarCambioAsistencia).not.toHaveBeenCalled();
    });

    it('confirma asistencia como asistente y dispara el observer', async () => {
      const asistente: AsistenteDTO = { id: 'a-1', sesionId: 'ses-1', usuarioId: 'user-1', estado: 'PENDIENTE', createdAt: new Date(), updatedAt: new Date() };
      const sesionOtroCreador: SesionDTO = { ...SESION_MOCK, creadorId: 'creador-id', asistentes: [asistente] };
      const asistenciaActualizada = { ...asistente, estado: 'CONFIRMADA' as const };
      const userRepo = { findSafeById: jest.fn().mockResolvedValue({ nombre: 'Test', apellido: 'U' }) };
      const repo = makeRepo({
        obtenerSesionPorId: jest.fn().mockResolvedValue(sesionOtroCreador),
        actualizarEstadoAsistencia: jest.fn().mockResolvedValue(asistenciaActualizada),
      });
      const subject = makeSesionSubject();
      const uc = new SesionEstudioUseCases(repo, subject, userRepo as any);
      await uc.confirmarAsistencia(USUARIO, 'ses-1');
      expect(subject.notificarCambioAsistencia).toHaveBeenCalledWith(expect.objectContaining({ nuevoEstado: 'CONFIRMADA' }));
    });
  });

  // ─── declinarAsistencia ───────────────────────────────────────────────────────

  describe('declinarAsistencia', () => {
    it('declina asistencia correctamente', async () => {
      const asistente: AsistenteDTO = { id: 'a-1', sesionId: 'ses-1', usuarioId: 'user-1', estado: 'PENDIENTE', createdAt: new Date(), updatedAt: new Date() };
      const sesionConAsistente: SesionDTO = { ...SESION_MOCK, asistentes: [asistente] };
      const asistenciaDeclinada = { ...asistente, estado: 'DECLINADA' as const };
      const repo = makeRepo({
        obtenerSesionPorId: jest.fn().mockResolvedValue(sesionConAsistente),
        actualizarEstadoAsistencia: jest.fn().mockResolvedValue(asistenciaDeclinada),
      });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      const result = await uc.declinarAsistencia(USUARIO, 'ses-1');
      expect(result.message).toMatch(/declinada/i);
    });

    it('lanza 409 si ya tiene el estado DECLINADA', async () => {
      const asistente: AsistenteDTO = { id: 'a-1', sesionId: 'ses-1', usuarioId: 'user-1', estado: 'DECLINADA', createdAt: new Date(), updatedAt: new Date() };
      const sesion: SesionDTO = { ...SESION_MOCK, asistentes: [asistente] };
      const repo = makeRepo({ obtenerSesionPorId: jest.fn().mockResolvedValue(sesion) });
      const uc = new SesionEstudioUseCases(repo, makeSesionSubject());
      await expect(uc.declinarAsistencia(USUARIO, 'ses-1')).rejects.toMatchObject({ status: 409 });
    });
  });
});
