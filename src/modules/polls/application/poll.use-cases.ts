import {
    AuthenticatedUser,
    CreatePollData,
    CreatePollOptionData,
    PollGateway,
    PollBroadcastRecord,
    PollOptionView,
    PollRepository,
    PollWithOptionsRecord,
    GroupRepository,
    CreatePollVoteData,
} from '../../../domain/contracts';
import { ApplicationError } from '../../../shared/application-error';
import {
    normalizePollOptionText,
    normalizePollQuestion,
    calcularResultadosEncuesta,
    isPollOpen,
    shouldAutoClosePoll,
    validatePollVoteData,
    validatePollCreationData,
} from '../domain/poll';

type CreateGroupPollInput = {
    pregunta: unknown;
    opciones: unknown;
    autoCloseAt: unknown;
};

function parseAutoCloseAt(value: unknown): Date | null {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    if (value instanceof Date) {
        return value;
    }

    if (typeof value !== 'string') {
        throw new ApplicationError(400, 'La fecha de cierre debe enviarse en formato ISO');
    }

    const fecha = new Date(value);

    if (Number.isNaN(fecha.getTime())) {
        throw new ApplicationError(400, 'La fecha de cierre tiene formato inválido');
    }

    return fecha;
}

function parseOptions(value: unknown): CreatePollOptionData[] {
    if (!Array.isArray(value)) {
        throw new ApplicationError(400, 'Debes enviar opciones de encuesta válidas');
    }

    return value.map((option, index) => {
        if (typeof option === 'string') {
            return {
                text: normalizePollOptionText(option),
                position: index + 1,
            };
        }

        if (option && typeof option === 'object' && 'text' in option) {
            const optionObject = option as { text?: unknown; position?: unknown };

            return {
                text: normalizePollOptionText(String(optionObject.text ?? '')),
                position: typeof optionObject.position === 'number' ? optionObject.position : index + 1,
            };
        }

        throw new ApplicationError(400, 'Cada opción debe ser texto válido');
    });
}

function buildPollPayload(
    poll: Awaited<ReturnType<PollRepository['create']>>,
    options: PollOptionView[],
    grupoId: string,
): PollBroadcastRecord {
    return {
        ...poll,
        grupoId,
        opciones: options,
    };
}

function buildFinalClosedPollError(): ApplicationError {
    return new ApplicationError(409, 'La encuesta está cerrada o expiró');
}

export class PollUseCases {
    constructor(
        private readonly pollRepository: PollRepository,
        private readonly groupRepository: GroupRepository,
        private readonly pollGateway: PollGateway,
    ) { }

    async crearEncuestaEnGrupo(
        usuario: AuthenticatedUser | undefined,
        grupoId: unknown,
        input: CreateGroupPollInput,
    ) {
        const authUser = this.ensureAuthenticated(usuario);

        if (typeof grupoId !== 'string' || !grupoId.trim()) {
            throw new ApplicationError(400, 'Debes enviar un grupoId válido');
        }

        const grupo = await this.groupRepository.findById(grupoId.trim());

        if (!grupo) {
            throw new ApplicationError(404, 'El grupo no existe');
        }

        const esMiembro = grupo.miembros.some((miembro) => miembro.usuarioId === authUser.id);

        if (!esMiembro) {
            throw new ApplicationError(403, 'No eres miembro de este grupo');
        }

        const pregunta = typeof input.pregunta === 'string' ? normalizePollQuestion(input.pregunta) : '';
        const opciones = parseOptions(input.opciones);
        const autoCloseAt = parseAutoCloseAt(input.autoCloseAt);

        try {
            validatePollCreationData({
                question: pregunta,
                target: { type: 'CHANNEL', id: grupo.id },
                createdById: authUser.id,
                options: opciones,
                autoCloseAt,
            });
        } catch (error) {
            throw new ApplicationError(400, error instanceof Error ? error.message : 'Datos de encuesta inválidos');
        }

        const encuesta = await this.pollRepository.create({
            question: pregunta,
            target: { type: 'CHANNEL', id: grupo.id },
            createdById: authUser.id,
            options: opciones,
            autoCloseAt,
        });

        const opcionesGuardadas = await this.pollRepository.listOptionsByPollId(encuesta.id);
        const payload = buildPollPayload(
            encuesta,
            opcionesGuardadas.map((option) => ({ ...option, votos: 0 })),
            grupo.id,
        );

        this.pollGateway.emitNewPoll(payload);

        return {
            message: 'Encuesta creada correctamente',
            data: payload,
        };
    }

