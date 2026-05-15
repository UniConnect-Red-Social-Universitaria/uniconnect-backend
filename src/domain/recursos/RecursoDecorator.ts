import { RecursoComponent } from './RecursoComponent';

export abstract class RecursoDecorator implements RecursoComponent {
    protected componente: RecursoComponent;

    constructor(componente: RecursoComponent) {
        this.componente = componente;
    }

    getContenido(): string {
        return this.componente.getContenido();
    }

    getMetadata(): any {
        return this.componente.getMetadata();
    }
}