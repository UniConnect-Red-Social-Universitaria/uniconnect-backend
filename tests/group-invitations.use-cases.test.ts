jest.mock('../src/lib/cloudinary', () => ({ cloudinary: {} }));

import { GroupUseCases } from '../src/modules/groups/application/group.use-cases';

describe('GroupUseCases invitations', () => {
    const buildUseCases = (overrides: Partial<any> = {}) => {
        const group = {
            id: 'grupo-1',
            nombre: 'Grupo Insignia',
            materia: { id: 'mat-1', nombre: 'Estructuras de Datos' },
            administradorId: 'admin-1',
            miembros: [],
            creadorId: 'admin-1',
            estado: 'ACTIVO',
        };

        const userDestino = {
            id: 'user-2',
            nombre: 'Ana',
            apellido: 'Perez',
            correo: 'ana@example.com',
            materiasCursando: ['Estructuras de Datos'],
        };

        const solicitud = {
            id: 'sol-1',
            solicitanteId: 'user-2',
            grupoId: 'grupo-1',
            tipo: 'INVITACION',
            estado: 'PENDIENTE',
            createdAt: new Date(),
            updatedAt: new Date(),
            grupo: group,
            solicitante: { id: 'user-2', nombre: 'Ana', apellido: 'Perez', correo: 'ana@example.com' },
        };

        const observers = [
            {
                onSolicitudNueva: jest.fn(),
                onSolicitudResuelta: jest.fn(),
                onAdminTransferido: jest.fn(),
                onTransferenciaPendiente: jest.fn(),
                onTransferenciaAceptada: jest.fn(),
                onTransferenciaRechazada: jest.fn(),
                onTransferenciaCancelada: jest.fn(),
            },
        ];

        const groupRepository = {
            findById: jest.fn().mockResolvedValue(group),
            join: jest.fn().mockResolvedValue(undefined),
            leave: jest.fn().mockResolvedValue(undefined),
            updateEstado: jest.fn().mockResolvedValue(undefined),
            updateCandidatoAdmin: jest.fn().mockResolvedValue(undefined),
            deleteGroup: jest.fn().mockResolvedValue(undefined),
            findByName: jest.fn(),
            countByMateria: jest.fn(),
            create: jest.fn(),
            listByUser: jest.fn(),
            listAvailable: jest.fn(),
            searchByText: jest.fn(),
        };

        const solicitudGrupoRepository = {
            crear: jest.fn().mockResolvedValue(solicitud),
            buscarPendiente: jest.fn().mockResolvedValue(null),
            listarPorGrupo: jest.fn(),
            listarPorUsuario: jest.fn(),
            aprobar: jest.fn().mockResolvedValue(solicitud),
            rechazar: jest.fn().mockResolvedValue(solicitud),
            buscarPorId: jest.fn().mockResolvedValue(solicitud),
            eliminarRechazada: jest.fn().mockResolvedValue(undefined),
        };

        const useCases = new GroupUseCases(
            groupRepository as any,
            {} as any,
            {
                findSafeById: jest.fn().mockResolvedValue(userDestino),
            } as any,
            {} as any,
            solicitudGrupoRepository as any,
            observers as any,
        );

        return { useCases, groupRepository, solicitudGrupoRepository, observers, group, userDestino, solicitud };
    };

    it('envía una invitación pendiente cuando el admin pulsa agregar miembro', async () => {
        const { useCases, solicitudGrupoRepository, observers } = buildUseCases();

        const result = await useCases.agregarMiembro(
            { id: 'admin-1', correo: 'admin@example.com', nombre: 'Admin', materiasCursando: ['Estructuras de Datos'] },
            'grupo-1',
            'user-2',
        );

        expect(solicitudGrupoRepository.crear).toHaveBeenCalledWith('user-2', 'grupo-1', 'INVITACION');
        expect(observers[0].onSolicitudNueva).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'INVITACION' }));
        expect(result).toEqual({ message: 'Solicitud enviada al estudiante' });
    });

    it('acepta una invitación del usuario invitado y lo agrega al grupo', async () => {
        const { useCases, groupRepository, solicitudGrupoRepository, observers } = buildUseCases();

        const result = await useCases.aceptarInvitacion(
            { id: 'user-2', correo: 'ana@example.com', nombre: 'Ana', materiasCursando: ['Estructuras de Datos'] },
            'grupo-1',
            'sol-1',
        );

        expect(solicitudGrupoRepository.aprobar).toHaveBeenCalledWith('sol-1');
        expect(groupRepository.join).toHaveBeenCalledWith('grupo-1', 'user-2');
        expect(observers[0].onSolicitudResuelta).toHaveBeenCalledWith(expect.objectContaining({ estado: 'APROBADA' }));
        expect(result).toEqual({ message: 'Has aceptado unirte al grupo' });
    });

    it('rechaza una invitación y permite reenviarla luego', async () => {
        const { useCases, solicitudGrupoRepository } = buildUseCases();

        const result = await useCases.rechazarInvitacion(
            { id: 'user-2', correo: 'ana@example.com', nombre: 'Ana', materiasCursando: ['Estructuras de Datos'] },
            'grupo-1',
            'sol-1',
        );

        expect(solicitudGrupoRepository.rechazar).toHaveBeenCalledWith('sol-1');
        expect(solicitudGrupoRepository.eliminarRechazada).toHaveBeenCalledWith('user-2', 'grupo-1', 'INVITACION');
        expect(result).toEqual({ message: 'Has rechazado la invitación al grupo' });
    });
});