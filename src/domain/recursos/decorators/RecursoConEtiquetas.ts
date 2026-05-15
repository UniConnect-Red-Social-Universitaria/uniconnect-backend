import { RecursoComponent } from '../RecursoComponent';
import { RecursoDecorator } from '../RecursoDecorator';

export class RecursoConEtiquetas extends RecursoDecorator {
    constructor(componente: RecursoComponent, private etiquetas: string[]) {
        super(componente);
    }

    getMetadata(): any {
        const baseMetadata = super.getMetadata();
        // Combinamos las etiquetas existentes (si hay) con las nuevas
        return {
            ...baseMetadata,
            etiquetas: [
                ...(baseMetadata.etiquetas || []),
                ...this.etiquetas
            ]
        };
    }
}