import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function main() {
  const filtroEventosSinLugar = {
    $or: [
      { lugar: { $exists: false } },
      { lugar: null },
      { lugar: '' }
    ]
  };

  const antes = await prisma.$runCommandRaw({
    count: 'Evento',
    query: filtroEventosSinLugar
  }) as { n?: number };

  const resultado = await prisma.$runCommandRaw({
    update: 'Evento',
    updates: [
      {
        q: filtroEventosSinLugar,
        u: { $set: { lugar: 'Por definir' } },
        multi: true
      }
    ]
  }) as { nModified?: number; n?: number };

  const despues = await prisma.$runCommandRaw({
    count: 'Evento',
    query: filtroEventosSinLugar
  }) as { n?: number };

  console.log('Eventos sin lugar antes:', antes.n ?? 0);
  console.log('Eventos actualizados:', resultado.nModified ?? resultado.n ?? 0);
  console.log('Eventos sin lugar despues:', despues.n ?? 0);
}

main()
  .catch((error) => {
    console.error('Error migrando eventos:', error);
    throw error;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
