import prisma from '../lib/prisma';

function mensajeDelegate() {
    const prismaDinamico = prisma as unknown as {
        mensaje: {
            create: (args: unknown) => Promise<{
                id: string;
                contenido: string;
                emisorId: string;
                receptorId: string;
                createdAt: Date;
            }>;
        };
    };

    return prismaDinamico.mensaje;
}

export class MensajeModel {
    static async crear(data: { contenido: string; emisorId: string; receptorId: string }) {
        return mensajeDelegate().create({
            data
        });
    }
}
