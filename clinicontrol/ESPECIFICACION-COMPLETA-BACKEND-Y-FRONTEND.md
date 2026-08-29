# ESPECIFICACIÓN COMPLETA — CliniControl
## Cada pantalla en dos capas: qué exige el backend y qué muestra el frontend

> ```
> cd C:\Users\Equipo\ccpr\clinicontrol
> opencode
> ```
> Pegar: `Lee ESPECIFICACION-COMPLETA-BACKEND-Y-FRONTEND.md. Implementá la pantalla 1 completa — primero el backend, después el frontend, después la prueba. Verificá y reportame. No avances a la siguiente sin mi aprobación.`

---

## LA REGLA QUE ORDENA TODO EL DOCUMENTO

> **El backend es la autoridad. El frontend solo refleja.**

Toda regla de negocio se implementa en el backend y **además** se refleja en la pantalla. Nunca solo en la pantalla.

Esconder un botón no es una restricción: es una sugerencia. Si la regla no está en el backend, no existe — y esa es la pregunta que un tribunal técnico hace casi siempre: *"¿está en el servidor o solo escondieron el botón?"*

**Orden obligatorio de implementación en cada pantalla:**

1. **Backend** — la validación, el guard, el código HTTP y el mensaje
2. **Prueba** — un test que falle si alguien rompe esa regla
3. **Frontend** — el control, el estado y el mensaje que viene del backend

---

## REGLAS TRANSVERSALES

### Backend — para todos los endpoints

| # | Regla |
|---|---|
| B1 | Todo endpoint lleva `@UseGuards(JwtAuthGuard, RolesGuard)` y su `@Roles(...)` explícito |
| B2 | Todo DTO valida con `class-validator`. Nada de `any` sin validar |
| B3 | Los códigos HTTP se usan bien: `400` dato inválido · `401` sin sesión · `403` sin permiso · `404` no existe · `409` conflicto con el estado actual |
| B4 | El mensaje de la excepción es el que va a leer el usuario. Se escribe en español, dice qué pasó y qué hacer |
| B5 | Las reglas clínicas viven en `domain/`, sin dependencias de NestJS. La capa `application/` traduce la excepción de dominio a HTTP |
| B6 | Toda operación que modifica datos clínicos queda en el log de auditoría con valor anterior y nuevo |
| B7 | Cada regla de negocio tiene su prueba unitaria |

### Frontend — para todas las pantallas

| # | Regla |
|---|---|
| F1 | Un botón deshabilitado **siempre** muestra al lado por qué lo está |
| F2 | Todo botón que dispara una petición muestra carga y se bloquea mientras dura |
| F3 | Toda acción irreversible pide confirmación con `ConfirmDialog` |
| F4 | Los mensajes de error vienen del backend vía `api/errMsg.ts`. **Nunca se inventan en la pantalla, nunca dicen solo "Error"** |
| F5 | Solo tokens del tema. Ningún color crudo de Tailwind |
| F6 | Ningún texto menor a 12 px. Datos clínicos, mínimo 14 px |
| F7 | Toda pantalla tiene sus cuatro estados: cargando, vacío, error, con datos |

**Verificación:** `npm run verificar` comprueba F1 a F7 mecánicamente.

---

# 1 · LOGIN

### Backend — `modules/auth/`

| Endpoint | Roles | Valida | Responde |
|---|---|---|---|
| `POST /auth/login` | público | Email con formato válido · contraseña presente | `200` con access token + refresh en cookie httpOnly · `401` *"Credenciales inválidas"* |
| `POST /auth/refresh` | cookie | Refresh token válido y no revocado | `200` nuevo access token · `401` si expiró |
| `POST /auth/logout` | autenticado | — | `200` e invalida el refresh |

- La contraseña se compara con **bcrypt, factor de costo 12**.
- El acceso fallido queda en auditoría con IP: `AuditAction.LOGIN`.
- **No debe existir** ningún endpoint `/auth/mfa/*`: fue retirado del alcance.
- El mensaje de error **nunca** distingue entre "email no existe" y "contraseña incorrecta". Decirlo permite averiguar qué correos están registrados.

**Prueba:** credenciales correctas devuelven token · contraseña incorrecta devuelve 401 · usuario desactivado devuelve 401.

### Frontend — `pages/LoginPage.tsx`

| Control | Qué hace | Valida antes | Si sale bien | Si sale mal |
|---|---|---|---|---|
| Campo **Correo electrónico** | Captura el email | Formato válido | — | *"Ingrese un email válido"* |
| Campo **Contraseña** | Captura la clave, oculta | Mínimo 6 caracteres | — | *"Mínimo 6 caracteres"* |
| **Ingresar al sistema** | `POST /auth/login` | Ambos campos válidos | Toast *"Bienvenido"* → `/dashboard` | *"Credenciales inválidas. Verifique su email y contraseña."* |
| **¿Olvidó su contraseña?** | Navega a `/forgot-password` | — | — | — |
| Casilla **Recordar sesión** | Extiende el refresh token | — | — | — |

**No debe haber** paso de verificación en dos etapas.

---

# 2 · PADRÓN DE PACIENTES

### Backend — `modules/paciente/`

