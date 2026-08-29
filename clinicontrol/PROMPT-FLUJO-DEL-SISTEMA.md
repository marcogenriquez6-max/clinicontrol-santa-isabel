# PROMPT DEL FLUJO — El ciclo del paciente en CliniControl
## Para que el sistema deje de sentirse como módulos sueltos

> ```
> cd C:\Users\Equipo\ccpr\clinicontrol
> opencode
> ```
> **Use los prompts en orden: F1 → F2 → F3 → F4.** El F1 no modifica nada; es el que le dice dónde se rompe el flujo hoy.

---

## EL FLUJO QUE DEBERÍA TENER

Este es el recorrido de un paciente en la Clínica Santa Isabel. Cada flecha es un cambio de estado, y cada cambio lo ejecuta un rol distinto:

```
   RECEPCIÓN          ENFERMERÍA           CAJA            SALA           MÉDICO           CIERRE
       │                   │                 │               │               │                │
  ┌────▼────┐        ┌─────▼─────┐     ┌─────▼─────┐   ┌─────▼─────┐  ┌─────▼─────┐   ┌──────▼──────┐
  │  Cita   │───────▶│  Triaje   │────▶│   Cobro   │──▶│  Espera   │─▶│ Consulta  │──▶│   Receta    │
  │ o turno │        │    ESI    │     │           │   │  llamado  │  │   SOAP    │   │ o internado │
  └─────────┘        └───────────┘     └───────────┘   └───────────┘  └───────────┘   └─────────────┘
   EMITIDO             TRIADO             PAGADO          LLAMADO       EN_CONSULTA       FINALIZADO
```

**Las tres reglas que sostienen todo:**

1. **El paciente no salta pasos.** No puede llegar al médico sin haber pasado por caja.
2. **Excepción de urgencia:** un triaje **E1 o E2 salta el cobro** y va directo a espera médica. Es una urgencia vital.
3. **Cada rol solo mueve su propia flecha.** Recepción no cobra, caja no clasifica, el médico no emite turnos.

---

## PROMPT F1 — ¿Dónde se rompe el flujo hoy? *(solo lectura, empiece por aquí)*

```
Sin modificar ningún archivo, quiero entender cómo funciona hoy el flujo del
paciente en este sistema, de punta a punta.

Rastrea y repórtame:

1. ESTADOS REALES
   ¿Qué estados puede tener un turno? ¿Y una cita? ¿Y una consulta? Búscalos en
   las entidades y en los servicios, no los supongas. Dame la lista exacta con el
   archivo donde están definidos.

2. TRANSICIONES REALES
   ¿Qué parte del código cambia cada estado? Dame archivo y línea de cada
   transición: quién pasa un turno a 'atencion', quién lo marca pagado, quién lo
   cierra.

3. DÓNDE SE ROMPE
   - ¿Una cita agendada se convierte en turno, o son dos cosas desconectadas?
   - ¿El triaje modifica el estado del turno, o vive aparte?
   - ¿El cobro en caja libera al paciente hacia el médico, o el médico lo ve igual?
   - ¿La consulta se puede crear sin turno previo? Si es así, ese es el agujero
     más grande del flujo.

4. VALIDACIONES QUE FALTAN
   ¿Qué transiciones son posibles hoy que NO deberían serlo? Por ejemplo: atender
   sin pagar, dar de alta una cama vacía, cerrar una consulta sin diagnóstico.

FORMATO: una tabla de estados, una tabla de transiciones con archivo y línea, y
una lista de agujeros ordenada por gravedad. Sin adornos.
```

---

## PROMPT F2 — Conectar la cita con el turno

```
Hoy las citas y los turnos son dos cosas separadas: se agenda una cita y después
alguien emite un turno sin relación con ella. Eso rompe el flujo.

Conéctalos SIN reescribir los módulos:

1. Cuando un paciente con cita agendada llega a recepción, debe existir un botón
   "Registrar llegada" que convierta esa cita en turno activo, arrastrando
   paciente, médico, servicio y hora.
2. La cita queda marcada como atendida; el turno guarda la referencia a la cita
   que lo originó.
3. Si el paciente llega sin cita, se emite un turno directo como hasta ahora.

En la pantalla de Citas, muestra visualmente cuáles ya tienen turno emitido y
cuáles siguen esperando la llegada del paciente.

No cambies las entidades si no es imprescindible. Si hace falta un campo nuevo,
avísame antes: la base se crea con synchronize y prefiero saberlo.
```

