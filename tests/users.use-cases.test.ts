jest.mock('../src/lib/socket', () => ({
    emitirSolicitudContactoRechazadaTiempoReal: jest.fn(),
    emitirSolicitudContactoTiempoReal: jest.fn(),
}));

const { UsersUseCases } = require('../src/modules/users/application/users.use-cases');

describe('UsersUseCases.buscarPorMateria', () => {
    it('busca usuarios por materia sin excluir contactos relacionados', async () => {
        const searchByMateriaExcluding = jest.fn().mockResolvedValue([
            { id: 'u-2', nombre: 'Ana', apellido: 'Perez', correo: 'ana@example.com' },
        ]);
        const getRelatedIds = jest.fn().mockResolvedValue(['u-2']);

        const useCases = new UsersUseCases({
            userRepository: {
                searchByMateriaExcluding,
            } as any,
            contactRepository: {
                getRelatedIds,
            } as any,
            careerRepository: {} as any,
            materiaRepository: {} as any,
            passwordService: {} as any,
            tokenService: {} as any,
            identityVerificationService: {} as any,
            tokenBlacklistService: {} as any,
            estadisticasRepository: {} as any,
        });

        const resultado = await useCases.buscarPorMateria(
            { id: 'u-1', correo: 'admin@example.com', nombre: 'Admin', materiasCursando: ['Calculo'] },
            'Calculo',
        );

        expect(getRelatedIds).not.toHaveBeenCalled();
        expect(searchByMateriaExcluding).toHaveBeenCalledWith('Calculo', 'u-1', []);
        expect(resultado).toEqual({
            data: [
                { id: 'u-2', nombre: 'Ana', apellido: 'Perez', correo: 'ana@example.com' },
            ],
        });
    });
});