| Endpoint | Roles | Valida | Responde |
|---|---|---|---|
| `GET /pacientes` | recepcionista, secretaria, medico, **enfermeria** | — | `200` lista paginada |
| `GET /pacientes/:id` | recepcionista, secretaria, medico, **enfermeria** | Existe | `200` · `404` *"Paciente no encontrado"* |
| `POST /pacientes` | recepcionista, secretaria | Nombre, apellido, CI y fecha de nacimiento · **CI única** | `201` · `409` con el mensaje de abajo |
| `PUT /pacientes/:id` | recepcionista, secretaria | Existe · si cambia la CI, sigue siendo única | `200` · `409` |
| `PATCH /pacientes/:id/estado` | recepcionista, secretaria | Existe | `200` |

**El administrador NO va en ninguno de estos `@Roles`.** No participa del acto asistencial.

**Enfermería SÍ va en los `GET`**, y no en `POST` ni `PUT`: necesita identificar al paciente para el triaje, pero no lo registra.

**La regla central (HU-02)** vive en `paciente/domain/services/paciente-domain.service.ts`:

> Antes de crear, se busca la CI. Si existe, se lanza `ConflictException` con el mensaje:
> *"Ya existe un paciente registrado con la cédula NNNNN. Búsquelo en el padrón."*
>
> El mensaje **incluye la CI** para que recepción sepa cuál buscar.

La entidad debe tener índice único en la columna de CI: la validación en código no alcanza si dos peticiones llegan a la vez.

**Prueba:** CI nueva crea · CI repetida lanza 409 · el mensaje contiene la CI · el índice único existe en la entidad.

### Frontend — `pages/PacientesPage.tsx`

| Control | Quién lo ve | Qué hace | Valida antes | Si sale bien | Si sale mal |
|---|---|---|---|---|---|
| **Nuevo paciente** | recepcionista, secretaria | Abre el modal | — | — | — |
| Campo **Cédula de identidad** | " | Captura la CI | Obligatorio · solo dígitos | — | Mensaje del backend con la CI |
| **Buscar** | todos los del padrón | Filtra reactivo | Mínimo 2 caracteres | Lista filtrada | Vacío: *"Ningún paciente coincide con la búsqueda"* |
| **Guardar paciente** | recepcionista, secretaria | `POST /pacientes` | Los cuatro campos | Toast *"Paciente registrado"* | Mensaje del backend |
| **Ver expediente** | medico, enfermeria | `/historia-clinica?paciente=ID` | — | — | — |
| **Editar** | recepcionista, secretaria | Abre el modal cargado | — | Toast *"Datos actualizados"* | Mensaje del backend |
| **Cambiar estado** | recepcionista, secretaria | Activa o desactiva | `ConfirmDialog` | Toast con el nuevo estado | Mensaje del backend |

**En la defensa:** intentar registrar una CI repetida y mostrar el rechazo. Es la HU-02.

---

# 3 · CITAS

### Backend — `modules/cita/`

| Endpoint | Roles | Valida | Responde |
|---|---|---|---|
| `GET /citas` | recepcionista, secretaria, medico | — | `200` |
| `POST /citas` | recepcionista, secretaria | Paciente y médico existen · **sin solapamiento** | `201` · `409` |
| `PUT /citas/:id` | recepcionista, secretaria | No completada ni cancelada · sin solapamiento | `200` · `409` |
| `PATCH /citas/:id/cancelar` | recepcionista, secretaria | Motivo obligatorio | `200` · `400` sin motivo |
| `POST /citas/:id/llegada` | recepcionista, secretaria | Cita de **hoy**, pendiente o confirmada, sin turno previo | `201` con el turno · `409` |

**Regla de solapamiento**, en `cita/domain/services/cita-domain.service.ts`:

> Dos citas del mismo médico no pueden cruzarse en el tiempo. Se compara inicio y fin contra las citas existentes de ese médico ese día.
>
> Mensaje: *"El Dr. X ya tiene una cita de 10:00 a 10:30. Elija otro horario."* — **con las horas reales del conflicto**, no genérico.

**Registrar llegada** es la operación que une cita con turno. Debe ser **transaccional**: crea el turno arrastrando paciente, médico, servicio y hora, y marca la cita como atendida. Si falla la creación del turno, la cita no cambia de estado.

**Prueba:** horario libre crea · horario cruzado lanza 409 · el mensaje trae las horas · llegada crea turno y marca la cita · llegada dos veces lanza 409 · si falla el turno, la cita queda intacta.

### Frontend — `pages/CitasPage.tsx`

| Control | Qué hace | Valida antes | Si sale bien | Si sale mal |
|---|---|---|---|---|
| **Nueva cita** | Abre el formulario | — | — | — |
| Selector **Paciente** | Búsqueda por CI o nombre | Obligatorio | — | *"Seleccione un paciente"* |
| Selector **Médico** | Médicos activos | Obligatorio | — | *"Seleccione un médico"* |
| Selector **Fecha y hora** | Del horario disponible | — | — | Mensaje del backend con las horas |
| **Agendar cita** | `POST /citas` | Los tres campos | Toast *"Cita agendada para el DD/MM a las HH:MM"* | Mensaje del backend |
| **Registrar llegada** | `POST /citas/:id/llegada` | Solo citas de hoy pendientes o confirmadas | Toast *"Turno #NNN emitido"* + ticket | *"Esta cita ya tiene un turno emitido"* |
| **Reprogramar** | Abre el formulario cargado | No completada ni cancelada | Toast *"Cita reprogramada"* | Mensaje del backend |
| **Cancelar cita** | Cambia a cancelada | `ConfirmDialog` + motivo | Toast *"Cita cancelada"* | Mensaje del backend |

