/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { RecursoBase } from '../src/domain/recursos/RecursoBase';
import { RecursoConComentarios } from '../src/domain/recursos/decorators/RecursoConComentarios';
import { RecursoConEtiquetas } from '../src/domain/recursos/decorators/RecursoConEtiquetas';
import { RecursoConValoracion } from '../src/domain/recursos/decorators/RecursoConValoracion';
import { NotificacionBase } from '../src/shared/notificacion/INotificacion';
import { NotificacionConAccion } from '../src/shared/notificacion/NotificacionConAccion';
import { NotificacionConPrioridad } from '../src/shared/notificacion/NotificacionConPrioridad';

describe('Decorators de recursos', () => {
    it('RecursoBase conserva titulo, contenido y metadata base', () => {
        const base = new RecursoBase('Clase 1', 'https://example.com', { domain: 'example.com' });

        expect(base.getContenido()).toBe('https://example.com');
        expect(base.getMetadata()).toEqual({ titulo: 'Clase 1', domain: 'example.com' });
    });

    it('RecursoConEtiquetas acumula etiquetas sin perder las previas', () => {
        const recurso = new RecursoConEtiquetas(
            new RecursoBase('Guia', 'https://example.com', { etiquetas: ['base'] }),
            ['nueva', 'clase'],
        );

        expect(recurso.getMetadata()).toMatchObject({
            titulo: 'Guia',
            etiquetas: ['base', 'nueva', 'clase'],
        });
    });

    it('RecursoConComentarios concatena comentarios sin sobrescribir los anteriores', () => {
        const comentariosIniciales = [
            { autorId: 'u1', contenido: 'Buen recurso', fecha: new Date('2026-05-01T10:00:00Z') },
        ];
        const comentariosNuevos = [
            { autorId: 'u2', contenido: 'Gracias', fecha: new Date('2026-05-02T10:00:00Z') },
        ];

        const recurso = new RecursoConComentarios(
            new RecursoBase('Video', 'https://youtu.be/demo', { comentarios: comentariosIniciales }),
            comentariosNuevos,
        );

        expect(recurso.getMetadata()).toMatchObject({
            titulo: 'Video',
            comentarios: [...comentariosIniciales, ...comentariosNuevos],
        });
    });

    it('RecursoConValoracion calcula el promedio con un decimal', () => {
        const recurso = new RecursoConValoracion(
            new RecursoBase('PDF', 'https://example.com/doc.pdf'),
            { acumulado: 17, totalVotos: 5 },
        );

        expect(recurso.getMetadata()).toMatchObject({
            titulo: 'PDF',
            valoracion: {
                acumulado: 17,
                totalVotos: 5,
                promedio: 3.4,
            },
        });
    });

    it('la composicion de decorators mantiene todas las extensiones del recurso', () => {
        const recurso = new RecursoConValoracion(
            new RecursoConComentarios(
                new RecursoConEtiquetas(
                    new RecursoBase('Tema', 'https://example.com', { etiquetas: ['base'] }),
                    ['open-graph'],
                ),
                [{ autorId: 'u1', contenido: 'Excelente', fecha: new Date('2026-05-03T10:00:00Z') }],
            ),
            { acumulado: 8, totalVotos: 2 },
        );

        const metadata = recurso.getMetadata();

        expect(metadata).toMatchObject({
            titulo: 'Tema',
            etiquetas: ['base', 'open-graph'],
            comentarios: [expect.objectContaining({ autorId: 'u1' })],
            valoracion: { acumulado: 8, totalVotos: 2, promedio: 4 },
        });
    });
});

describe('Compatibilidad entre decorators de recursos y mensajes', () => {
    it('las cadenas de recursos y notificaciones conviven sin mezclar contratos', () => {
        const recurso = new RecursoConComentarios(
            new RecursoConEtiquetas(new RecursoBase('Clase', 'https://example.com'), ['matematica']),
            [{ autorId: 'u1', contenido: 'Buen enlace', fecha: new Date('2026-05-01T10:00:00Z') }],
        );

        const notificacion = new NotificacionConAccion(
            new NotificacionConPrioridad(new NotificacionBase('Nuevo recurso', 'usuario-1'), 'urgente'),
            { label: 'Abrir recurso', endpoint: '/api/recursos/1' },
        );

        const recursoMetadata = recurso.getMetadata();
        const notificacionRender = notificacion.render();

        expect(recursoMetadata).toHaveProperty('etiquetas');
        expect(recursoMetadata).toHaveProperty('comentarios');
        expect(recursoMetadata).not.toHaveProperty('nivel');
        expect(recursoMetadata).not.toHaveProperty('accion');

        expect(notificacionRender).toHaveProperty('nivel', 'urgente');
        expect(notificacionRender).toHaveProperty('accion');
        expect(notificacionRender).not.toHaveProperty('etiquetas');
        expect(notificacionRender).not.toHaveProperty('comentarios');
    });
});