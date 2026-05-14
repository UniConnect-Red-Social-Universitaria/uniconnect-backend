// OBSERVER_QUICK_REFERENCE.md
# 🔍 Patrón Observer - Guía Rápida

## Descripción

El patrón Observer implementa un mecanismo de suscripción-notificación donde un Subject (observable) mantiene una lista de observadores y los notifica cuando ocurren eventos.

**Componentes principales**:
- **Subject**: Mantiene observadores y los notifica
- **Observer**: Recibe notificaciones del Subject
- **Evento**: Los datos que se comunican

---

## 📦 Subjects Disponibles

### 1. EventoPublicador (Eventos por categoría)

**Ubicación**: `src/shared/eventos-observer/EventoPublicador.ts`

**Uso**: Notificar eventos académicos, deportivos, culturales, etc.

```typescript
import { EventoPublicador } from '../src/shared/eventos-observer/EventoPublicador';
import { IEventoObserver } from '../src/shared/eventos-observer/IEventoObserver';

// Crear observer
const miObserver: IEventoObserver = {
  getUsuarioId: () => 'usuario-001',
  onNuevoEvento: (evento) => {
    console.log('Evento recibido:', evento.titulo);
  }
};

// Usar Subject (Singleton)
const publicador = EventoPublicador.getInstance();

// Suscribir a una categoría
publicador.suscribir('academico', miObserver);

// Cuando ocurre un evento
publicador.notificar('academico', {
  id: 'evt-001',
  titulo: 'Seminario de IA',
  categoria: 'academico',
  // ...
});

// Desuscribir
publicador.desuscribir('academico', miObserver);
```

**Categorías soportadas**: 'academico' | 'cultural' | 'deportivo' | 'otro'

---

### 2. ChatSubject (Mensajes en grupos)

**Ubicación**: `src/modules/messages/domain/chat-subject.ts`

**Uso**: Notificar nuevos mensajes en grupos de chat

```typescript
import { ChatSubject } from '../src/modules/messages/domain/chat-subject';
import { WebChatObserver } from '../src/modules/messages/infrastructure/web-chat-observer';

const chatSubject = ChatSubject.getInstance();

// Crear observer para un grupo
const observer = new WebChatObserver(socket, 'grupo-001');

// Suscribir
chatSubject.suscribir('grupo-001', observer);

// Emitir mensaje
chatSubject.emitirNuevoMensaje('grupo-001', {
  id: 'msg-001',
  contenido: '¡Hola!',
  grupoId: 'grupo-001',
  emisorId: 'user-001',
  // ...
});

// Desuscribir
chatSubject.desuscribir('grupo-001', observer);
```

**Observers concretos**:
- `WebChatObserver`: Para clientes Web
- `MobileChatObserver`: Para clientes Mobile

---

### 3. GrupoEstudioSubject (Eventos de grupo)

**Ubicación**: `src/modules/groups/domain/grupo-estudio-subject.ts`

**Uso**: Notificar eventos en el ciclo de vida de grupos de estudio

```typescript
import { GrupoEstudioSubject } from '../src/modules/groups/domain/grupo-estudio-subject';
import { IGrupoEstudioObserver } from '../src/modules/groups/domain/contracts-grupo-estudio';

const grupoSubject = GrupoEstudioSubject.getInstance();

// Crear observer
const observer: IGrupoEstudioObserver = {
  onEventoGrupo: (evento) => {
    console.log(`Evento: ${evento.tipo} en ${evento.nombre}`);
  }
};

// Suscribir
grupoSubject.suscribir('grupo-001', observer);

// Emitir eventos del ciclo de vida
grupoSubject.emitirEvento('grupo-001', {
  tipo: 'creado',           // 'creado' | 'modificado' | 'miembro-agregado' | 'miembro-removido' | 'finalizado'
  grupoId: 'grupo-001',
  nombre: 'Matemáticas Avanzada',
  descripcion: 'Grupo de estudio',
  miembrosActuales: 5,
  timestamp: new Date()
});

// Desuscribir
grupoSubject.desuscribir('grupo-001', observer);
```

**Tipos de eventos**:
- `creado`: Grupo creado
- `modificado`: Información del grupo modificada
- `miembro-agregado`: Nuevo miembro
- `miembro-removido`: Miembro removido
- `finalizado`: Grupo finalizado

---

## 🧪 Testing - Factories de Mocks

### Crear Observer Mock