**Columna de estado:** cada fila muestra si ya tiene turno emitido. Sin esa señal, recepción no sabe a quién le falta registrar la llegada.

---

# 4 · TURNOS

### Backend — `modules/turno/`

| Endpoint | Roles | Valida | Responde |
|---|---|---|---|
| `GET /turnos` | recepcionista, secretaria, medico | **`OwnershipGuard`**: el médico solo ve los suyos | `200` |
| `POST /turnos` | recepcionista, secretaria | Paciente y médico existen · servicio válido | `201` |
| `PATCH /turnos/:id/estado` | según el estado destino | Transición permitida · **cobro previo** | `200` · `409` |
| `PATCH /turnos/:id/pagar` | recepcionista, secretaria | No pagado aún | `200` |

**Numeración del turno.** En `turno-repository.adapter.ts`, el número siguiente se obtiene con una agregación:

```ts
const fila = await this.repo.createQueryBuilder('turno')
  .select('MAX(turno.numero)', 'max')
  .getRawOne<{ max: string | number | null }>();
return Number(fila?.max ?? 0);
```

**No usar `findOne({ order })` sin `where`.** TypeORM 0.3 lo rechaza con *"You must provide selection conditions in order to find a single row"* y la emisión de turno falla por completo.

**Prueba:** emitir turno asigna número consecutivo · con la tabla vacía empieza en 1 · dos emisiones seguidas no repiten número.

### Frontend — `pages/TurnosPage.tsx`

Asistente de tres pasos con indicador de progreso. **No se avanza sin completar el anterior.**

| Control | Paso | Qué hace | Valida antes | Si sale bien | Si sale mal |
|---|---|---|---|---|---|
| **Buscar paciente** | 1 | Búsqueda reactiva | Mínimo 2 caracteres | Muestra la ficha | *"No se encontró el paciente. Regístrelo primero."* |
| **Paciente nuevo** | 1 | Registro sin salir del asistente | — | Vuelve con el paciente cargado | — |
| **Siguiente** | 1 | Avanza | Paciente elegido | — | Bloqueado: *"Seleccione un paciente"* |
| Tarjeta de **servicio** | 2 | Servicio, precio y duración | Obligatorio | Marca la tarjeta | — |
| Tarjeta de **médico** | 2 | Elige profesional | Debe estar Disponible | Marca la tarjeta | Los ocupados no son seleccionables: *"En consulta"* |
| **Siguiente** | 2 | Avanza | Servicio y médico | — | *"Elija servicio y médico"* |
| **Emitir turno** | 3 | `POST /turnos` | Resumen con total | Toast *"Turno #NNN emitido"* + ticket | Mensaje del backend |
| **Imprimir ticket** | 3 | `window.print()` sobre `#print-area` | Turno emitido | Diálogo de impresión | — |
| **Atrás** | 2 y 3 | Vuelve conservando lo elegido | — | — | — |

El total se muestra siempre en el paso 3, con `font-variant-numeric: tabular-nums`.

---

# 5 · CAJA

### Backend — `modules/caja/`

| Endpoint | Roles | Valida | Responde |
|---|---|---|---|
| `POST /caja/apertura` | recepcionista, secretaria | Fondo inicial **> 0** · sin sesión abierta | `201` · `400` · `409` |
| `POST /caja/cobro` | recepcionista, secretaria | Caja abierta · turno impago · monto ≥ total | `201` y **marca el turno como pagado** · `409` |
| `POST /caja/cierre` | recepcionista, secretaria | Caja abierta · sin cobros pendientes | `200` con el arqueo · `409` |
| `GET /caja/arqueo` | admin, gerente | — | `200` **solo lectura** |

**El cobro es lo que libera al paciente hacia el médico.** Debe marcar el turno como pagado en la **misma transacción**: si el cobro se registra y el turno no se marca, el paciente paga y el médico no lo ve.

Gerencia va en `GET /caja/arqueo` y **en ningún endpoint de escritura**. Su rol es solo lectura.

**Prueba:** fondo cero lanza 400 · segunda apertura lanza 409 · el cobro marca el turno pagado · cierre con pendientes lanza 409 · gerente recibe 403 al intentar cobrar.

### Frontend — `pages/CajaPage.tsx`

**Caja cerrada**

| Control | Qué hace | Valida antes | Si sale bien | Si sale mal |
|---|---|---|---|---|
| Campo **Fondo inicial (Bs.)** | Monto de apertura | Número mayor que cero | — | *"El fondo inicial debe ser mayor a cero"* |
| **Abrir caja** | `POST /caja/apertura` | Fondo válido | Toast *"Caja abierta con Bs. NNN"* | *"Ya existe una sesión de caja abierta"* |

