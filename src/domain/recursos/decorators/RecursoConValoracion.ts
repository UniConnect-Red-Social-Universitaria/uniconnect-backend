import { RecursoComponent } from '../RecursoComponent';
import { RecursoDecorator } from '../RecursoDecorator';

export class RecursoConValoracion extends RecursoDecorator {
    constructor(
        componente: RecursoComponent,
        private puntuacionInfo: { acumulado: number; totalVotos: number }
    ) {
        super(componente);
    }

    getMetadata(): any {
        const baseMetadata = super.getMetadata();

        // Calculamos el promedio
        const promedio = this.puntuacionInfo.totalVotos > 0
            ? Number((this.puntuacionInfo.acumulado / this.puntuacionInfo.totalVotos).toFixed(1))
            : 0;

        return {
            ...baseMetadata,
            valoracion: {
                acumulado: this.puntuacionInfo.acumulado,
                totalVotos: this.puntuacionInfo.totalVotos,
                promedio
            }
        };
    }
}