# Guía de Implementación: Menciones y Reacciones en Chat

## 📋 Resumen General

Se ha implementado con éxito las siguientes features en el sistema de chat de UniConnect:

1. **Menciones de Compañeros (@username)** - En chat grupal e individual
2. **Reacciones a Mensajes (Emojis)** - En chat grupal e individual

## 🏗️ Arquitectura

### Componentes Clave

```
┌─────────────────────────────────────────────────────────┐
│               MessageUseCases                           │
│  - enviarMensaje (con menciones automáticas)           │
│  - enviarMensajeGrupo (con menciones automáticas)       │
│  - agregarReaccion()                                    │
│  - removerReaccion()                                    │
│  - obtenerReacciones()                                  │
│  - obtenerMencionesPendientes()                         │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│           PrismaMensajeRepository                       │
│  + addMencion()                                         │
│  + getMencionesByMensaje()                              │
│  + getMencionesPendientes()                             │
│  + addReaccion()                                        │
│  + removeReaccion()                                     │
│  + getReaccionesByMensaje()                             │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│           MensajeModel (Prisma)                        │
│  - agregarMencion()                                     │
│  - obtenerMencionesMensaje()                            │
│  - obtenerMencionesPendientes()                         │
│  - agregarReaccion()                                    │
│  - removerReaccion()                                    │
│  - obtenerReaccionesMensaje()                           │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│         Base de Datos - Nuevas Tablas                  │
│  - MencionMensaje                                       │
│  - MencionMensajeGrupo                                  │
│  - ReaccionMensaje                                      │
│  - ReaccionMensajeGrupo                                 │
└─────────────────────────────────────────────────────────┘
```

### Pattern Observer (Mejorado)

```
┌──────────────────┐
│   ChatSubject    │
├──────────────────┤
│ + suscribir()    │
│ + desuscribir()  │
│ + emitirNuevoMensaje()
│ + emitirReaccionAgregada()
│ + emitirReaccionRemovida()
│ + emitirMencionar()
└──────────────────┘
         ↓
┌─────────────────────────────┐
│     IChatObserver           │
├─────────────────────────────┤
│ + onNuevoMensajeGrupo()    │
│ + onReaccionAgregada()     │
│ + onReaccionRemovida()     │
│ + onMencionar()            │
└─────────────────────────────┘
         ↙           ↘
┌──────────────┐  ┌──────────────┐
│ WebChatObserv│  │MobileChatObs │
│ er (Socket)  │  │ver (Socket)  │
└──────────────┘  └──────────────┘
```

## 📊 Modelos de Base de Datos

### MencionMensaje
```prisma
model MencionMensaje {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  mensajeId String   @db.ObjectId
  usuarioMencionadoId String @db.ObjectId
  mensaje   Mensaje  @relation(fields: [mensajeId], references: [id], onDelete: Cascade)
  usuarioMencionado Usuario @relation("MencionesMensajes", fields: [usuarioMencionadoId], references: [id])
  createdAt DateTime @default(now())

  @@unique([mensajeId, usuarioMencionadoId])
  @@index([mensajeId])
  @@index([usuarioMencionadoId])
}
```

### MencionMensajeGrupo
```prisma
model MencionMensajeGrupo {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  mensajeId String   @db.ObjectId
  usuarioMencionadoId String @db.ObjectId
  mensaje   GrupoMensaje @relation(fields: [mensajeId], references: [id], onDelete: Cascade)
  usuarioMencionado Usuario @relation("MencionesMensajesGrupo", fields: [usuarioMencionadoId], references: [id])
  createdAt DateTime @default(now())

  @@unique([mensajeId, usuarioMencionadoId])
  @@index([mensajeId])
  @@index([usuarioMencionadoId])
}
```

### ReaccionMensaje
```prisma
model ReaccionMensaje {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  mensajeId String   @db.ObjectId
  usuarioId String   @db.ObjectId
  emoji     String   // emoji (ej: "👍", "❤️", "😂", etc.)
  mensaje   Mensaje  @relation(fields: [mensajeId], references: [id], onDelete: Cascade)
  usuario   Usuario  @relation("ReaccionesMensajes", fields: [usuarioId], references: [id])
  createdAt DateTime @default(now())

  @@unique([mensajeId, usuarioId, emoji])
  @@index([mensajeId])
  @@index([usuarioId])
}
```

