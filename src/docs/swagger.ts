import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'UniConnect API',
      version: '1.0.0',
      description: 'API REST de la red social universitaria UniConnect',
    },
    servers: [
      { url: 'https://uniconnect-backend.fly.dev', description: 'Producción' },
      { url: 'http://localhost:3000', description: 'Desarrollo local' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
        Usuario: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            nombre: { type: 'string' },
            apellido: { type: 'string' },
            correo: { type: 'string', format: 'email' },
            carrera: { type: 'string' },
            semestre: { type: 'integer' },
          },
        },
        ForoPregunta: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            titulo: { type: 'string' },
            contenido: { type: 'string' },
            autorId: { type: 'string' },
            autorNombre: { type: 'string' },
            materiaId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ForoRespuesta: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            contenido: { type: 'string' },
            autorId: { type: 'string' },
            autorNombre: { type: 'string' },
            preguntaId: { type: 'string' },
            puntuacion: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        SesionEstudio: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            titulo: { type: 'string' },
            descripcion: { type: 'string' },
            lugar: { type: 'string' },
            fecha: { type: 'string', format: 'date-time' },
            recordatorioMinutos: { type: 'integer' },
            cancelada: { type: 'boolean' },
            modificada: { type: 'boolean' },
            serieId: { type: 'string' },
            creadorId: { type: 'string' },
          },
        },
        SerieEstudio: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            titulo: { type: 'string' },
            descripcion: { type: 'string' },
            lugar: { type: 'string' },
            frecuencia: { type: 'string', enum: ['DIARIA', 'SEMANAL', 'QUINCENAL'] },
            fechaInicio: { type: 'string', format: 'date-time' },
            fechaFin: { type: 'string', format: 'date-time' },
            recordatorioMinutos: { type: 'integer' },
            sesiones: { type: 'array', items: { $ref: '#/components/schemas/SesionEstudio' } },
          },
        },
        Evento: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            titulo: { type: 'string' },
            descripcion: { type: 'string' },
            lugar: { type: 'string' },
            fechaEvento: { type: 'string', format: 'date-time' },
            categoria: { type: 'string', enum: ['academico', 'cultural', 'deportivo', 'otro'] },
            creadorId: { type: 'string' },
          },
        },
        Grupo: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            nombre: { type: 'string' },
            materiaId: { type: 'string' },
            materia: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                nombre: { type: 'string' },
              },
            },
            creadorId: { type: 'string' },
            administradorId: { type: 'string' },
            cantidadMiembros: { type: 'integer' },
            miembros: {
              type: 'array',
              items: { $ref: '#/components/schemas/Usuario' },
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Mensaje: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            contenido: { type: 'string' },
            remitenteId: { type: 'string' },
            remitenteNombre: { type: 'string' },
            destinatarioId: { type: 'string' },
            grupoId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Materia: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            nombre: { type: 'string' },
            codigo: { type: 'string' },
            descripcion: { type: 'string' },
          },
        },
        PreferenciaNotificacion: {
          type: 'object',
          properties: {
            tipoEvento: { type: 'string', enum: ['academico', 'social', 'grupo', 'sistema'] },
            activo: { type: 'boolean' },
            canales: {
              type: 'array',
              items: { type: 'string', enum: ['push', 'email', 'inApp'] },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/interfaces/http/*.routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
