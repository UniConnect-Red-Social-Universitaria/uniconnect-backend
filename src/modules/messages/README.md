# Módulo de Mensajes — Chain of Responsibility

## Patrón Chain of Responsibility para validación de mensajes

Cada validación es un handler independiente. La cadena se construye en un único punto
(`ValidadorMensajeChainFactory`) y puede extenderse sin modificar los handlers existentes.

---

## Diagrama UML de clases

```mermaid
classDiagram
    class IValidadorMensajeHandler {
        <<interface>>
        +setSiguiente(handler) IValidadorMensajeHandler
        +manejar(mensaje) ResultadoValidacion
    }

    class ValidadorMensajeBase {
        <<abstract>>
        -siguiente: IValidadorMensajeHandler
        +setSiguiente(handler) IValidadorMensajeHandler
        +manejar(mensaje) ResultadoValidacion
        #validar(mensaje)* ResultadoValidacion
    }

    class ValidarTamanoHandler {
        #validar(mensaje) ResultadoValidacion
    }

    class ValidarContenidoHandler {
        #validar(mensaje) ResultadoValidacion
    }

    class ValidarMencionesHandler {
        #validar(mensaje) ResultadoValidacion
    }

    class ValidarPermisosHandler {
        -checker: PermisosChecker
        #validar(mensaje) ResultadoValidacion
    }

    class ValidarAdjuntoHandler {
        #validar(mensaje) ResultadoValidacion
    }

    class ValidadorMensajeChainFactory {
        +crearCadenaValidacion(checker) IValidadorMensajeHandler
    }

    IValidadorMensajeHandler <|.. ValidadorMensajeBase
    ValidadorMensajeBase <|-- ValidarTamanoHandler
    ValidadorMensajeBase <|-- ValidarContenidoHandler
    ValidadorMensajeBase <|-- ValidarMencionesHandler
    ValidadorMensajeBase <|-- ValidarPermisosHandler
    ValidadorMensajeBase <|-- ValidarAdjuntoHandler
    ValidadorMensajeChainFactory ..> ValidarTamanoHandler
    ValidadorMensajeChainFactory ..> ValidarContenidoHandler
    ValidadorMensajeChainFactory ..> ValidarMencionesHandler
    ValidadorMensajeChainFactory ..> ValidarPermisosHandler
    ValidadorMensajeChainFactory ..> ValidarAdjuntoHandler
```

---

## Diagrama de secuencia — Caso exitoso

Mensaje que pasa todas las validaciones y se persiste.

```mermaid
sequenceDiagram
    participant UC as MessageUseCases
    participant T as ValidarTamanoHandler
    participant C as ValidarContenidoHandler
    participant M as ValidarMencionesHandler
    participant P as ValidarPermisosHandler
    participant A as ValidarAdjuntoHandler
    participant DB as MessageRepository

    UC->>T: manejar(mensaje)
    T-->>T: validar → OK
    T->>C: manejar(mensaje)
    C-->>C: validar → OK
    C->>M: manejar(mensaje)
    M-->>M: validar → OK
    M->>P: manejar(mensaje)
    P-->>P: validar → OK
    P->>A: manejar(mensaje)
    A-->>A: validar → OK (sin adjunto)
    A-->>UC: { valido: true }
    UC->>DB: create / createGroupMessage
    DB-->>UC: mensaje guardado
```

---

## Diagrama de secuencia — Caso con cortocircuito

Mensaje con contenido prohibido: la cadena se detiene en `ValidarContenidoHandler`.

```mermaid
sequenceDiagram
    participant UC as MessageUseCases
    participant T as ValidarTamanoHandler
    participant C as ValidarContenidoHandler
    participant M as ValidarMencionesHandler

    UC->>T: manejar({ contenido: "spam link" })
    T-->>T: validar → OK (tamaño válido)
    T->>C: manejar(mensaje)
    C-->>C: validar → FALLA (contiene "spam")
    C-->>UC: { valido: false, error: "contenido no permitido: spam" }
    note over M: nunca se invoca
    UC-->>UC: throw ApplicationError(400, error)
```

---

## Extensibilidad — Agregar un nuevo handler

Para agregar `ValidarAdjuntoHandler` sin tocar los handlers existentes:

```typescript
// Solo modificar la factory
export function crearCadenaValidacion(checker: PermisosChecker) {
  const tamano    = new ValidarTamanoHandler();
  const contenido = new ValidarContenidoHandler();
  const menciones = new ValidarMencionesHandler();
  const permisos  = new ValidarPermisosHandler(checker);
  const adjunto   = new ValidarAdjuntoHandler(); // ← nuevo, sin tocar lo anterior

  tamano.setSiguiente(contenido).setSiguiente(menciones).setSiguiente(permisos).setSiguiente(adjunto);
  return tamano;
}
```

## Orden de la cadena

| # | Handler | Qué valida |
|---|---------|------------|
| 1 | `ValidarTamanoHandler` | No vacío, ≤ 1000 caracteres |
| 2 | `ValidarContenidoHandler` | Sin palabras prohibidas |
| 3 | `ValidarMencionesHandler` | Formato de `@menciones` |
| 4 | `ValidarPermisosHandler` | Membresía en grupo / relación aceptada |
| 5 | `ValidarAdjuntoHandler` | Tipo MIME y tamaño del adjunto |