### ReaccionMensajeGrupo
```prisma
model ReaccionMensajeGrupo {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  mensajeId String   @db.ObjectId
  usuarioId String   @db.ObjectId
  emoji     String   // emoji (ej: "👍", "❤️", "😂", etc.)
  mensaje   GrupoMensaje @relation(fields: [mensajeId], references: [id], onDelete: Cascade)
  usuario   Usuario  @relation("ReaccionesMensajesGrupo", fields: [usuarioId], references: [id])
  createdAt DateTime @default(now())

  @@unique([mensajeId, usuarioId, emoji])
  @@index([mensajeId])
  @@index([usuarioId])
}
```

## 🔌 Endpoints HTTP

### Reacciones

#### POST `/api/mensajes/:mensajeId/reacciones`
Agregar una reacción a un mensaje

**Request Body:**
```json
{
  "emoji": "👍",
  "esGrupo": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reacción agregada correctamente",
  "data": {
    "id": "string",
    "mensajeId": "string",
    "usuarioId": "string",
    "emoji": "👍",
    "usuario": {
      "id": "string",
      "nombre": "Juan",
      "apellido": "Pérez"
    },
    "createdAt": "2024-05-15T10:30:00Z"
  }
}
```

#### DELETE `/api/mensajes/:mensajeId/reacciones`
Remover una reacción de un mensaje

**Request Body:**
```json
{
  "emoji": "👍",
  "esGrupo": true
}
```

#### GET `/api/mensajes/:mensajeId/reacciones?esGrupo=true`
Obtener todas las reacciones de un mensaje

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "emoji": "👍",
      "count": 3,
      "usuarios": [
        { "id": "user1", "nombre": "Juan", "apellido": "Pérez" },
        { "id": "user2", "nombre": "María", "apellido": "García" },
        { "id": "user3", "nombre": "Carlos", "apellido": "López" }
      ]
    },
    {
      "emoji": "❤️",
      "count": 2,
      "usuarios": [
        { "id": "user4", "nombre": "Ana", "apellido": "Martínez" },
        { "id": "user5", "nombre": "Pedro", "apellido": "Rodríguez" }
      ]
    }
  ]
}
```

### Menciones

#### GET `/api/mensajes/menciones/pendientes`
Obtener las menciones pendientes del usuario autenticado

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "mention1",
      "mensajeId": "msg1",
      "usuarioMencionadoId": "user1",
      "usuarioMencionado": {
        "id": "user1",
        "nombre": "Juan",
        "apellido": "Pérez",
        "correo": "juan@example.com"
      },
      "createdAt": "2024-05-15T10:30:00Z"
    }
  ]
}
```

## 🎯 WebSocket Events

### Eventos de Reacciones

```typescript
// Cliente escucha: Reacción agregada a un mensaje grupal
socket.on('grupo:reaccion:agregada', (data) => {
  console.log(`${data.usuario.nombre} reaccionó con ${data.emoji}`);
  // Actualizar UI
});

// Cliente escucha: Reacción removida de un mensaje grupal
socket.on('grupo:reaccion:removida', (data) => {
  console.log(`${data.usuarioId} removió reacción ${data.emoji}`);
  // Actualizar UI
});
```

### Eventos de Menciones

```typescript
// Cliente escucha: Mención en un mensaje grupal
socket.on('grupo:mention', (data) => {
  console.log(`Fuiste mencionado por ${data.usuarioMencionado.nombre}`);
  // Mostrar notificación, resaltar mensaje, etc.
});
```

## 💻 Ejemplos de Uso

### Enviar mensaje con menciones automáticas

```bash
curl -X POST http://localhost:3000/api/mensajes/grupos \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "grupoId": "grupo123",
    "contenido": "Hola @juan y @maria, ¿cómo están?"
  }'
```

**Resultado:**
- El mensaje se crea
- Se detectan automáticamente las menciones a `juan` y `maria`
- Se crean registros en `MencionMensajeGrupo`
- Se emiten notificaciones a ambos usuarios
- Se emite evento WebSocket `grupo:mention` a sus clientes conectados

### Agregar reacción a un mensaje

```bash
curl -X POST http://localhost:3000/api/mensajes/msg123/reacciones \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "emoji": "👍",
    "esGrupo": true
  }'
```

### Remover reacción

```bash
curl -X DELETE http://localhost:3000/api/mensajes/msg123/reacciones \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "emoji": "👍",
    "esGrupo": true
  }'
```

### Obtener menciones pendientes

```bash
curl -X GET http://localhost:3000/api/mensajes/menciones/pendientes \
  -H "Authorization: Bearer <token>"
```

## 🎨 Emojis Soportados