**Caja abierta** — dos columnas: izquierda paciente y desglose, derecha método de pago, monto recibido y vuelto.

| Control | Qué hace | Valida antes | Si sale bien | Si sale mal |
|---|---|---|---|---|
| Lista **turnos por cobrar** | Impagos con paciente, servicio y monto | — | — | Vacío: *"No hay cobros pendientes"* |
| Selector **método de pago** | Efectivo · Tarjeta · QR | Obligatorio | — | *"Seleccione el método de pago"* |
| Campo **Monto recibido** | Solo con Efectivo | ≥ al total | Calcula el **vuelto** | *"El monto recibido es menor al total"* |
| **Registrar cobro** | `POST /caja/cobro` | Método y monto | Toast *"Cobro registrado — Bs. NNN"* + recibo. **El paciente aparece en la cola del médico** | Mensaje del backend |
| **Imprimir recibo** | `window.print()` | Cobro registrado | Diálogo de impresión | — |
| **Cerrar caja** | `POST /caja/cierre` | `ConfirmDialog` con el resumen | Toast *"Caja cerrada"* + arqueo | *"Existen cobros pendientes de registrar"* |

Todos los montos con `tabular-nums`.

---

# 6 · TRIAJE ESI

### Backend — `modules/triage/`

| Endpoint | Roles | Valida | Responde |
|---|---|---|---|
| `GET /triaje` | medico, enfermeria | Ordenado por **ESI ascendente, luego hora de llegada** | `200` |
| `GET /triaje/paciente/:id/ultimo` | medico, enfermeria | — | `200` o `404` |
| `POST /triaje` | medico, enfermeria | Paciente · nivel E1–E5 · motivo · **signos en rango fisiológico** | `201` · `400` |
| `PATCH /triaje/:id/estado` | medico, enfermeria | Transición válida | `200` |

**El orden se define en el backend, no en la pantalla.** Si lo ordena el frontend, cada vista puede mostrar una prioridad distinta — y en urgencias eso es un problema clínico.

**Rangos fisiológicos:** el mensaje debe nombrar el valor y el campo. *"La frecuencia cardíaca 400 está fuera de rango. Verifique el valor."* — no *"dato inválido"*.

Un triaje **E1 o E2** deja el turno listo para atención médica sin pasar por caja.

**Prueba:** la lista sale ordenada por ESI y luego por hora · FC de 400 lanza 400 · el mensaje nombra el campo · E1 habilita atención sin pago.

### Frontend — `pages/TriajePage.tsx`

| Control | Qué hace | Valida antes | Si sale bien | Si sale mal |
|---|---|---|---|---|
| **Nuevo triaje** | Abre el formulario | — | — | — |
| Selector **Paciente** | Búsqueda por CI o nombre | Obligatorio | — | *"Seleccione un paciente"* |
| Selector **Nivel ESI** | E1 a E5 con descripción | Obligatorio | — | *"Clasifique la severidad"* |
| **Signos vitales** | 7 campos | Rangos plausibles | — | Mensaje del backend con el campo y el valor |
| **Registrar triaje** | `POST /triaje` | Paciente, nivel y motivo | Toast *"Triaje E<n> registrado"* | Mensaje del backend |
| Tarjeta en cola | Nivel, motivo, signos y **tiempo en vivo** | — | Se actualiza cada 30 s | — |
| **Iniciar atención** | Cambia el estado | Enfermería o el médico asignado | Toast *"En atención"* | Mensaje del backend |

El cronómetro usa `setInterval` con `clearInterval` en el retorno del efecto.

**Tiempos máximos, marcados al superarse:** E1 inmediato · E2 10 min · E3 30 min · E4 60 min · E5 120 min.

---

# 7 · TABLERO DE CONSULTAS

### Backend — `modules/turno/`

Esta pantalla no tiene endpoints propios: consume `GET /turnos` y `PATCH /turnos/:id/estado`. **Toda su lógica vive en el backend.**

**Regla de cobro previo**, en `turno/application/turno.service.ts`:

```
Al cambiar el estado a 'atencion':
  si el turno está pagado           → permitir
  si el triaje DE HOY es E1 o E2    → permitir (urgencia vital)
  en cualquier otro caso            → ConflictException
```

Mensaje: *"El turno #NNN no está pagado. Regla de cobro previo: el paciente debe pagar en caja antes de ser atendido."*

**Detalle que importa:** la excepción debe mirar **el triaje del turno actual o el de hoy**, no todo el historial del paciente. Con `findByPaciente()` sin filtro de fecha, un E1 de hace meses exime del pago para siempre.

**Comentario obligatorio en el código:**

```ts
// Excepcion de urgencia vital: un paciente clasificado E1 (Reanimacion) o E2
// (Emergencia) se atiende sin cobro previo. Condicionar la atencion de una
// urgencia vital al pago constituye una falta etica y legal. El cobro se
// regulariza despues de estabilizar al paciente.
```

**`OwnershipGuard`** en `GET /turnos`: el rol `medico` recibe solo los suyos, resueltos por `medico.usuarioId`. Los roles administrativos siguen viendo todo.

