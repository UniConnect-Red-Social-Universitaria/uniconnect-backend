import { SesionEstudioUseCases } from '../src/modules/sesiones/application/sesion.use-cases';
import type { ISesionEstudioRepository, SesionDTO, SerieDTO } from '../src/modules/sesiones/domain/contracts';
import { ApplicationError } from '../src/shared/application-error';

const USUARIO = { id: 'user-1', correo: 'test@ucaldas.edu.co', nombre: 'Test', materiasCursando: [] };

function makeRepo(overrides: Partial<ISesionEstudioRepository> = {}): ISesionEstudioRepository {
  return {
    crearSerie: jest.fn(),
    obtenerSesionesDeUsuario: jest.fn().mockResolvedValue([]),
    obtenerSesionPorId: jest.fn(),
    modificarSesion: jest.fn(),
    cancelarSesion: jest.fn(),
    marcarRecordatorioEnviado: jest.fn(),
    obtenerSesionesPendientesRecordatorio: jest.fn(),
    ...overrides,
  };
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

  // ─── crearSerie ───────────────────────────────────────────────────────────

  describe('crearSerie', () => {
    it('lanza 401 si no hay usuario autenticado', async () => {
      const uc = new SesionEstudioUseCases(makeRepo());
      await expect(
        uc.crearSerie(undefined, 'T', 'D', 'L', 'SEMANAL', new Date().toISOString(), new Date().toISOString()),
      ).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si el título está vacío', async () => {
      const { inicio, fin } = fechasFuturas();
      const uc = new SesionEstudioUseCases(makeRepo());
      await expect(uc.crearSerie(USUARIO, '   ', 'D', 'L', 'SEMANAL', inicio, fin)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si la descripción está vacía', async () => {
      const { inicio, fin } = fechasFuturas();
      const uc = new SesionEstudioUseCases(makeRepo());
      await expect(uc.crearSerie(USUARIO, 'Título', '', 'L', 'SEMANAL', inicio, fin)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si el lugar está vacío', async () => {
      const { inicio, fin } = fechasFuturas();
      const uc = new SesionEstudioUseCases(makeRepo());
      await expect(uc.crearSerie(USUARIO, 'Título', 'Desc', '  ', 'SEMANAL', inicio, fin)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si la frecuencia no es válida', async () => {
      const { inicio, fin } = fechasFuturas();
      const uc = new SesionEstudioUseCases(makeRepo());
      await expect(uc.crearSerie(USUARIO, 'T', 'D', 'L', 'MENSUAL', inicio, fin)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si fechaInicio no es string', async () => {
      const uc = new SesionEstudioUseCases(makeRepo());
      await expect(uc.crearSerie(USUARIO, 'T', 'D', 'L', 'SEMANAL', 12345, 'fin')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si las fechas tienen formato inválido', async () => {
      const uc = new SesionEstudioUseCases(makeRepo());
      await expect(uc.crearSerie(USUARIO, 'T', 'D', 'L', 'SEMANAL', 'no-es-fecha', 'tampoco')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si fechaFin es anterior a fechaInicio', async () => {
      const inicio = new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString();
      const fin = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();
      const uc = new SesionEstudioUseCases(makeRepo());
      await expect(uc.crearSerie(USUARIO, 'T', 'D', 'L', 'SEMANAL', inicio, fin)).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 400 si fechaInicio está en el pasado', async () => {
      const inicio = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const fin = new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString();
      const uc = new SesionEstudioUseCases(makeRepo());
      await expect(uc.crearSerie(USUARIO, 'T', 'D', 'L', 'SEMANAL', inicio, fin)).rejects.toMatchObject({ status: 400 });
    });

    it('crea la serie y usa 30 min de recordatorio por defecto cuando no se provee', async () => {
      const { inicio, fin } = fechasFuturas();
      const repo = makeRepo({ crearSerie: jest.fn().mockResolvedValue(SERIE_MOCK) });
      const uc = new SesionEstudioUseCases(repo);
      const result = await uc.crearSerie(USUARIO, 'Álgebra', 'Desc', 'Biblio', 'SEMANAL', inicio, fin, undefined);
      expect(repo.crearSerie).toHaveBeenCalledWith(expect.objectContaining({ recordatorioMinutos: 30 }));
      expect(result.data).toEqual(SERIE_MOCK);
    });

    it('respeta el recordatorioMinutos cuando se provee', async () => {
      const { inicio, fin } = fechasFuturas();
      const repo = makeRepo({ crearSerie: jest.fn().mockResolvedValue(SERIE_MOCK) });
      const uc = new SesionEstudioUseCases(repo);
      await uc.crearSerie(USUARIO, 'Álgebra', 'Desc', 'Biblio', 'SEMANAL', inicio, fin, 60);
      expect(repo.crearSerie).toHaveBeenCalledWith(expect.objectContaining({ recordatorioMinutos: 60 }));
    });

    it('acepta las tres frecuencias válidas', async () => {
      const { inicio, fin } = fechasFuturas();
      const repo = makeRepo({ crearSerie: jest.fn().mockResolvedValue(SERIE_MOCK) });
      const uc = new SesionEstudioUseCases(repo);
      for (const frecuencia of ['DIARIA', 'SEMANAL', 'QUINCENAL'] as const) {
        await expect(uc.crearSerie(USUARIO, 'T', 'D', 'L', frecuencia, inicio, fin)).resolves.toBeDefined();
      }
    });
  });

  // ─── obtenerSesiones ──────────────────────────────────────────────────────

  describe('obtenerSesiones', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new SesionEstudioUseCases(makeRepo());
      await expect(uc.obtenerSesiones(undefined)).rejects.toMatchObject({ status: 401 });
    });

    it('retorna la lista de sesiones del usuario', async () => {
      const repo = makeRepo({ obtenerSesionesDeUsuario: jest.fn().mockResolvedValue([SESION_MOCK]) });
      const uc = new SesionEstudioUseCases(repo);
      const result = await uc.obtenerSesiones(USUARIO);
      expect(result.data).toEqual([SESION_MOCK]);
      expect(repo.obtenerSesionesDeUsuario).toHaveBeenCalledWith('user-1');
    });

    it('retorna lista vacía cuando el usuario no tiene sesiones', async () => {
      const repo = makeRepo({ obtenerSesionesDeUsuario: jest.fn().mockResolvedValue([]) });
      const uc = new SesionEstudioUseCases(repo);
      const result = await uc.obtenerSesiones(USUARIO);
      expect(result.data).toEqual([]);
    });
  });

  // ─── modificarSesion ──────────────────────────────────────────────────────

  describe('modificarSesion', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new SesionEstudioUseCases(makeRepo());
      await expect(uc.modificarSesion(undefined, 'ses-1', 'solo_esta')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si el alcance es inválido', async () => {
      const repo = makeRepo({ obtenerSesionPorId: jest.fn().mockResolvedValue(SESION_MOCK) });
      const uc = new SesionEstudioUseCases(repo);
      await expect(uc.modificarSesion(USUARIO, 'ses-1', 'todas')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si la sesión no existe', async () => {
      const repo = makeRepo({ obtenerSesionPorId: jest.fn().mockResolvedValue(null) });
      const uc = new SesionEstudioUseCases(repo);
      await expect(uc.modificarSesion(USUARIO, 'ses-inexistente', 'solo_esta')).rejects.toMatchObject({ status: 404 });
    });

    it('lanza 403 si el usuario no es dueño de la sesión', async () => {
      const otroUsuario = { ...USUARIO, id: 'otro-user' };
      const repo = makeRepo({ obtenerSesionPorId: jest.fn().mockResolvedValue(SESION_MOCK) });
      const uc = new SesionEstudioUseCases(repo);
      await expect(uc.modificarSesion(otroUsuario, 'ses-1', 'solo_esta')).rejects.toMatchObject({ status: 403 });
    });

    it('modifica solo esta sesión correctamente', async () => {
      const sesionModificada = { ...SESION_MOCK, titulo: 'Nuevo título', modificada: true };
      const repo = makeRepo({
        obtenerSesionPorId: jest.fn().mockResolvedValue(SESION_MOCK),
        modificarSesion: jest.fn().mockResolvedValue([sesionModificada]),
      });
      const uc = new SesionEstudioUseCases(repo);
      const result = await uc.modificarSesion(USUARIO, 'ses-1', 'solo_esta', 'Nuevo título');
      expect(repo.modificarSesion).toHaveBeenCalledWith('ses-1', 'solo_esta', expect.objectContaining({ titulo: 'Nuevo título' }));
      expect(result.data).toEqual([sesionModificada]);
    });

    it('modifica esta sesión y siguientes con el alcance correcto', async () => {
      const repo = makeRepo({
        obtenerSesionPorId: jest.fn().mockResolvedValue(SESION_MOCK),
        modificarSesion: jest.fn().mockResolvedValue([SESION_MOCK]),
      });
      const uc = new SesionEstudioUseCases(repo);
      await uc.modificarSesion(USUARIO, 'ses-1', 'esta_y_siguientes', 'Título', 'Desc', 'Nuevo lugar');
      expect(repo.modificarSesion).toHaveBeenCalledWith('ses-1', 'esta_y_siguientes', expect.objectContaining({ lugar: 'Nuevo lugar' }));
    });
  });

  // ─── cancelarSesion ───────────────────────────────────────────────────────

  describe('cancelarSesion', () => {
    it('lanza 401 si no hay usuario', async () => {
      const uc = new SesionEstudioUseCases(makeRepo());
      await expect(uc.cancelarSesion(undefined, 'ses-1', 'solo_esta')).rejects.toMatchObject({ status: 401 });
    });

    it('lanza 400 si el alcance es inválido', async () => {
      const repo = makeRepo({ obtenerSesionPorId: jest.fn().mockResolvedValue(SESION_MOCK) });
      const uc = new SesionEstudioUseCases(repo);
      await expect(uc.cancelarSesion(USUARIO, 'ses-1', 'invalido')).rejects.toMatchObject({ status: 400 });
    });

    it('lanza 404 si la sesión no existe', async () => {
      const repo = makeRepo({ obtenerSesionPorId: jest.fn().mockResolvedValue(null) });
      const uc = new SesionEstudioUseCases(repo);
      await expect(uc.cancelarSesion(USUARIO, 'ses-inexistente', 'solo_esta')).rejects.toMatchObject({ status: 404 });
    });

    it('lanza 403 si el usuario no es dueño de la sesión', async () => {
      const otroUsuario = { ...USUARIO, id: 'otro-user' };
      const repo = makeRepo({ obtenerSesionPorId: jest.fn().mockResolvedValue(SESION_MOCK) });
      const uc = new SesionEstudioUseCases(repo);
      await expect(uc.cancelarSesion(otroUsuario, 'ses-1', 'solo_esta')).rejects.toMatchObject({ status: 403 });
    });

    it('cancela solo esta sesión correctamente', async () => {
      const repo = makeRepo({
        obtenerSesionPorId: jest.fn().mockResolvedValue(SESION_MOCK),
        cancelarSesion: jest.fn().mockResolvedValue(undefined),
      });
      const uc = new SesionEstudioUseCases(repo);
      const result = await uc.cancelarSesion(USUARIO, 'ses-1', 'solo_esta');
      expect(repo.cancelarSesion).toHaveBeenCalledWith('ses-1', 'solo_esta');
      expect(result.message).toMatch(/cancelad/i);
    });

    it('cancela esta sesión y siguientes correctamente', async () => {
      const repo = makeRepo({
        obtenerSesionPorId: jest.fn().mockResolvedValue(SESION_MOCK),
        cancelarSesion: jest.fn().mockResolvedValue(undefined),
      });
      const uc = new SesionEstudioUseCases(repo);
      await uc.cancelarSesion(USUARIO, 'ses-1', 'esta_y_siguientes');
      expect(repo.cancelarSesion).toHaveBeenCalledWith('ses-1', 'esta_y_siguientes');
    });
  });
});