```typescript
import { jest } from '@jest/globals';

// Para EventoPublicador
function crearObserverMock(usuarioId = 'user-001') {
  const mockFn = jest.fn();
  return {
    usuarioId,
    onNuevoEvento: (evento) => mockFn(evento),
    getUsuarioId: () => usuarioId,
    getCallCount: () => mockFn.mock.calls.length,
    getLastEvent: () => mockFn.mock.calls[mockFn.mock.calls.length - 1]?.[0],
  };
}

// Para ChatSubject
function crearChatObserverMock(id = 'obs-001') {
  const mockFn = jest.fn();
  return {
    id,
    onNuevoMensajeGrupo: (msg) => mockFn(msg),
    getCallCount: () => mockFn.mock.calls.length,
    getLastMessage: () => mockFn.mock.calls[mockFn.mock.calls.length - 1]?.[0],
  };
}

// Para GrupoEstudioSubject
function crearObservadorGrupoMock(id = 'obs-001') {
  const mockFn = jest.fn();
  return {
    id,
    onEventoGrupo: (evento) => mockFn(evento),
    getCallCount: () => mockFn.mock.calls.length,
    getLastEvent: () => mockFn.mock.calls[mockFn.mock.calls.length - 1]?.[0],
  };
}

// Uso en tests
it('debería notificar al observer', () => {
  const obs = crearObserverMock();
  const publicador = EventoPublicador.getInstance();

  publicador.suscribir('academico', obs);
  publicador.notificar('academico', eventoMock);

  expect(obs.getCallCount()).toBe(1);
  expect(obs.getLastEvent()?.titulo).toBe('Seminario de IA');
});
```

---

## 🏗️ Crear un Subject Personalizado

```typescript
import { IMyObserver } from './my-observer.interface';

export class MySubject {
  private static instance: MySubject;
  private suscriptores = new Map<string, Set<IMyObserver>>();

  private constructor() {}

  static getInstance(): MySubject {
    if (!MySubject.instance) {
      MySubject.instance = new MySubject();
    }
    return MySubject.instance;
  }

  suscribir(key: string, observer: IMyObserver): void {
    if (!this.suscriptores.has(key)) {
      this.suscriptores.set(key, new Set());
    }
    this.suscriptores.get(key)!.add(observer);
  }

  desuscribir(key: string, observer: IMyObserver): void {
    const obs = this.suscriptores.get(key);
    if (obs) {
      obs.delete(observer);
      if (obs.size === 0) {
        this.suscriptores.delete(key);
      }
    }
  }

  emitir(key: string, evento: any): void {
    const obs = this.suscriptores.get(key);
    if (!obs) {
      console.warn(`No hay observadores para ${key}`);
      return;
    }

    obs.forEach((observer) => {
      try {
        observer.onEvento(evento);
      } catch (error) {
        console.error('Error en observer:', error);
      }
    });
  }

  limpiar(): void {
    this.suscriptores.clear();
  }
}
```

---

## ✅ Checklist para implementar Observer

- [ ] Crear Subject (heredar patrón de EventoPublicador)
- [ ] Crear interfaz Observer (onEvento, getIdentificador, etc.)
- [ ] Implementar Singleton pattern
- [ ] Manejar errores con try-catch
- [ ] Permitir suscripción por clave (categoría, grupo, etc.)
- [ ] Permitir desuscripción
- [ ] Limpiar entradas vacías
- [ ] Crear tests unitarios con mocks
- [ ] Crear tests de integración
- [ ] Documentar el Subject
- [ ] Agregar métodos auxiliares (contarSuscriptores, listar, etc.)

---

## 📊 Comparativa de Subjects

| Aspecto | EventoPublicador | ChatSubject | GrupoEstudioSubject |
|--------|---|---|---|
| **Suscripción** | Por categoría | Por grupoId | Por grupoId |
| **Evento** | EventRecord | GroupMessageRecord | GrupoEstudioEvent |
| **Ciclo de vida** | Permanente | Temporal (sesión) | Permanente |
| **Observadores** | Muchos por categoría | Pocos por grupo | Moderados por grupo |
| **Uso principal** | Notificaciones de eventos | Tiempo real en chat | Notificaciones de cambios |

---

## 🐛 Debugging

### Contar suscriptores

```typescript
// EventoPublicador
const count = publicador.contarSuscriptores('academico');

// ChatSubject
const count = chatSubject.contarSuscriptores('grupo-001');

// GrupoEstudioSubject
const count = grupoSubject.contarSuscriptores('grupo-001');
```

### Listar categorías suscritas

```typescript
const categorias = publicador.listarCategoriasSuscritas('usuario-001');
```

### Verificar grupos activos

```typescript
const gruposActivos = chatSubject.contarGruposActivos();
```

---

## 🚀 Mejores Prácticas

1. **Singleton**: Siempre usar `getInstance()` para obtener el Subject
2. **Limpieza**: Desuscribir cuando sea apropiado para evitar memory leaks
3. **Errores**: Los errores en un observer no deben afectar a otros
4. **Logging**: Registrar suscripciones/desuscripciones en desarrollo
5. **Typing**: Usar interfaces para garantizar compatibilidad
6. **Testing**: Siempre crear tests con mocks

---

## 📚 Más Información

- Pruebas unitarias: `tests/observer-unitario.test.ts`
- Integración ChatSubject: `tests/chat-subject-integracion.test.ts`
- Integración GrupoEstudio: `tests/grupo-estudio-integracion.test.ts`
- Auditoría completa: `auditoria_observer.md`