**Prueba:** pagado pasa · impago E3 lanza 409 · impago E1 pasa · impago E2 pasa · **E1 de hace un mes con turno impago de hoy lanza 409** · el médico A no recibe los turnos del médico B.

### Frontend — `pages/ConsultasPage.tsx`

| Control | Qué hace | Valida antes | Si sale bien | Si sale mal |
|---|---|---|---|---|
| Lista **En espera · Pagados** | Sus pacientes pagados, o E1/E2 sin pago | — | — | Vacío: *"No hay pacientes pagados asignados a usted en este momento"* |
| **Llamar paciente** | Turno a llamado, avisa a la sala | Pagado o E1/E2 | Toast *"Llamando al turno #NNN"* | Mensaje del backend |
| **Atender** | Cambia a `atencion` → `/consulta-completa` | Pagado o urgencia | Abre la consulta con el paciente | Mensaje del backend, tal cual |
| Etiqueta **Urgencia** | Marca en E1/E2 sin pago | — | *"Urgencia — atención sin cobro previo"* | — |
| **Buscar** | Filtra por nombre o CI | — | — | — |

Encabezado: *"Su cola de atención — Dr. X · solo pacientes con pago registrado"*.

---

# 8 · CONSULTA COMPLETA (SOAP)

### Backend — `modules/consulta/`

| Endpoint | Roles | Valida | Responde |
|---|---|---|---|
| `POST /consultas/completa` | medico | Motivo · **al menos un diagnóstico CIE-10** · paciente y médico existen | `201` · `400` |
| `PUT /consultas/:id` | medico | **Inmutabilidad** (ver abajo) | `200` · `409` · `403` |
| `GET /consultas/:id` | medico, enfermeria | `OwnershipGuard` | `200` · `403` |
| `POST /consultas/:id/nota` | medico | Consulta existe · contenido no vacío | `201` |

**Invariante de inmutabilidad del expediente** — `consulta/domain/services/inmutabilidad-expediente.service.ts`:

> El registro asistencial admite corrección directa **solo dentro de 24 horas** y **solo por el médico autor**. Los 7 campos SOAP están protegidos: motivo, síntomas, enfermedad actual, examen físico, evaluación, plan e indicaciones.
>
> Vencida la ventana → `ConflictException` (409). Otro médico → `ForbiddenException` (403).
>
> Toda enmienda admitida queda en auditoría con **valor anterior y nuevo**.

Sustento: **Ley N° 3131** del Ejercicio Profesional Médico y **R.M. N° 0090**, Norma Nacional para el Manejo del Expediente Clínico.

La excepción es de dominio puro, sin NestJS. La capa `application/` la traduce a HTTP. Ese es el ejemplo de arquitectura hexagonal que conviene desarrollar en el documento.

**Prueba:** enmienda del autor a las 2 h pasa · a las 30 h lanza 409 · exactamente a las 24 h lanza 409 · otro médico lanza 403 · un campo no asistencial se puede cambiar siempre · la auditoría guarda antes y después.

### Frontend — `pages/ConsultaCompletaPage.tsx`

**Arriba, fija:** `<BandaPaciente>` con CI, edad, sexo, grupo sanguíneo y **alergias en rojo**. `position: sticky`, nunca se oculta al hacer scroll.

| Control | Pestaña | Qué hace | Valida antes | Si sale bien | Si sale mal |
|---|---|---|---|---|---|
| **Motivo de consulta** | S | Texto libre | Obligatorio | — | *"El motivo de consulta es obligatorio"* |
| **Síntomas** · **Enfermedad actual** | S | Texto libre | — | — | — |
| **Signos vitales** | O | **Precargados del triaje**, editables | Rangos plausibles | *"Tomados en triaje a las HH:MM"* | Mensaje del backend |
| **Examen físico** | O | Texto libre | — | — | — |
| **Buscar CIE-10** | A | Autocompletado | Mínimo 3 caracteres | Agrega a la lista | *"No se encontró el código o descripción"* |
| **Quitar diagnóstico** | A | Elimina de la lista | — | — | — |
| **Plan** · **Indicaciones** | P | Texto libre | — | — | — |
| **Agregar receta** | P | Abre el prescriptor | Al menos un diagnóstico | Abre el modal | Bloqueado: *"Registre el diagnóstico antes de prescribir"* |
| **Guardar borrador** | Todas | Guarda sin cerrar | — | Toast *"Borrador guardado"* | Mensaje del backend |
| **Cerrar consulta** | Todas | `POST /consultas/completa` | Motivo + un diagnóstico | Toast *"Consulta registrada"* → tablero. **El turno pasa a finalizado** | Bloqueado: *"Falta registrar el diagnóstico"* |
| **Imprimir** | Todas | `window.print()` | Consulta guardada | Diálogo de impresión | — |

Ante un `409`: mostrar el mensaje del backend y ofrecer **"Registrar nota de enmienda"**, no un error seco.

---

# 9 · RECETAS

### Backend — `modules/receta/`