    async votarEncuestaEnGrupo(
        usuario: AuthenticatedUser | undefined,
        encuestaId: unknown,
        input: { optionId: unknown },
    ) {
        const authUser = this.ensureAuthenticated(usuario);

        if (typeof encuestaId !== 'string' || !encuestaId.trim()) {
            throw new ApplicationError(400, 'Debes enviar un encuestaId válido');
        }

        const optionId = typeof input.optionId === 'string' ? input.optionId.trim() : '';

        validatePollVoteData({
            pollId: encuestaId.trim(),
            optionId,
            voterId: authUser.id,
        });

        const encuesta = await this.pollRepository.findById(encuestaId.trim());

        if (!encuesta) {
            throw new ApplicationError(404, 'La encuesta no existe');
        }

        if (encuesta.target.type !== 'CHANNEL') {
            throw new ApplicationError(400, 'Solo se pueden votar encuestas de canal');
        }

        const grupo = await this.groupRepository.findById(encuesta.target.id);

        if (!grupo) {
            throw new ApplicationError(404, 'El grupo de la encuesta no existe');
        }

        const esMiembro = grupo.miembros.some((miembro) => miembro.usuarioId === authUser.id);

        if (!esMiembro) {
            throw new ApplicationError(403, 'No eres miembro de este grupo');
        }

        if (shouldAutoClosePoll(encuesta)) {
            const cerrada = await this.pollRepository.updateStatus(encuesta.id, {
                status: 'CLOSED',
                closedAt: new Date(),
            });

            const opcionesCerrada = await this.pollRepository.listOptionsByPollId(cerrada.id);
            const votosCerrada = await this.pollRepository.listVotesByPollId(cerrada.id);
            const grupoId = cerrada.target.type === 'CHANNEL' ? cerrada.target.id : '';
            const payloadCerrado = buildPollPayload(
                cerrada,
                calcularResultadosEncuesta(opcionesCerrada, votosCerrada),
                grupoId,
            );

            this.pollGateway.emitUpdatedPoll(payloadCerrado);

            throw buildFinalClosedPollError();
        }

        if (!isPollOpen(encuesta)) {
            throw buildFinalClosedPollError();
        }

        const opciones = await this.pollRepository.listOptionsByPollId(encuesta.id);
        const opcionSeleccionada = opciones.find((option) => option.id === optionId);

        if (!opcionSeleccionada) {
            throw new ApplicationError(400, 'La opción elegida no pertenece a esta encuesta');
        }

        const votosPrevios = await this.pollRepository.listVotesByPollId(encuesta.id);

        if (votosPrevios.some((vote) => vote.voterId === authUser.id)) {
            throw new ApplicationError(409, 'Ya votaste en esta encuesta');
        }

        try {
            await this.pollRepository.vote({
                pollId: encuesta.id,
                optionId: opcionSeleccionada.id,
                voterId: authUser.id,
            });
        } catch (error) {
            throw new ApplicationError(409, error instanceof Error ? error.message : 'No se pudo registrar el voto');
        }

        const votosActuales = await this.pollRepository.listVotesByPollId(encuesta.id);
        const opcionesConResultados = calcularResultadosEncuesta(opciones, votosActuales);
        const payload = buildPollPayload(
            encuesta,
            opcionesConResultados,
            grupo.id,
        );

        this.pollGateway.emitUpdatedPoll(payload);

        return {
            message: 'Voto registrado correctamente',
            data: payload,
        };
    }

    async obtenerEncuestasDeGrupo(
        usuario: AuthenticatedUser | undefined,
        grupoId: unknown,
    ) {
        this.ensureAuthenticated(usuario);

        if (typeof grupoId !== 'string' || !grupoId.trim()) {
            throw new ApplicationError(400, 'Debes enviar un grupoId válido');
        }

        const grupo = await this.groupRepository.findById(grupoId.trim());

        if (!grupo) {
            throw new ApplicationError(404, 'El grupo no existe');
        }

        const esMiembro = grupo.miembros.some((miembro) => miembro.usuarioId === usuario!.id);

        if (!esMiembro) {
            throw new ApplicationError(403, 'No eres miembro de este grupo');
        }

        const encuestas = await this.pollRepository.listByTarget({ type: 'CHANNEL', id: grupo.id });

        const payloads: PollBroadcastRecord[] = [];

        for (const encuesta of encuestas) {
            const opciones = await this.pollRepository.listOptionsByPollId(encuesta.id);
            const votos = await this.pollRepository.listVotesByPollId(encuesta.id);
            const opcionesConResultados = calcularResultadosEncuesta(opciones, votos);
            payloads.push(buildPollPayload(encuesta, opcionesConResultados, grupo.id));
        }

        // Ordenar de más antigua a más reciente para respetar el orden cronológico del chat
        payloads.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        return { data: payloads };
    }

    async cerrarEncuestasExpiradas(ahora: Date = new Date()) {
        const encuestasExpiradas = await this.pollRepository.findExpiredOpen(ahora);
        const cerradas: PollBroadcastRecord[] = [];

        for (const encuesta of encuestasExpiradas) {
            const cerrada = await this.pollRepository.updateStatus(encuesta.id, {
                status: 'CLOSED',
                closedAt: ahora,
            });

            const opciones = await this.pollRepository.listOptionsByPollId(cerrada.id);
            const votos = await this.pollRepository.listVotesByPollId(cerrada.id);
            const opcionesConResultados = calcularResultadosEncuesta(opciones, votos);
            const grupoId = cerrada.target.type === 'CHANNEL' ? cerrada.target.id : '';

            const payload = buildPollPayload(cerrada, opcionesConResultados, grupoId);

            this.pollGateway.emitUpdatedPoll(payload);
            cerradas.push(payload);
        }

        return { data: cerradas };
    }

    private ensureAuthenticated(usuario: AuthenticatedUser | undefined) {
        if (!usuario) {
            throw new ApplicationError(401, 'Usuario no autenticado');
        }

        return usuario;
    }
}
