import 'dotenv/config';
import prisma from '../src/lib/prisma';

const filtroSinCategoria = {
  $or: [
    { categoria: { $exists: false } },
    { categoria: null },
    { categoria: '' },
  ],
};

async function main() {
  const antes = await prisma.$runCommandRaw({
    count: 'Evento',
    query: filtroSinCategoria,
  }) as { n?: number };

  const resultado = await prisma.$runCommandRaw({
    update: 'Evento',
    updates: [
      {
        q: filtroSinCategoria,
        u: { $set: { categoria: 'otro' } },
        multi: true,
      },
    ],
  }) as { nModified?: number; n?: number };

  const despues = await prisma.$runCommandRaw({
    count: 'Evento',
    query: filtroSinCategoria,
  }) as { n?: number };

  console.log('Eventos sin categoria antes:  ', antes.n ?? 0);
  console.log('Eventos actualizados:         ', resultado.nModified ?? resultado.n ?? 0);
  console.log('Eventos sin categoria despues:', despues.n ?? 0);
}

main()
  .catch((error) => {
    console.error('Error migrando eventos:', error);
    throw error;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