| Endpoint | Roles | Valida | Responde |
|---|---|---|---|
| `GET /recetas` | medico | Trae `items` con `medicamentoNombre` | `200` |
| `POST /recetas/verificar-seguridad` | medico | Al menos un medicamento | `200` con las **cuatro** categorías |
| `POST /recetas` | medico | Sin alertas críticas **o** con `justificacionClinica` de 20+ caracteres | `201` · `409` |
| `GET /medicamentos?q=` | medico | Mínimo 3 caracteres | `200` |

**Motor de seguridad farmacológica** — `receta/domain/services/seguridad-farmacologica.service.ts`:

> La verificación es por **grupo farmacológico y reactividad cruzada**, nunca por coincidencia de texto. Tres niveles: nombre directo → mismo grupo → reactividad cruzada con severidad degradada.
>
> `verificarSeguridadCompleta` devuelve cuatro categorías separadas: **alergias, duplicidad, interacciones, contraindicaciones**.

**Caso obligatorio:** alérgico a **penicilina** + **amoxicilina** ⇒ alerta. Es el ejemplo del documento de grado.

**Contrato de serialización — el bug del "N/A":** el backend envía el nombre del fármaco como texto plano en `medicamentoNombre`. El frontend debe leer ese campo, no `medicamento.nombre`. Si lee el objeto anidado, la tabla muestra "N/A" en todas las filas.

Toda receta emitida forzando una alerta queda en auditoría con la justificación escrita.

**Prueba:** penicilina + amoxicilina alerta · penicilina + cefalosporina alerta por reactividad cruzada · sin alergia no alerta · alerta crítica sin justificación lanza 409 · con justificación de 20+ guarda y audita.

### Frontend — `pages/RecetasPage.tsx`

| Control | Qué hace | Valida antes | Si sale bien | Si sale mal |
|---|---|---|---|---|
| **Nueva receta** | Abre el prescriptor con la banda arriba | — | — | — |
| **Buscar medicamento** | Autocompletado | Mínimo 3 caracteres | Agrega a la lista | *"Medicamento no encontrado en el catálogo"* |
| **Dosis · Frecuencia · Duración · Cantidad** | Por medicamento | Todos obligatorios | — | *"Complete dosis, frecuencia y duración de <fármaco>"* |
| **Quitar medicamento** | Elimina una línea | — | — | — |
| **Verificar seguridad** | `POST /recetas/verificar-seguridad` | Un medicamento | Muestra las **cuatro** categorías | Mensaje del backend |
| **Emitir receta** | `POST /recetas` | Sin alerta crítica o con justificación | Toast *"Receta emitida"* + receta imprimible | Abre el diálogo de confirmación |
| Campo **Justificación clínica** | Solo ante alerta crítica | **Mínimo 20 caracteres** | Habilita confirmar | Bloqueado: *"Escriba la justificación clínica (mínimo 20 caracteres)"* |
| **Imprimir receta** | `window.print()` | Receta emitida | Diálogo de impresión | — |
| Columna **Medicamentos** | Lee `medicamentoNombre` | — | Nombres reales | Sin ninguno: *"Sin medicamentos prescritos"* — **nunca "N/A"** |

**Pendiente de decidir:** `PharmaAlertCard.tsx` existe y no lo importa nadie; se usa `SafetyVerificationModal`. Verificar cuál muestra las cuatro categorías y dejar uno solo.

---

# 10 · HISTORIA CLÍNICA

### Backend

| Endpoint | Roles | Valida | Responde |
|---|---|---|---|
| `GET /consultas/historial/:pacienteId` | medico, enfermeria | Paciente existe | `200` cronológico |
| `GET /alergias/paciente/:id` | medico, enfermeria | — | `200` |
| `GET /recetas/paciente/:id` | medico, enfermeria | — | `200` con `items` |
| `GET /cirugias-previas/paciente/:id` | medico, enfermeria | — | `200` |

Cada endpoint devuelve **arreglo vacío**, nunca `null`. El frontend no debe tener que distinguir entre "no hay" y "no vino".

### Frontend — `pages/HistoriaClinicaPage.tsx`

| Control | Qué hace | Valida antes | Si sale bien | Si sale mal |
|---|---|---|---|---|
| **Buscar paciente** | Carga el expediente | Paciente elegido | Banda + pestañas | *"Seleccione un paciente"* |
| Pestaña **Consultas** | Historial cronológico | — | — | *"No hay consultas registradas"* |
| Pestaña **Alergias** | Con severidad | — | — | *"Sin alergias registradas"* — **nunca vacío** |
| Pestaña **Recetas** | Con sus fármacos | — | — | *"No hay recetas registradas"* |
| Pestaña **Cirugías previas** | Antecedentes | — | — | *"No se registraron cirugías previas"* |
| **Editar consulta** | Abre el editor | Autor y menos de 24 h | Abre el editor | Candado: *"Consulta consolidada — R.M. 0090"* |
| **Registrar nota de enmienda** | Nota sin tocar el original | Consulta consolidada | Toast *"Nota de enmienda registrada"* | Mensaje del backend |
| **Imprimir expediente** | `window.print()` | Paciente cargado | Diálogo de impresión | — |

---

# 11 · HOSPITALIZACIÓN

### Backend — `modules/hospitalizacion/`

