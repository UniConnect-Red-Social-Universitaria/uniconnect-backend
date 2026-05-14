/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { MensajeBase } from '../src/shared/mensaje/IMensaje';
import { MensajeConArchivo, ArchivoDTO } from '../src/shared/mensaje/MensajeConArchivo';
import { MensajeConMencion, MencionDTO } from '../src/shared/mensaje/MensajeConMencion';
import { MensajeConReaccion, ReaccionDTO } from '../src/shared/mensaje/MensajeConReaccion';

// ──────────────────────────────────────────────────────────────────
// CRITERIO 1: MensajeBase.render() retorna unicamente texto plano
// ──────────────────────────────────────────────────────────────────
describe('MensajeBase', () => {
  it('render() retorna solo contenido de texto plano sin metadatos extra', () => {
    const mensaje = new MensajeBase('Hola, ¿cómo estás?');

    const resultado = mensaje.render();

    expect(resultado).toEqual({
      contenido: 'Hola, ¿cómo estás?',
    });
    expect(Object.keys(resultado)).toHaveLength(1);
  });

  it('getContenido() retorna el contenido exacto', () => {
    const contenido = 'Mensaje de prueba';
    const mensaje = new MensajeBase(contenido);

    expect(mensaje.getContenido()).toBe(contenido);
  });

  it('render() no incluye campos de decoradores (archivo, menciones, reacciones)', () => {
    const mensaje = new MensajeBase('Contenido base');
    const resultado = mensaje.render();

    expect(resultado.archivo).toBeUndefined();
    expect(resultado.menciones).toBeUndefined();
    expect(resultado.reacciones).toBeUndefined();
  });

  it('puede manejar contenido con caracteres especiales', () => {
    const contenido = 'Mensaje con 😊 emojis y \n saltos de línea';
    const mensaje = new MensajeBase(contenido);

    expect(mensaje.render().contenido).toBe(contenido);
  });
});

// ──────────────────────────────────────────────────────────────────
// CRITERIO 2: MensajeConArchivo añade campo archivo correctamente
// ──────────────────────────────────────────────────────────────────
describe('MensajeConArchivo', () => {
  const archivo: ArchivoDTO = {
    nombre: 'documento.pdf',
    url: 'https://ejemplo.com/doc.pdf',
    tamaño: 1024000,
    tipo: 'application/pdf',
  };

  it('agrega campo archivo al resultado de render() SIN modificar el contenido base', () => {
    const base = new MensajeBase('Te envío el documento solicitado');
    const conArchivo = new MensajeConArchivo(base, archivo);

    const resultado = conArchivo.render();

    expect(resultado.contenido).toBe('Te envío el documento solicitado');
    expect(resultado.archivo).toEqual(archivo);
  });

  it('delega getContenido() correctamente al mensaje base', () => {
    const contenido = 'Mensaje con archivo';
    const base = new MensajeBase(contenido);
    const conArchivo = new MensajeConArchivo(base, archivo);

    expect(conArchivo.getContenido()).toBe(contenido);
  });

  it('expone getArchivo() para acceder al archivo', () => {
    const base = new MensajeBase('Test');
    const conArchivo = new MensajeConArchivo(base, archivo);

    expect(conArchivo.getArchivo()).toEqual(archivo);
  });

  it('soporta archivo sin campos opcionales', () => {
    const archivoMinimo: ArchivoDTO = {
      nombre: 'simple.txt',
      url: 'https://ejemplo.com/file.txt',
    };

    const base = new MensajeBase('Archivo');
    const conArchivo = new MensajeConArchivo(base, archivoMinimo);

    const resultado = conArchivo.render();
    expect(resultado.archivo.nombre).toBe('simple.txt');
    expect(resultado.archivo.url).toBe('https://ejemplo.com/file.txt');
    expect(resultado.archivo.tamaño).toBeUndefined();
  });

  it('el archivo persiste en la composición del decorador', () => {
    const base = new MensajeBase('Mensaje original');
    const conArchivo = new MensajeConArchivo(base, archivo);

    const resultado1 = conArchivo.render();
    const resultado2 = conArchivo.render();

    expect(resultado1).toEqual(resultado2);
    expect(resultado1.archivo).toBe(resultado2.archivo);
  });
});

