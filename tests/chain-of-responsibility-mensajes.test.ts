import { crearCadenaValidacion } from '../src/modules/messages/application/validacion/ValidadorMensajeChainFactory';
import { ValidarTamanoHandler } from '../src/modules/messages/application/validacion/ValidarTamanoHandler';
import { ValidarContenidoHandler } from '../src/modules/messages/application/validacion/ValidarContenidoHandler';
import { ValidarMencionesHandler } from '../src/modules/messages/application/validacion/ValidarMencionesHandler';
import { ValidarPermisosHandler } from '../src/modules/messages/application/validacion/ValidarPermisosHandler';
import { ValidarAdjuntoHandler } from '../src/modules/messages/application/validacion/ValidarAdjuntoHandler';
import { MensajeContexto } from '../src/modules/messages/domain/IValidadorMensajeHandler';

const checkerPermisivo = {
  esMiembroDeGrupo: () => true,
  tieneRelacionAceptada: () => true,
};

const mensajeValido: MensajeContexto = {
  emisorId: 'user-1',
  contenido: 'Hola, ¿cómo estás?',
  receptorId: 'user-2',
};

describe('Chain of Responsibility — validación de mensajes', () => {
  describe('IValidadorMensajeHandler — contrato de la interfaz', () => {
    it('setSiguiente retorna el handler siguiente (permite encadenado fluido)', () => {
      const h1 = new ValidarTamanoHandler();
      const h2 = new ValidarContenidoHandler();
      const retorno = h1.setSiguiente(h2);
      expect(retorno).toBe(h2);
    });

    it('un handler sin siguiente retorna valido:true cuando su propia validación pasa', () => {
      const handler = new ValidarTamanoHandler();
      const resultado = handler.manejar(mensajeValido);
      expect(resultado.valido).toBe(true);
    });
  });

  describe('ValidarTamanoHandler', () => {
    it('rechaza mensaje vacío', () => {
      const h = new ValidarTamanoHandler();
      expect(h.manejar({ ...mensajeValido, contenido: '' }).valido).toBe(false);
    });

    it('rechaza mensaje de solo espacios', () => {
      const h = new ValidarTamanoHandler();
      expect(h.manejar({ ...mensajeValido, contenido: '   ' }).valido).toBe(false);
    });

    it('rechaza mensaje que supera 1000 caracteres', () => {
      const h = new ValidarTamanoHandler();
      const largo = 'a'.repeat(1001);
      const resultado = h.manejar({ ...mensajeValido, contenido: largo });
      expect(resultado.valido).toBe(false);
      expect(resultado.error).toMatch(/1000/);
    });

    it('acepta mensaje dentro del límite', () => {
      const h = new ValidarTamanoHandler();
      expect(h.manejar(mensajeValido).valido).toBe(true);
    });
  });

  describe('ValidarContenidoHandler', () => {
    it('rechaza mensaje con palabra prohibida "spam"', () => {
      const h = new ValidarContenidoHandler();
      const resultado = h.manejar({ ...mensajeValido, contenido: 'esto es spam total' });
      expect(resultado.valido).toBe(false);
      expect(resultado.error).toMatch(/spam/);
    });

    it('acepta mensaje con contenido limpio', () => {
      const h = new ValidarContenidoHandler();
      expect(h.manejar(mensajeValido).valido).toBe(true);
    });
  });

  describe('ValidarMencionesHandler', () => {
    it('acepta mensaje sin menciones', () => {
      const h = new ValidarMencionesHandler();
      expect(h.manejar(mensajeValido).valido).toBe(true);
    });

    it('acepta mención con formato válido', () => {
      const h = new ValidarMencionesHandler();
      expect(h.manejar({ ...mensajeValido, contenido: 'hola @juan.perez' }).valido).toBe(true);
    });

    it('rechaza mención con caracteres inválidos', () => {
      const h = new ValidarMencionesHandler();
      const resultado = h.manejar({ ...mensajeValido, contenido: 'hola @juan!perez' });
      expect(resultado.valido).toBe(false);
    });
  });

  describe('ValidarPermisosHandler', () => {
    it('rechaza si el emisor no es miembro del grupo', () => {
      const h = new ValidarPermisosHandler({
        esMiembroDeGrupo: () => false,
        tieneRelacionAceptada: () => true,
      });
      const resultado = h.manejar({ emisorId: 'u1', contenido: 'hola', grupoId: 'g1' });
      expect(resultado.valido).toBe(false);
      expect(resultado.error).toMatch(/miembros/);
    });

    it('rechaza si no hay relación aceptada en mensaje privado', () => {
      const h = new ValidarPermisosHandler({
        esMiembroDeGrupo: () => true,
        tieneRelacionAceptada: () => false,
      });
      const resultado = h.manejar({ emisorId: 'u1', contenido: 'hola', receptorId: 'u2' });
      expect(resultado.valido).toBe(false);
    });

    it('rechaza mensaje a sí mismo', () => {
      const h = new ValidarPermisosHandler(checkerPermisivo);
      const resultado = h.manejar({ emisorId: 'u1', contenido: 'hola', receptorId: 'u1' });
      expect(resultado.valido).toBe(false);
    });

    it('rechaza si no hay destinatario', () => {
      const h = new ValidarPermisosHandler(checkerPermisivo);
      const resultado = h.manejar({ emisorId: 'u1', contenido: 'hola' });
      expect(resultado.valido).toBe(false);
    });

    it('acepta miembro de grupo con permisos', () => {
      const h = new ValidarPermisosHandler(checkerPermisivo);
      expect(h.manejar({ emisorId: 'u1', contenido: 'hola', grupoId: 'g1' }).valido).toBe(true);
    });
  });

  describe('ValidarAdjuntoHandler — Open/Closed', () => {
    it('pasa sin adjunto (handler transparente)', () => {
      const h = new ValidarAdjuntoHandler();
      expect(h.manejar(mensajeValido).valido).toBe(true);
    });

    it('rechaza tipo MIME no permitido', () => {
      const h = new ValidarAdjuntoHandler();
      const resultado = h.manejar({ ...mensajeValido, adjuntoMimeType: 'application/exe' });
      expect(resultado.valido).toBe(false);
      expect(resultado.error).toMatch(/no permitido/);
    });

    it('rechaza adjunto que supera 5 MB', () => {
      const h = new ValidarAdjuntoHandler();
      const resultado = h.manejar({
        ...mensajeValido,
        adjuntoMimeType: 'image/png',
        adjuntoTamanoBytes: 6 * 1024 * 1024,
      });
      expect(resultado.valido).toBe(false);
      expect(resultado.error).toMatch(/tamaño máximo/);
    });

    it('acepta adjunto válido', () => {
      const h = new ValidarAdjuntoHandler();
      const resultado = h.manejar({
        ...mensajeValido,
        adjuntoMimeType: 'image/png',
        adjuntoTamanoBytes: 1 * 1024 * 1024,
      });
      expect(resultado.valido).toBe(true);
    });
  });

  describe('Cadena completa — crearCadenaValidacion', () => {
    it('un mensaje válido pasa toda la cadena', () => {
      const cadena = crearCadenaValidacion(checkerPermisivo);
      const resultado = cadena.manejar(mensajeValido);
      expect(resultado.valido).toBe(true);
      expect(resultado.error).toBeUndefined();
    });

    it('corta en ValidarTamanoHandler — no llega a los siguientes handlers', () => {
      const cadena = crearCadenaValidacion(checkerPermisivo);
      const resultado = cadena.manejar({ ...mensajeValido, contenido: '' });
      expect(resultado.valido).toBe(false);
      expect(resultado.error).toBeTruthy();
    });

    it('corta en ValidarContenidoHandler — tamaño OK pero contenido inválido', () => {
      const cadena = crearCadenaValidacion(checkerPermisivo);
      const resultado = cadena.manejar({ ...mensajeValido, contenido: 'phishing link aquí' });
      expect(resultado.valido).toBe(false);
      expect(resultado.error).toMatch(/phishing/);
    });

    it('corta en ValidarPermisosHandler — tamaño y contenido OK pero sin permisos', () => {
      const cadena = crearCadenaValidacion({
        esMiembroDeGrupo: () => false,
        tieneRelacionAceptada: () => false,
      });
      const resultado = cadena.manejar({ emisorId: 'u1', contenido: 'hola', grupoId: 'g1' });
      expect(resultado.valido).toBe(false);
      expect(resultado.error).toMatch(/miembros/);
    });

    it('agregar ValidarAdjuntoHandler no modifica los handlers existentes', () => {
      // Se puede construir una cadena personalizada sin tocar los handlers anteriores
      const tamano = new ValidarTamanoHandler();
      const contenido = new ValidarContenidoHandler();
      const adjunto = new ValidarAdjuntoHandler();

      tamano.setSiguiente(contenido).setSiguiente(adjunto);

      const resultado = tamano.manejar({
        ...mensajeValido,
        adjuntoMimeType: 'application/exe',
      });
      expect(resultado.valido).toBe(false);
      expect(resultado.error).toMatch(/no permitido/);
    });
  });
});