| Endpoint | Roles | Valida | Responde |
|---|---|---|---|
| `GET /hospitalizacion/camas` | medico, enfermeria | — | `200` con estado por cama |
| `POST /hospitalizacion` | medico, enfermeria | Cama **libre** · paciente sin internación activa | `201` · `409` |
| `POST /hospitalizacion/:id/nota` | medico, enfermeria | Contenido no vacío | `201` |
| `PATCH /hospitalizacion/:id/alta` | medico | Internación activa · diagnóstico de egreso | `200` y **libera la cama** · `409` |

Tres invariantes: no internar en cama ocupada o en mantenimiento · no dar de alta desde cama vacía · un paciente no puede tener dos internaciones activas.

El alta debe liberar la cama en la **misma transacción**.

**Prueba:** internar en cama libre crea · en cama ocupada lanza 409 · en mantenimiento lanza 409 · alta libera la cama · alta de cama vacía lanza 409.

### Frontend — `pages/HospitalizacionPage.tsx`

Cuadrícula agrupada por sala.

| Control | Qué hace | Valida antes | Si sale bien | Si sale mal |
|---|---|---|---|---|
| Cama **libre** | Botón "Ingresar paciente" | Disponible | Abre el formulario | — |
| Cama **ocupada** | Paciente, médico, diagnóstico, días | — | Botones de nota y alta | — |
| Cama **en mantenimiento** | Gris, no seleccionable | — | — | *"Cama en mantenimiento"* |
| **Ingresar paciente** | `POST /hospitalizacion` | Paciente, médico, cama, motivo | Toast *"Paciente internado en <cama>"* | *"La cama <X> ya está ocupada"* |
| **Nota de evolución** | Agrega una nota | Texto no vacío | Toast *"Nota registrada"* | Mensaje del backend |
| **Alta médica** | Cierra y libera | `ConfirmDialog` + diagnóstico de egreso | Toast *"Alta registrada — cama <X> liberada"* | Mensaje del backend |

Indicadores arriba: totales, ocupadas, disponibles y porcentaje.

---

# 12 · ALERGIAS Y VACUNAS

### Backend — `modules/alergia/` y `modules/vacuna/`

| Endpoint | Roles | Valida | Responde |
|---|---|---|---|
| `GET /alergias` · `GET /vacunas` | medico, enfermeria | — | `200` catálogo |
| `POST /alergias` · `POST /vacunas` | medico, enfermeria | Nombre único | `201` · `409` |
| `GET /alergias/paciente/:id` | medico, enfermeria | — | `200` |
| `POST /alergias/paciente` | medico, enfermeria | Paciente + entrada + severidad · **sin duplicar** | `201` · `409` |
| `DELETE /alergias/paciente/:id` | medico | Existe | `200` |

Los catálogos se cargan desde `common/seeder.service.ts` o por importación CSV, **no escribiéndolos a mano uno por uno**.

La alergia del paciente alimenta el motor farmacológico: su `nombre` debe coincidir con los sinónimos del catálogo `grupos-farmacologicos.catalog.ts`, o la alerta no dispara.

**Prueba:** el seeder carga el catálogo base · nombre duplicado lanza 409 · asignar dos veces la misma alergia lanza 409 · una alergia a penicilina dispara alerta con amoxicilina.

### Frontend

| Control | Qué hace | Valida antes | Si sale bien | Si sale mal |
|---|---|---|---|---|
| **Nueva entrada** (catálogo) | Agrega al maestro | Nombre único | Toast *"Agregada al catálogo"* | *"Ya existe una entrada con ese nombre"* |
| **Buscar paciente** | Carga sus registros | — | Lista del paciente | *"Busque un paciente para gestionar sus registros"* |
| **Asignar al paciente** | Vincula con severidad | Paciente + entrada + severidad | Toast *"Registrada en el expediente"* | *"El paciente ya tiene registrada esa alergia"* |
| **Quitar del paciente** | Desvincula | `ConfirmDialog` | Toast *"Registro eliminado"* | Mensaje del backend |
| **Importar catálogo** | Carga CSV | Columnas esperadas | Toast *"N entradas importadas"* | *"La fila N tiene un formato inválido"* |

---

# 13 · ADMINISTRACIÓN

### Backend — `modules/usuario/`, `modules/medico/`, `modules/audit/`, `modules/arqueo/`

| Endpoint | Roles | Valida | Responde |
|---|---|---|---|
| `POST /usuarios` | **admin** | Email único · rol válido · contraseña 8+ | `201` · `409` |
| `PATCH /usuarios/:id/rol` | **admin** | Rol existe | `200` |
| `PATCH /usuarios/:id/estado` | **admin** | **No puede ser uno mismo** | `200` · `400` |
| `PATCH /medicos/:id/usuario` | **admin** | Médico y usuario existen | `200` |
| `GET /audit` | admin, gerente | — | `200` **solo lectura** |
| `GET /arqueo` | admin, gerente | — | `200` **solo lectura** |

**El log de auditoría no admite `PUT`, `PATCH` ni `DELETE`.** Si existe alguno, se elimina: un log editable no es un log.

La contraseña se guarda con **bcrypt costo 12**. Nunca en texto plano, nunca reversible.