// ──────────────────────────────────────────────────────────────────
// CRITERIO 3: Composición de decoradores
// ──────────────────────────────────────────────────────────────────
describe('MensajeConMencion', () => {
  const menciones: MencionDTO[] = [
    { usuarioId: 'user-1', nombre: 'Juan', correo: 'juan@uni.edu.co' },
    { usuarioId: 'user-2', nombre: 'María', correo: 'maria@uni.edu.co' },
  ];

  it('agrega campo menciones al resultado de render() SIN modificar el contenido base', () => {
    const base = new MensajeBase('@Juan @María revisen esto por favor');
    const conMenciones = new MensajeConMencion(base, menciones);

    const resultado = conMenciones.render();

    expect(resultado.contenido).toBe('@Juan @María revisen esto por favor');
    expect(resultado.menciones).toEqual(menciones);
  });

  it('delega getContenido() correctamente al mensaje base', () => {
    const contenido = 'Mensaje con menciones';
    const base = new MensajeBase(contenido);
    const conMenciones = new MensajeConMencion(base, menciones);

    expect(conMenciones.getContenido()).toBe(contenido);
  });

  it('expone getMenciones() para acceder a las menciones', () => {
    const base = new MensajeBase('Test');
    const conMenciones = new MensajeConMencion(base, menciones);

    expect(conMenciones.getMenciones()).toEqual(menciones);
  });

  it('soporta mensaje sin menciones (array vacío)', () => {
    const base = new MensajeBase('Mensaje sin menciones');
    const conMenciones = new MensajeConMencion(base, []);

    const resultado = conMenciones.render();
    expect(resultado.menciones).toEqual([]);
  });

  it('soporta una sola mención', () => {
    const base = new MensajeBase('@Carlos');
    const conMenciones = new MensajeConMencion(base, [
      { usuarioId: 'user-3', nombre: 'Carlos', correo: 'carlos@uni.edu.co' },
    ]);

    const resultado = conMenciones.render();
    expect(resultado.menciones).toHaveLength(1);
    expect(resultado.menciones[0].nombre).toBe('Carlos');
  });
});

// ──────────────────────────────────────────────────────────────────
// CRITERIO 3: Composición de MÚLTIPLES decoradores
// ──────────────────────────────────────────────────────────────────
describe('Composicion de decoradores: archivo + menciones', () => {
  const archivo: ArchivoDTO = {
    nombre: 'proyecto.zip',
    url: 'https://ejemplo.com/proyecto.zip',
    tamaño: 5242880,
    tipo: 'application/zip',
  };

  const menciones: MencionDTO[] = [
    { usuarioId: 'user-1', nombre: 'Pedro', correo: 'pedro@uni.edu.co' },
    { usuarioId: 'user-2', nombre: 'Ana', correo: 'ana@uni.edu.co' },
  ];

  it('MensajeConMencion(MensajeConArchivo(MensajeBase)).render() incluye tanto archivo como menciones', () => {
    const base = new MensajeBase('@Pedro @Ana aqui está el proyecto');
    const conArchivo = new MensajeConArchivo(base, archivo);
    const conMenciones = new MensajeConMencion(conArchivo, menciones);

    const resultado = conMenciones.render();

    expect(resultado.contenido).toBe('@Pedro @Ana aqui está el proyecto');
    expect(resultado.archivo).toEqual(archivo);
    expect(resultado.menciones).toEqual(menciones);
  });

  it('conserva ambas responsabilidades sin romper el comportamiento base', () => {
    const base = new MensajeBase('Contenido original');
    const conArchivo = new MensajeConArchivo(base, archivo);
    const conMenciones = new MensajeConMencion(conArchivo, menciones);

    expect(conMenciones.getContenido()).toBe('Contenido original');

    const resultado = conMenciones.render();
    expect(resultado).toHaveProperty('contenido');
    expect(resultado).toHaveProperty('archivo');
    expect(resultado).toHaveProperty('menciones');
  });

  it('puede agregar reacciones a un mensaje con archivo y menciones', () => {
    const reacciones: ReaccionDTO[] = [
      { emoji: '👍', usuarioId: 'user-1', fecha: new Date() },
    ];

    const base = new MensajeBase('Mensaje completo');
    const conArchivo = new MensajeConArchivo(base, archivo);
    const conMenciones = new MensajeConMencion(conArchivo, menciones);
    const conReacciones = new MensajeConReaccion(conMenciones, reacciones);

    const resultado = conReacciones.render();

    expect(resultado.contenido).toBe('Mensaje completo');
    expect(resultado.archivo).toBeDefined();
    expect(resultado.menciones).toBeDefined();
    expect(resultado.reacciones).toEqual(reacciones);
  });
});

