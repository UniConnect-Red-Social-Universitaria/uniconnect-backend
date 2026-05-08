# UniConnect Backend

API REST + Socket.IO para la red social académica **UniConnect**.

## Tecnologías

- Node.js + Express
- TypeScript
- Prisma ORM
- MongoDB
- JWT para autenticación
- Socket.IO para chat en tiempo real

## Requisitos

- Node.js 18+
- npm 9+
- MongoDB (local o en la nube)

## Instalación

1. Instala dependencias:

```bash
npm install
```

2. Crea tu archivo de entorno:

```bash
cp .env_ejemplo .env
```

3. Configura `.env` con tus valores reales.

4. Genera el cliente de Prisma:

```bash
npx prisma generate
```

5. Sincroniza el esquema con MongoDB:

```bash
npx prisma db push
```

## Variables de entorno

Basado en `.env_ejemplo`:

```env
PORT=3000
JWT_SECRET=mi_secreto_super_seguro_2024
JWT_EXPIRES_IN=30d
DATABASE_URL=""
GOOGLE_CLIENT_ID=
DEV_MODE=true
```

Variables adicionales soportadas:

- `INSTITUTIONAL_EMAIL_DOMAINS` (opcional): dominios permitidos separados por coma. Ejemplo: `ucaldas.edu.co,otro.edu.co`.
  - Si no se define, se usa `ucaldas.edu.co` por defecto.

## Scripts disponibles

- `npm run dev`: levanta el servidor en desarrollo con nodemon.
- `npm run generate:openapi`: genera `openapi.json` desde los JSDoc de las rutas.
- `npm run build`: genera `openapi.json` y compila TypeScript a `dist/`.
- `npm start`: ejecuta el servidor compilado (`dist/server.js`).
- `npm test`: ejecuta pruebas con Jest.
- `npm run test:watch`: ejecuta pruebas en modo watch.
- `npm run test:coverage`: genera cobertura de pruebas.

## Documentación viva del API (OpenAPI 3)

La especificación OpenAPI 3 se genera automáticamente desde los comentarios JSDoc de cada archivo `*.routes.ts`.

### Acceder a Swagger UI

Con el servidor corriendo, visita:

```
http://localhost:3000/docs
```

Verás todos los endpoints, DTOs, parámetros y códigos de respuesta documentados e interactivos.

### Descargar el spec en JSON

```
GET http://localhost:3000/openapi.json
```

### Cómo agregar un endpoint nuevo (guía paso a paso)

1. **Crea la ruta** en `src/modules/<modulo>/interfaces/http/<modulo>.routes.ts` con el comentario JSDoc:

```ts
/**
 * @swagger
 * /api/mi-modulo:
 *   get:
 *     summary: Descripción breve
 *     tags: [MiModulo]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/MiDTO' }
 */
router.get('/', verificarJWT, MiController.listar);
```

2. **(Opcional) Agrega el schema** del DTO en `src/docs/swagger.ts` dentro de `components.schemas`.

3. **Regenera el spec** (se ejecuta automáticamente en `npm run build`):

```bash
npm run generate:openapi
```

4. **Regenera los tipos TypeScript** en el monorepo frontend:

```bash
cd ../Frontend-UnConnect
npm run generate:api-types
```

5. **Usa el tipo en web o móvil**:

```ts
import type { components } from '@uniconnect/api-types';

type MiDTO = components['schemas']['MiDTO'];
```

6. **Valida la respuesta con Zod** (añade el schema en `packages/api-types/src/schemas.ts`):

```ts
import { MiDTOSchema } from '@uniconnect/api-types';

const data = MiDTOSchema.parse(response.data);
```

Si el contrato del backend cambia y el cliente no actualiza, **la compilación TypeScript fallará**, impidiendo que el error llegue a runtime.

## Ejecución

### Desarrollo

```bash
npm run dev
```

### Producción (local)

```bash
npm run build
npm start
```

Servidor base: `http://localhost:3000` (o el puerto de `PORT`).

## Autenticación

- El login retorna un token JWT.
- Envía el token en rutas protegidas con header:

```http
Authorization: Bearer <token>
```

## Flujo de registro con Google

- En `DEV_MODE=true`, el backend omite validación real de Google y permite pruebas.
- En `DEV_MODE=false`, exige `GOOGLE_CLIENT_ID` y valida `googleIdToken`.
- Script de apoyo en desarrollo: `get-google-token.js`.

Ejecutar:

```bash
node get-google-token.js
```

## Rutas principales

Prefijo base: `/api`

### Usuarios (`/api/usuarios`)

- `POST /registro` (pública)
- `POST /login` (pública)
- `GET /` (pública)
- `GET /perfil` (protegida)
- `PUT /perfil` (protegida)
- `POST /logout` (protegida)
- `GET /buscar-por-materia?materia=...` o `GET /buscar-por-materia?q=...` (protegida)
- `POST /buscar-por-materia` body `{ materia | q | query }` (protegida)
- `POST /solicitudes` (protegida)
- `GET /solicitudes-recibidas` (protegida)
- `POST /solicitudes/aceptar` (protegida)
- `GET /companeros` (protegida)

### Materias (`/api/materias`)

- `POST /` (protegida)
- `GET /` (pública)

### Grupos (`/api/grupos`)

- `POST /` (protegida)

### Mensajes (`/api/mensajes`)

- `POST /` (protegida)
- `GET /:companeroId` (protegida)

### Eventos (`/api/eventos`)

- `POST /` (protegida)
- `GET /` (pública)

### Catálogos (`/api/catalogos`)

- `POST /poblar` (protegida)
- `GET /` (pública)

## Socket.IO (chat en tiempo real)

- El servidor de sockets corre en el mismo host/puerto del backend.
- El cliente debe conectarse enviando token en `auth`:

```ts
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: '<JWT>' }
});
```

Eventos emitidos por el backend:

- `mensaje:nuevo` (al receptor)
- `mensaje:enviado` (al emisor)

## Estructura del proyecto

- `src/controllers`: lógica de negocio
- `src/routes`: definición de endpoints
- `src/models`: acceso a datos con Prisma
- `src/middleware`: autenticación y validaciones
- `src/lib`: utilidades compartidas (Prisma, Socket, blacklist)
- `src/utils`: funciones auxiliares
- `prisma/schema.prisma`: modelo de datos

## Estado de salud

`GET /` responde información general de la API y endpoints de referencia.

# Configuración del token NGrok
- No olvides hacer npm install (npm install ngrok)
1. Crea una cuenta en: [ngrok.com](https://ngrok.com/?homepage-cta-docs=test)
2. En el menú de la izquierda, busca la sección "Your Authtoken".
3. Configura el token con: 
```bash 
ngrok config add-authtoken TU_TOKEN_AQUI 
```
4. Correr el backen normalmente
5. En otra terminal correr
```bash
ngrok http 3001

```

## Despliegue
- **URL Base:** https://tu-app.fly.dev
- **Health Check:** https://tu-app.fly.dev/health