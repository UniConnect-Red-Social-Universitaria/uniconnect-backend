const prismaMock = {
    grupo: {
        count: jest.fn(),
    },
    usuarioGrupo: {
        count: jest.fn(),
    },
    mensaje: {
        count: jest.fn(),
    },
    grupoMensaje: {
        count: jest.fn(),
    },
};

jest.mock('../src/lib/prisma', () => ({
    __esModule: true,
    default: prismaMock,
    prisma: prismaMock,
}));

import { PrismaEstadisticasRepository } from '../src/modules/users/infrastructure/prisma-estadisticas.repository';

describe('PrismaEstadisticasRepository', () => {
    it('solo cuenta grupos activos en las estadísticas del perfil', async () => {
        prismaMock.grupo.count
            .mockResolvedValueOnce(5)
            .mockResolvedValueOnce(3);
        prismaMock.usuarioGrupo.count.mockResolvedValueOnce(8);
        prismaMock.mensaje.count.mockResolvedValueOnce(11);
        prismaMock.grupoMensaje.count.mockResolvedValueOnce(4);

        const repository = new PrismaEstadisticasRepository();

        const stats = await repository.obtenerEstadisticas('user-1');

        expect(prismaMock.grupo.count).toHaveBeenNthCalledWith(1, {
            where: { creadorId: 'user-1', estado: 'ACTIVO' },
        });
        expect(prismaMock.usuarioGrupo.count).toHaveBeenCalledWith({
            where: { usuarioId: 'user-1', grupo: { estado: 'ACTIVO' } },
        });
        expect(stats).toEqual({
            gruposCreados: 5,
            gruposParticipa: 8,
            mensajesEnviados: 15,
        });
    });
});