// ──────────────────────────────────────────────────────────────────
// CRITERIO 4: Prueba negativa - sin decorador NO tiene el campo
// ──────────────────────────────────────────────────────────────────
describe('Pruebas negativas', () => {
  it('un mensaje sin decorador de archivo NO tiene el campo archivo en el resultado', () => {
    const base = new MensajeBase('Mensaje sin archivo');
    const resultado = base.render();

    expect(resultado.archivo).toBeUndefined();
    expect('archivo' in resultado).toBe(false);
  });

  it('un mensaje sin decorador de mención NO tiene el campo menciones en el resultado', () => {
    const base = new MensajeBase('Mensaje sin menciones');
    const resultado = base.render();

    expect(resultado.menciones).toBeUndefined();
    expect('menciones' in resultado).toBe(false);
  });

  it('un mensaje sin decorador de reacción NO tiene el campo reacciones en el resultado', () => {
    const base = new MensajeBase('Mensaje sin reacciones');
    const resultado = base.render();

    expect(resultado.reacciones).toBeUndefined();
    expect('reacciones' in resultado).toBe(false);
  });

  it('MensajeConArchivo sin MensajeConMencion NO tiene menciones', () => {
    const archivo: ArchivoDTO = {
      nombre: 'doc.pdf',
      url: 'https://ejemplo.com/doc.pdf',
    };

    const base = new MensajeBase('Mensaje');
    const conArchivo = new MensajeConArchivo(base, archivo);
    const resultado = conArchivo.render();

    expect(resultado.archivo).toBeDefined();
    expect(resultado.menciones).toBeUndefined();
  });

  it('MensajeConMencion sin MensajeConArchivo NO tiene archivo', () => {
    const menciones: MencionDTO[] = [
      { usuarioId: 'u1', nombre: 'Test', correo: 'test@uni.edu.co' },
    ];

    const base = new MensajeBase('Mensaje');
    const conMenciones = new MensajeConMencion(base, menciones);
    const resultado = conMenciones.render();

    expect(resultado.menciones).toBeDefined();
    expect(resultado.archivo).toBeUndefined();
  });
});

// ──────────────────────────────────────────────────────────────────
// CRITERIO 5: MensajeConReaccion - decorador adicional
// ──────────────────────────────────────────────────────────────────
describe('MensajeConReaccion - Decorador 4', () => {
  it('agrega lista de reacciones vacías al inicio', () => {
    const base = new MensajeBase('Mensaje');
    const conReacciones = new MensajeConReaccion(base);

    const resultado = conReacciones.render();
    expect(resultado.reacciones).toEqual([]);
  });

  it('agrega reacciones iniciales si se proporcionan', () => {
    const reacciones: ReaccionDTO[] = [
      { emoji: '❤️', usuarioId: 'user-1', fecha: new Date('2024-01-15') },
    ];

    const base = new MensajeBase('Mensaje');
    const conReacciones = new MensajeConReaccion(base, reacciones);

    const resultado = conReacciones.render();
    expect(resultado.reacciones).toHaveLength(1);
    expect(resultado.reacciones[0].emoji).toBe('❤️');
  });

  it('permite agregar reacciones con agregarReaccion()', () => {
    const base = new MensajeBase('Mensaje');
    const conReacciones = new MensajeConReaccion(base);

    const nuevaReaccion: ReaccionDTO = {
      emoji: '😂',
      usuarioId: 'user-2',
      fecha: new Date(),
    };

    conReacciones.agregarReaccion(nuevaReaccion);
    const resultado = conReacciones.render();

    expect(resultado.reacciones).toHaveLength(1);
    expect(resultado.reacciones[0].emoji).toBe('😂');
  });

  it('getReacciones() retorna las reacciones actuales', () => {
    const reacciones: ReaccionDTO[] = [
      { emoji: '👍', usuarioId: 'user-1', fecha: new Date() },
    ];

    const base = new MensajeBase('Mensaje');
    const conReacciones = new MensajeConReaccion(base, reacciones);

    expect(conReacciones.getReacciones()).toEqual(reacciones);
  });

  it('mantiene el comportamiento base sin modificar el contenido', () => {
    const base = new MensajeBase('Contenido importante');
    const conReacciones = new MensajeConReaccion(base);

    expect(conReacciones.getContenido()).toBe('Contenido importante');
    expect(conReacciones.render().contenido).toBe('Contenido importante');
  });

  it('permite múltiples reacciones del mismo usuario', () => {
    const base = new MensajeBase('Mensaje');
    const conReacciones = new MensajeConReaccion(base);

    conReacciones.agregarReaccion({
      emoji: '👍',
      usuarioId: 'user-1',
      fecha: new Date(),
    });
    conReacciones.agregarReaccion({
      emoji: '❤️',
      usuarioId: 'user-1',
      fecha: new Date(),
    });

    const resultado = conReacciones.render();
    expect(resultado.reacciones).toHaveLength(2);
  });
});

