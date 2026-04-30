import 'dotenv/config';
import prisma from '../src/lib/prisma';

// Elimina registros de GrupoArchivo que tienen rutas locales (no URLs de Cloudinary).
// Estos archivos ya no existen en ningún servidor porque se guardaban en disco local.
async function main() {
    const filtroRutasLocales = {
        ruta: { $not: { $regex: '^https?://' } }
    };

    const conteo = await prisma.$runCommandRaw({
        count: 'GrupoArchivo',
        query: filtroRutasLocales
    }) as { n?: number };

    const total = conteo.n ?? 0;
    console.log(`Registros con ruta local encontrados: ${total}`);

    if (total === 0) {
        console.log('No hay registros que limpiar.');
        return;
    }

    const resultado = await prisma.$runCommandRaw({
        delete: 'GrupoArchivo',
        deletes: [{ q: filtroRutasLocales, limit: 0 }]
    }) as { n?: number };

    console.log(`Registros eliminados: ${resultado.n ?? 0}`);
}

main()
    .catch((error) => {
        console.error('Error limpiando archivos:', error);
        throw error;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