---

## PROMPT F3 — La máquina de estados del turno *(el cambio de fondo)*

```
IMPORTANTE: este cambio toca el corazón del sistema. Hazlo de forma incremental y
verifica después de cada paso. Si algo se rompe, revierte y avísame.

Formaliza el ciclo de vida del turno como una máquina de estados explícita:

PASO 1 — Define el enum y las transiciones permitidas en la capa de dominio
del módulo de turnos (nada de framework, dominio puro):

  EMITIDO      -> TRIADO, PAGADO, CANCELADO
  TRIADO       -> PAGADO, EN_ESPERA (solo si ESI es E1 o E2), CANCELADO
  PAGADO       -> EN_ESPERA, CANCELADO
  EN_ESPERA    -> LLAMADO, CANCELADO
  LLAMADO      -> EN_CONSULTA, EN_ESPERA
  EN_CONSULTA  -> FINALIZADO
  FINALIZADO   -> (estado final, no admite transiciones)
  CANCELADO    -> (estado final)

PASO 2 — Mapea los estados que YA existen hoy contra estos. No inventes: lee el
código primero y dime cómo se corresponden antes de cambiar nada.

PASO 3 — Crea un servicio de dominio que valide cada transición y lance una
excepción de dominio cuando alguien intente una transición ilegal. Escribe pruebas
unitarias para las transiciones válidas y para al menos cuatro ilegales.

PASO 4 — Haz que el servicio de aplicación use esa validación en cada cambio de
estado, traduciendo la excepción de dominio a ConflictException.

La regla del E1/E2 que salta el cobro debe quedar documentada con un comentario
explicando que es una urgencia vital.

Sigue la arquitectura hexagonal que ya usa el proyecto: domain/ para la lógica
pura, application/ para los casos de uso. NO reorganices carpetas.
```

---

## PROMPT F4 — Que el flujo se vea en pantalla

```
El flujo existe en el código pero el usuario no lo ve. Hazlo visible:

1. En la ficha de cada paciente en la cola, muestra una línea de progreso con los
   pasos: Turno → Triaje → Cobro → Espera → Consulta. El paso actual destacado,
   los cumplidos en gris, los pendientes apagados.

2. Cuando una acción esté bloqueada, di POR QUÉ. En vez de un botón deshabilitado
   y mudo, un texto: "Pendiente de cobro en caja". El usuario tiene que entender
   qué falta, no adivinarlo.

3. En el tablero del médico, si la cola está vacía, explica la razón: "No hay
   pacientes pagados asignados a usted en este momento".

Usa los tokens del tema (var(--text-secondary), var(--btn-primary), etc.), nunca
colores crudos de Tailwind. Que sea sobrio: en un sistema clínico el color fuerte
se reserva para las alertas médicas.
```

---

## ORDEN Y RIESGO

| Prompt | Qué hace | Riesgo |
|---|---|---|
| **F1** | Diagnóstico, no toca nada | Ninguno |
| **F2** | Conecta cita con turno | Bajo |
| **F4** | Hace visible el flujo | Bajo, solo interfaz |
| **F3** | Máquina de estados | **Alto** — toca el corazón del sistema |

**Consejo:** haga **F1, F2 y F4**. Deje el **F3** para el final, y solo si le sobra tiempo.

El F3 es el más elegante de los cuatro y el que peor puede terminar. Formalizar una máquina de estados sobre un sistema que ya funciona, a días de una defensa, es exactamente el tipo de cambio que rompe cosas que hoy andan bien.

Si no alcanza a hacerlo, no pasa nada: en la defensa se dice que el ciclo de vida del turno está implementado mediante estados y validaciones en la capa de servicio, y que su formalización como máquina de estados explícita es la siguiente iteración. Eso es cierto y se defiende sin problema.
