/// <reference types="jest" />

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import ogs from 'open-graph-scraper';
import { detectResourceType, extractOpenGraph, findUrlsInText, getDomain } from '../src/utils/open-graph.util';

jest.mock('open-graph-scraper', () => jest.fn());

const ogsMock = ogs as any;

describe('Open Graph util', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('filters de recursos', () => {
        it('detectResourceType clasifica videos, pdf, repositorios, docs, ia e imagenes', () => {
            expect(detectResourceType('https://youtube.com/watch?v=abc')).toBe('video');
            expect(detectResourceType('https://example.com/guide.pdf')).toBe('pdf');
            expect(detectResourceType('https://github.com/uniconnect/repo')).toBe('repo');
            expect(detectResourceType('https://docs.google.com/document/d/1')).toBe('doc');
            expect(detectResourceType('https://openai.com')).toBe('ai');
            expect(detectResourceType('https://cdn.example.com/image.png')).toBe('image');
            expect(detectResourceType('https://example.com')).toBe('link');
        });

        it('findUrlsInText extrae multiples URLs del contenido', () => {
            const urls = findUrlsInText('Ver https://uno.com y luego https://dos.com/path');

            expect(urls).toEqual(['https://uno.com', 'https://dos.com/path']);
        });

        it('getDomain limpia www y conserva el host', () => {
            expect(getDomain('https://www.example.com/ruta')).toBe('example.com');
        });
    });

    describe('extractOpenGraph', () => {
        it('retorna datos Open Graph cuando la extraccion responde correctamente', async () => {
            ogsMock.mockResolvedValue({
                error: false,
                result: {
                    ogTitle: 'Clase de prueba',
                    ogDescription: 'Descripcion',
                    ogUrl: 'https://example.com/post',
                    ogSiteName: 'Example',
                    ogImage: [{ url: 'https://example.com/image.png' }],
                },
            });

            const resultado = await extractOpenGraph('https://example.com/post');

            expect(resultado).toMatchObject({
                title: 'Clase de prueba',
                description: 'Descripcion',
                image: 'https://example.com/image.png',
                url: 'https://example.com/post',
                siteName: 'Example',
                domain: 'example.com',
                resourceType: 'link',
            });
        });

        it('usa fallback de Google Drive cuando falla la extraccion remota', async () => {
            ogsMock.mockRejectedValue(new Error('timeout'));

            const resultado = await extractOpenGraph('https://drive.google.com/file/d/abc123/view');

            expect(resultado).toMatchObject({
                domain: 'drive.google.com',
                siteName: 'Google Drive',
                image: 'https://drive.google.com/thumbnail?id=abc123&sz=w640',
                resourceType: 'link',
            });
        });
    });
});