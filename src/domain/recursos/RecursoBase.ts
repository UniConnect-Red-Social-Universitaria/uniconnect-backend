import { RecursoComponent } from './RecursoComponent';

export class RecursoBase implements RecursoComponent {
    constructor(
        private titulo: string,
        private contenido: string,
        private metadataBase: any = {}
    ) { }

    getContenido(): string {
        return this.contenido;
    }

    getMetadata(): any {
        return {
            titulo: this.titulo,
            ...this.metadataBase,
        };
    }
}