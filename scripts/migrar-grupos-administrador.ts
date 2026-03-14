import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function main() {
  const filtroGruposAntiguos = {
    $or: [
      { administradorId: { $exists: false } },
      { administradorId: null },
      { estado: { $exists: false } },
      { estado: null },
      { estado: '' }
    ]
  };

  const antes = await prisma.$runCommandRaw({
    count: 'Grupo',
    query: filtroGruposAntiguos
  }) as { n?: number };

  const resultado = await prisma.$runCommandRaw({
    update: 'Grupo',
    updates: [
      {
        q: filtroGruposAntiguos,
        u: [
          {
            $set: {
              administradorId: { $ifNull: ['$administradorId', '$creadorId'] },
              estado: {
                $cond: [
                  {
                    $or: [
                      { $eq: ['$estado', null] },
                      { $eq: ['$estado', ''] },
                      { $not: ['$estado'] }
                    ]
                  },
                  'ACTIVO',
                  '$estado'
                ]
              }
            }
          }
        ],
        multi: true
      }
    ]
  }) as { nModified?: number; n?: number };

  const despues = await prisma.$runCommandRaw({
    count: 'Grupo',
    query: filtroGruposAntiguos
  }) as { n?: number };

  console.log('Grupos pendientes antes:', antes.n ?? 0);
  console.log('Grupos actualizados:', resultado.nModified ?? resultado.n ?? 0);
  console.log('Grupos pendientes despues:', despues.n ?? 0);
}

main()
  .catch((error) => {
    console.error('Error migrando grupos:', error);
    throw error;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });