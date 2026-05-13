import { PollGateway, PollRepository } from '../../../domain/contracts';
import { calcularResultadosEncuesta } from '../domain/poll';

export class PollAutoCloseScheduler {
    private intervalo: ReturnType<typeof setInterval> | null = null;

    constructor(
        private readonly pollRepository: PollRepository,
        private readonly pollGateway: PollGateway,
    ) { }

    iniciar(): void {
        if (this.intervalo) {
            return;
        }

        this.intervalo = setInterval(() => void this.verificar(), 60_000);
        void this.verificar();
    }

    detener(): void {
        if (this.intervalo) {
            clearInterval(this.intervalo);
            this.intervalo = null;
        }
    }

    private async verificar(): Promise<void> {
        const ahora = new Date();
        const encuestasExpiradas = await this.pollRepository.findExpiredOpen(ahora);

        for (const encuesta of encuestasExpiradas) {
            const cerrada = await this.pollRepository.updateStatus(encuesta.id, {
                status: 'CLOSED',
                closedAt: ahora,
            });

            const opciones = await this.pollRepository.listOptionsByPollId(cerrada.id);
            const votos = await this.pollRepository.listVotesByPollId(cerrada.id);
            const opcionesConResultados = calcularResultadosEncuesta(opciones, votos);

            if (cerrada.target.type !== 'CHANNEL') {
                continue;
            }

            this.pollGateway.emitUpdatedPoll({
                ...cerrada,
                grupoId: cerrada.target.id,
                opciones: opcionesConResultados,
            });
        }
    }
}
