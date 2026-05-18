import { RecursoComponent } from '../RecursoComponent';
import { RecursoDecorator } from '../RecursoDecorator';

export interface ComentarioRecurso {
    autorId: string;
    autorNombre?: string;
    contenido: string;
    fecha: Date;
}

export class RecursoConComentarios extends RecursoDecorator {
    constructor(componente: RecursoComponent, private comentarios: ComentarioRecurso[]) {
        super(componente);
    }

    getMetadata(): any {
        const baseMetadata = super.getMetadata();

        // Agregamos comentarios sin sobrescribir o perder los previos si los ubiera (aunque típicamente vienen en cascada)
        return {
            ...baseMetadata,
            comentarios: [
                ...(baseMetadata.comentarios || []),
                ...this.comentarios
            ]
        };
    }
}