**Vincular médico con usuario es obligatorio.** Sin `medico.usuarioId`, el tablero del médico no puede filtrar su cola y sale vacío.

**Prueba:** email duplicado lanza 409 · desactivarse a sí mismo lanza 400 · no existe endpoint de escritura sobre auditoría · gerente recibe 403 en `POST /usuarios`.

### Frontend

| Control | Qué hace | Valida antes | Si sale bien | Si sale mal |
|---|---|---|---|---|
| **Nuevo usuario** | `POST /usuarios` | Email, rol y contraseña | Toast *"Usuario creado"* | *"Ya existe un usuario con ese correo"* |
| **Asignar rol** | Cambia el rol | `ConfirmDialog` | Toast *"Rol actualizado"* | Mensaje del backend |
| **Desactivar usuario** | Bloquea el acceso | `ConfirmDialog` · no uno mismo | Toast *"Usuario desactivado"* | *"No puede desactivar su propia cuenta"* |
| **Vincular médico a usuario** | Establece `medico.usuarioId` | Ambos existen | Toast *"Médico vinculado"* | Mensaje del backend |

En la lista de médicos, **marcar visualmente los que no tienen usuario vinculado**.

**Auditoría** — filtros, detalle expandible con antes y después, exportar. Ninguna acción de edición.

---

# 14 · PANTALLAS DE SALA

### Backend

`GET /turnos/tv` — público o con token de kiosco. Devuelve solo lo que se muestra en pantalla: número, nombre de pila, consultorio y estado. **Nunca CI, diagnóstico ni datos clínicos**: es una pantalla que ve toda la sala de espera.

Orden: prioridad ESI, luego hora de llegada.

### Frontend — `TurnosSalaPage.tsx` y `TurnosTVPage.tsx`

Sin sesión iniciada, sin controles. Tipografía grande, legible a varios metros. Al llamarse un turno, señal visual destacada. Probar a 1920×1080.

---

# 15 · MI CUENTA

### Backend

| Endpoint | Roles | Valida | Responde |
|---|---|---|---|
| `GET /usuarios/perfil` | autenticado | — | `200` sin el hash de contraseña |
| `PATCH /usuarios/password` | autenticado | Contraseña actual correcta · nueva de 8+ | `200` · `401` · `400` |

El cambio de contraseña **invalida las demás sesiones activas**. Cambiar la clave y que la sesión anterior siga viva anula el propósito.

**No debe existir** ningún endpoint de MFA.

### Frontend

| Pantalla | Controles |
|---|---|
| `ProfilePage.tsx` | Datos personales y último acceso. **Nada de verificación en dos pasos** |
| `ChangePasswordPage.tsx` | Actual, nueva y confirmación. Nueva de 8+ y ambas iguales. Error: *"Las contraseñas no coinciden"* |

---

# FORMATO DE REPORTE POR PANTALLA

```
PANTALLA: <nombre>

BACKEND
  Endpoints revisados: N
  Roles correctos: [SI/NO] — <cuáles corregiste>
  Validaciones implementadas: <lista>
  Códigos HTTP correctos: [SI/NO]
  Mensajes en español y accionables: [SI/NO]
  Auditoría: [aplica / no aplica / implementada]

PRUEBAS
  Casos escritos: N
  Resultado: N de N pasan

FRONTEND
  Controles de la especificación: N
  Ya cumplían: <lista>
  Implementados: <lista>
  No implementados: <lista y por qué>
  Mensajes genéricos restantes: N
  Botones bloqueados sin explicación: N

VERIFICACIÓN
  tsc backend [OK/FALLA] · tsc frontend [OK/FALLA]
  npm test [N/N] · npm run verificar [N incumplimientos]

NO VERIFICADO: <lo que no se pudo probar y por qué>
```

---

# ORDEN DE IMPLEMENTACIÓN

| # | Pantalla | Por qué va ahí |
|---|---|---|
| 1 | **Consulta completa** (8) | La banda de alergias y la inmutabilidad del expediente |
| 2 | **Recetas** (9) | El motor farmacológico: el aporte central |
| 3 | **Tablero de consultas** (7) | La regla de cobro previo y el guard de propiedad |
| 4 | **Turnos** (4) y **Caja** (5) | Sostienen el flujo de admisión |
| 5 | **Triaje** (6) | Prioridad clínica y cronómetros |
| 6 | **Pacientes** (2) y **Citas** (3) | HU-02 y solapamiento |
| 7 | El resto | Presentación |

**Una pantalla por vez: backend, prueba, frontend, verificar.** No intente las quince de una sola vez.

---

# LO QUE NO SE NEGOCIA

1. **Ninguna regla vive solo en el frontend.** Si la pantalla lo impide pero la API lo permite, la regla no existe.
2. **Ningún mensaje dice solo "Error".** Cada uno explica qué pasó y qué hacer.
3. **Ninguna regla clínica sin prueba.** Un test que falle si alguien la rompe en el futuro.
4. **Nadie reescribe `theme.css` entero.** Solo líneas puntuales; si los tokens de color bajan de 195, algo se rompió.
5. **Lo que no se pudo verificar, se declara.** No se marca como hecho.