// ──────────────────────────────────────────────────────────────────
// CRITERIO 5: Validación de responsabilidades - cada clase cumple su rol
// ──────────────────────────────────────────────────────────────────
describe('Validacion de responsabilidades del Decorator', () => {
  it('MensajeBase: responsabilidad = contenido plano solamente', () => {
    const mensaje = new MensajeBase('Solo texto');
    const resultado = mensaje.render();

    expect(Object.keys(resultado).length).toBe(1);
    expect('contenido' in resultado).toBe(true);
  });

  it('MensajeConArchivo: responsabilidad = agregar archivo', () => {
    const archivo: ArchivoDTO = {
      nombre: 'file.txt',
      url: 'https://ejemplo.com/file.txt',
    };

    const base = new MensajeBase('Texto');
    const conArchivo = new MensajeConArchivo(base, archivo);

    // Solo debe agregar archivo sin modificar base
    const resultado = conArchivo.render();
    expect('contenido' in resultado).toBe(true);
    expect('archivo' in resultado).toBe(true);
    expect('menciones' in resultado).toBe(false);
  });

  it('MensajeConMencion: responsabilidad = agregar menciones', () => {
    const menciones: MencionDTO[] = [
      { usuarioId: 'u1', nombre: 'Test', correo: 'test@uni.edu.co' },
    ];

    const base = new MensajeBase('Texto');
    const conMenciones = new MensajeConMencion(base, menciones);

    // Solo debe agregar menciones sin modificar base
    const resultado = conMenciones.render();
    expect('contenido' in resultado).toBe(true);
    expect('menciones' in resultado).toBe(true);
    expect('archivo' in resultado).toBe(false);
  });

  it('MensajeConReaccion: responsabilidad = agregar reacciones', () => {
    const reacciones: ReaccionDTO[] = [
      { emoji: '👍', usuarioId: 'user-1', fecha: new Date() },
    ];

    const base = new MensajeBase('Texto');
    const conReacciones = new MensajeConReaccion(base, reacciones);

    // Solo debe agregar reacciones sin modificar base
    const resultado = conReacciones.render();
    expect('contenido' in resultado).toBe(true);
    expect('reacciones' in resultado).toBe(true);
    expect('archivo' in resultado).toBe(false);
  });

  it('cada decorador SIN romper el comportamiento base', () => {
    const contenidoOriginal = 'Mensaje de prueba';
    const base = new MensajeBase(contenidoOriginal);

    // Aplicar decoradores
    const archivo: ArchivoDTO = {
      nombre: 'doc.pdf',
      url: 'https://ejemplo.com/doc.pdf',
    };
    const menciones: MencionDTO[] = [
      { usuarioId: 'u1', nombre: 'User', correo: 'user@uni.edu.co' },
    ];
    const reacciones: ReaccionDTO[] = [
      { emoji: '👍', usuarioId: 'u2', fecha: new Date() },
    ];

    const decorado = new MensajeConReaccion(
      new MensajeConMencion(new MensajeConArchivo(base, archivo), menciones),
      reacciones,
    );

    const resultado = decorado.render();

    // El contenido base NUNCA cambia
    expect(resultado.contenido).toBe(contenidoOriginal);
    expect(decorado.getContenido()).toBe(contenidoOriginal);
  });
});