Los siguientes emojis están permitidos para reacciones:

```typescript
const ALLOWED_EMOJIS = [
  '👍', // Pulgar arriba
  '❤️', // Corazón
  '😂', // Riendo
  '😮', // Sorpresa
  '😢', // Triste
  '🔥', // Fuego
  '🎉', // Celebración
  '✨', // Brillo
  '😍', // Amor
  '🤔', // Pensativo
  '👏', // Aplausos
  '🙏', // Manos juntas
  '😡', // Enojado
  '🤮', // Asco
  '😱', // Miedo
  '🎯', // Objetivo
  '💯', // Cien por ciento
  '👀', // Ojos
  '🚀', // Cohete
  '⭐', // Estrella
];
```

## 🔍 Parsing de Menciones

### Patrón Regex

Las menciones deben cumplir con:
- Comienzan con `@`
- Seguido de letras, números, guiones o guiones bajos
- Primer carácter después de `@` debe ser letra o guion bajo
- Máximo de caracteres: ilimitado (en la práctica, limitado por longitud de nombre)

**Ejemplos válidos:**
- `@juan`
- `@juan_perez`
- `@juan-123`
- `@María`

**Ejemplos inválidos:**
- `@` (sin nombre)
- `@123` (comienza con número)
- `@ juan` (espacio)

### Búsqueda de Usuarios

Cuando se detecta una mención `@username`:
1. Se busca el usuario por nombre completo o `nombre_apellido`
2. La búsqueda es case-insensitive
3. Se valida que el usuario sea miembro del grupo (para mensajes de grupo)
4. Se crea un registro de mención solo si existe el usuario

## 🔐 Validaciones

### Reacciones
- ✅ Solo usuarios autenticados
- ✅ Emoji debe estar en lista permitida
- ✅ ID de mensaje válido (MongoDB ObjectId)
- ✅ Un usuario solo puede tener una reacción del mismo emoji por mensaje

### Menciones
- ✅ Usuario mencionado debe existir
- ✅ Usuario mencionado debe ser miembro del grupo (en mensajes de grupo)
- ✅ Se detectan automáticamente al enviar el mensaje
- ✅ Las menciones duplicadas en el mismo mensaje se eliminan (solo se crea una por usuario)

## 📱 Compatibilidad

- ✅ Chat grupal
- ✅ Chat individual (directo)
- ✅ Clientes Web (Socket.IO)
- ✅ Clientes Mobile (Socket.IO)
- ✅ Bases de datos: MongoDB

## 🚀 Próximas Mejoras (Opcionales)

1. **Notificaciones Push**
   - Enviar push notifications en Mobile cuando se recibe una mención
   - Configuración de preferencias de notificación

2. **Búsqueda Avanzada de Usuarios**
   - Integración con un buscador de usuarios más sofisticado
   - Autocomplete al mencionar

3. **Reacciones Personalizadas**
   - Permitir que los usuarios agreguen emojis personalizados
   - Reacciones animadas

4. **Analytics**
   - Estadísticas de emojis más utilizados
   - Patrones de menciones

5. **Historial de Reacciones**
   - Ver quién reaccionó con cada emoji
   - Permitir filtrar mensajes por reacciones

## ✅ Checklist de Implementación

- [x] Schema Prisma actualizado
- [x] Contratos/interfaces creados
- [x] Parser de menciones implementado
- [x] Validador de emojis creado
- [x] Repository actualizado
- [x] Model actualizado
- [x] Use cases extendidos
- [x] Endpoints HTTP creados
- [x] ChatSubject mejorado
- [x] Observers actualizados
- [x] Gateway implementado
- [x] WebSocket events configurados
- [x] Documentación completada

## 🔧 Troubleshooting

### Las menciones no funcionan
1. Verificar que el nombre del usuario sea exacto (case-insensitive)
2. Verificar que el usuario sea miembro del grupo
3. Revisar los logs para ver si hay errores en el parsing

### Las reacciones no aparecen en tiempo real
1. Verificar que el cliente esté conectado al WebSocket
2. Verificar que el evento `grupo:reaccion:agregada` esté siendo escuchado
3. Revisar que el parámetro `esGrupo` sea correcto

### Errores al enviar mensajes
1. Verificar que el token de autenticación sea válido
2. Verificar que el usuario sea miembro del grupo
3. Revisar los logs del servidor para errores específicos

---

**Implementado por:** GitHub Copilot  
**Fecha:** Mayo 2024  
**Versión:** 1.0
