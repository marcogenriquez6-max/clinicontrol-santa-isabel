# ESPECIFICACIÓN DETALLADA DE COMPORTAMIENTO — CliniControl
## Cada regla, con su implementación exacta en backend y en frontend

> ```
> cd C:\Users\Equipo\ccpr\clinicontrol
> opencode
> ```
> Pegar: `Lee ESPECIFICACION-DETALLADA.md. Implementa el Bloque 1 completo (backend y frontend), verifica y repórtame regla por regla. No avances al Bloque 2 sin mi aprobación.`

---

## INSTRUCCIÓN AL DESARROLLADOR

Estas no son sugerencias. Son las reglas de negocio del sistema, con la ruta exacta de cada archivo que debes tocar.

**Protocolo obligatorio por regla:**

1. Lee el archivo completo antes de modificarlo.
2. Verifica si la regla ya se cumple. Si sí, dilo y sigue.
3. Impleméntala primero en **backend**, después en **frontend**. Nunca al revés: el backend es la autoridad; la interfaz solo refleja lo que él permite.
4. Escribe la prueba unitaria indicada.
5. Verifica: `cd backend && npx tsc -p tsconfig.json --noEmit && npm test`
6. Reporta antes de pasar a la siguiente.

**Advertencias técnicas de este proyecto:**

- Los archivos son **CRLF**. Normaliza `\r\n` → `\n` antes de comparar texto y restaura al escribir, o tus reemplazos fallarán en silencio.
- El `npm` de esta máquina ha dado **error 403**. Si necesitas una librería nueva, **PARA y avisa**.
- La base de datos se crea con TypeORM `synchronize` desde las entidades. Si agregas un campo a una entidad, avísame antes.
- **No reorganices carpetas.** La arquitectura hexagonal ya existe: `domain/` · `application/` · `infrastructure/`.

---

# BLOQUE 1 — SEGURIDAD DEL PACIENTE

## R1 · Las alergias deben estar visibles mientras se atiende

**Backend**

| Archivo | Qué hacer |
|---|---|
| `backend/src/modules/alergia/application/alergia.service.ts` | Verificar que exista un método que devuelva las alergias de un paciente por su ID, con nombre de la alergia, severidad y tipo. Si devuelve la entidad cruda, agregar un método de lectura que entregue exactamente lo que la banda necesita. |
| `backend/src/modules/alergia/infrastructure/controllers/alergia.controller.ts` | Exponer `GET /alergias/paciente/:id`. Proteger con `JwtAuthGuard`. |
| `backend/src/modules/paciente/application/paciente.service.ts` | El método que devuelve un paciente por ID debe incluir grupo sanguíneo y fecha de nacimiento; la edad se calcula, no se almacena. |

**Frontend**

| Archivo | Qué hacer |
|---|---|
| `frontend/src/components/clinico/BandaPaciente.tsx` | **Crear.** Franja fija superior con: nombre completo, CI, edad calculada, sexo, grupo sanguíneo y alergias. Props: `pacienteId`. Carga sus propios datos. |
| `frontend/src/api/alergia.service.ts` | Agregar `getByPaciente(pacienteId: number)`. |
| `frontend/src/pages/ConsultaCompletaPage.tsx` | Montar `<BandaPaciente>` arriba del formulario SOAP, con `position: sticky; top: 0; z-index: 20`. Debe seguir visible al hacer scroll. |
| `frontend/src/pages/RecetasPage.tsx` | Montarla dentro del modal de nueva receta, arriba del selector de medicamentos. |
| `frontend/src/pages/HistoriaClinicaPage.tsx` | Montarla arriba de las pestañas del expediente. |

**Diseño:** usar solo tokens (`var(--danger-500)`, `var(--danger-50)`, `var(--text-primary)`, `var(--border-primary)`). Fondo de la banda en `var(--bg-card)` con borde izquierdo de 3 px en `var(--danger-500)` **solo si hay alergias**. Sin alergias, borde neutro.

**Prueba:** `frontend/src/components/clinico/__tests__/BandaPaciente.test.tsx` — renderiza con alergias, renderiza sin alergias mostrando el texto explícito, y renderiza mientras carga.

---

## R2 · Prescribir un medicamento al que el paciente es alérgico exige justificación escrita

**Backend**

| Archivo | Qué hacer |
|---|---|
| `backend/src/modules/receta/application/receta.service.ts` | En el método de creación de receta, antes de guardar, llamar a `verificarSeguridadCompleta`. Si hay una alerta de severidad crítica y el DTO **no** trae `justificacionClinica`, lanzar `ConflictException` con el detalle de la alerta. |
| `backend/src/modules/receta/infrastructure/dto/` | Agregar al DTO de creación el campo opcional `justificacionClinica?: string` con `@MinLength(20)` cuando esté presente. Veinte caracteres obliga a escribir una razón, no una letra. |
| `backend/src/common/services/audit.service.ts` | Registrar toda prescripción con alerta forzada: `action: UPDATE`, `entityType: 'RecetaMedica'`, `reason` con la justificación escrita por el médico. |

**Frontend**

| Archivo | Qué hacer |
|---|---|
| `frontend/src/components/ui/PharmaAlertCard.tsx` | Ya existe. Verificar que muestre las cuatro categorías: alergias, duplicidad, interacciones y contraindicaciones. |
| `frontend/src/pages/RecetasPage.tsx` | Al detectar alerta crítica, abrir un `ConfirmDialog` que **no** se pueda aceptar sin escribir la justificación. El botón de confirmar permanece deshabilitado hasta que el texto tenga 20 caracteres. |
| `frontend/src/api/receta.service.ts` | Enviar `justificacionClinica` en el cuerpo de la petición. |

**Prueba:** `backend/src/modules/receta/__tests__/` — receta sin alerta se guarda; receta con alerta crítica y sin justificación lanza 409; receta con alerta crítica y justificación válida se guarda y queda auditada.

---

## R3 · La verificación es por grupo farmacológico, nunca por texto

**Backend**

| Archivo | Qué hacer |
|---|---|
| `backend/src/modules/receta/domain/catalogs/grupos-farmacologicos.catalog.ts` | Ya existe con 11 familias. **Verificar que esté completo** y ampliarlo si faltan familias de uso frecuente en Bolivia. |
| `backend/src/modules/receta/domain/services/seguridad-farmacologica.service.ts` | Ya implementa tres niveles: nombre directo, mismo grupo, reactividad cruzada con severidad degradada. **No lo reescribas.** Verifica que `verificarSeguridadCompleta` incluya duplicidad terapéutica. |
| `backend/src/modules/receta/application/receta.service.ts` | Confirmar que `verificarSeguridad` devuelve las cuatro categorías separadas que espera el modal. |

**Caso de prueba obligatorio:** paciente alérgico a **penicilina** + prescripción de **amoxicilina** ⇒ debe disparar alerta. Es el ejemplo del documento de grado y el que se demuestra en la defensa.

**Prueba:** `backend/src/modules/receta/__tests__/seguridad-farmacologica.service.spec.ts` — ya existe con 9 casos. Agregar el caso de cefalosporina en paciente alérgico a penicilina (reactividad cruzada).

---

## R4 · Sin alergias registradas se dice explícitamente

**Frontend únicamente**

| Archivo | Qué hacer |
|---|---|
| `frontend/src/components/clinico/BandaPaciente.tsx` | Si el arreglo de alergias viene vacío, renderizar el texto *"Sin alergias registradas"* en `var(--text-tertiary)`. **Nunca** dejar el contenedor vacío. |
| `frontend/src/pages/HistoriaClinicaPage.tsx` | Misma regla en la sección de alergias del expediente. |

**Por qué importa:** un espacio en blanco se lee al mismo tiempo como *"no tiene alergias"* y como *"nadie revisó"*. En un sistema clínico esa ambigüedad puede matar a alguien.

---

## R5 · Los signos vitales del triaje se ven en la consulta

**Backend**

| Archivo | Qué hacer |
|---|---|
| `backend/src/modules/triage/application/triage.service.ts` | Agregar un método que devuelva el triaje más reciente de un paciente: nivel ESI, signos vitales y fecha de toma. |
| `backend/src/modules/triage/infrastructure/controllers/triage.controller.ts` | Exponer `GET /triaje/paciente/:id/ultimo`. |

**Frontend**

| Archivo | Qué hacer |
|---|---|
| `frontend/src/api/triage.service.ts` | Agregar `getUltimoPorPaciente(pacienteId)`. |
| `frontend/src/pages/ConsultaCompletaPage.tsx` | En la pestaña **Objetivo** del SOAP, precargar los signos vitales del triaje como valores iniciales editables, con una nota: *"Tomados en triaje a las HH:MM"*. El médico puede corregirlos, pero no debe volver a tomarlos. |

---

# BLOQUE 2 — EL PACIENTE NO SALTA PASOS

## R6 · Sin pago no hay atención — validado en el backend

**Backend**

| Archivo | Qué hacer |
|---|---|
| `backend/src/modules/turno/application/turno.service.ts` | En el método que cambia el estado a `atencion`: cargar el turno, verificar `pagado === true`. Si no lo está, lanzar `ConflictException('El paciente no registra pago en caja. Regístrelo antes de iniciar la atención.')`. |
| `backend/src/modules/turno/infrastructure/controllers/turno.controller.ts` | No cambia la firma; la validación vive en el servicio. |

**Frontend**

| Archivo | Qué hacer |
|---|---|
| `frontend/src/pages/ConsultasPage.tsx` | Ya filtra por `t.pagado`. Mantenerlo: es la primera barrera, aunque no la única. |
| `frontend/src/api/errMsg.ts` | Verificar que traduzca el 409 al mensaje del backend, no a un *"Error"* genérico. |

---

## R7 · Excepción obligatoria: E1 y E2 se atienden sin pago

**Backend**

| Archivo | Qué hacer |
|---|---|
| `backend/src/modules/turno/application/turno.service.ts` | Antes de rechazar por falta de pago, consultar el triaje del turno. Si el nivel es **E1** o **E2**, permitir la atención y registrar en auditoría: `reason: 'Atención sin cobro previo por urgencia vital (ESI E1/E2)'`. |

**Comentario obligatorio en el código:**

```ts
// Excepcion de urgencia vital: un paciente clasificado E1 (Reanimacion) o E2
// (Emergencia) se atiende sin cobro previo. Condicionar la atencion de una
// urgencia vital al pago constituye una falta etica y legal. El cobro se
// regulariza despues de estabilizar al paciente.
```

**Frontend**

| Archivo | Qué hacer |
|---|---|
| `frontend/src/pages/ConsultasPage.tsx` | El filtro debe ser `t.pagado || t.nivelEsi === 'E1' || t.nivelEsi === 'E2'`. Los turnos de urgencia se muestran con `EsiBadge` y la leyenda *"Urgencia — atención sin cobro previo"*. |
| `frontend/src/components/ui/EsiBadge.tsx` | Ya existe. Verificar que E1 y E2 se distingan claramente. |

**Prueba:** turno pagado pasa · turno impago rechaza · turno impago E1 pasa · turno impago E2 pasa · turno impago E3 rechaza.

---

## R8 · El médico solo ve su propia cola

**Backend**

| Archivo | Qué hacer |
|---|---|
| `backend/src/common/guards/ownership.guard.ts` | Ya existe y está aplicado en consultas. Extenderlo para el recurso `turno`. |
| `backend/src/modules/turno/infrastructure/controllers/turno.controller.ts` | Aplicar `@Ownership('turno')` y `@UseGuards(OwnershipGuard)` en el `GET`. Los roles `admin`, `gerente`, `recepcionista` y `secretaria` siguen viendo todo; la restricción aplica solo a `medico`. |
| `backend/src/modules/turno/application/turno.service.ts` | Resolver el médico del usuario autenticado por `medico.usuarioId` y filtrar. |

**Frontend**

| Archivo | Qué hacer |
|---|---|
| `frontend/src/pages/ConsultasPage.tsx` | Ya resuelve `medico.usuarioId` contra el usuario de sesión. Mantenerlo. |

---

## R9 · Todo bloqueo explica su razón

**Frontend**

| Archivo | Qué hacer |
|---|---|
| `frontend/src/pages/ConsultasPage.tsx` · `TurnosPage.tsx` · `CajaPage.tsx` · `HospitalizacionPage.tsx` | Ningún botón deshabilitado sin explicación. Junto a cada control bloqueado, un texto en `var(--text-tertiary)` que diga qué falta: *"Pendiente de cobro en caja"*, *"Cama en mantenimiento"*, *"Caja cerrada — abra la sesión del día"*. |
| `frontend/src/components/ui/Button.tsx` | Considerar una prop `disabledReason?: string` que renderice ese texto de forma consistente en todo el sistema. |

---

## R10 · La cita se convierte en turno con una sola acción

**Backend**

| Archivo | Qué hacer |
|---|---|
| `backend/src/modules/cita/application/cita.service.ts` | Método `registrarLlegada(citaId)`: crea el turno arrastrando paciente, médico, servicio y hora; marca la cita como atendida; devuelve el turno creado. Transaccional: si falla la creación del turno, la cita no cambia de estado. |
| `backend/src/entities/turno.entity.ts` | Verificar si existe `citaId`. Si no existe, **avisar antes de agregarlo**. |
| `backend/src/modules/cita/infrastructure/controllers/cita.controller.ts` | Exponer `POST /citas/:id/llegada`. Roles: `recepcionista`, `secretaria`, `admin`. |

**Frontend**

| Archivo | Qué hacer |
|---|---|
| `frontend/src/pages/CitasPage.tsx` | Columna de acciones con botón **"Registrar llegada"**, visible solo en citas del día en estado pendiente o confirmada. Al pulsarlo, emite el turno y muestra el número de ficha. |
| `frontend/src/api/cita.service.ts` | Agregar `registrarLlegada(citaId)`. |

---

# BLOQUE 3 — EL EXPEDIENTE ES UN DOCUMENTO MÉDICO-LEGAL

## R11 · La nota clínica es inmutable fuera de la ventana de enmienda

**Backend — ya implementado, solo verificar**

| Archivo | Estado |
|---|---|
| `backend/src/modules/consulta/domain/services/inmutabilidad-expediente.service.ts` | Ventana de 24 h, 7 campos SOAP protegidos. |
| `backend/src/modules/consulta/domain/exceptions/expediente-inmutable.exception.ts` | `ExpedienteInmutableException` y `EnmiendaNoAutorizadaException`. |
| `backend/src/modules/consulta/application/consulta.service.ts` | Traduce a `ConflictException` (409) y `ForbiddenException` (403). |
| `backend/src/modules/consulta/__tests__/inmutabilidad-expediente.service.spec.ts` | 9 casos. |

**Frontend — falta**

| Archivo | Qué hacer |
|---|---|
| `frontend/src/pages/HistoriaClinicaPage.tsx` | En cada consulta del historial, si pasaron más de 24 h, mostrar un candado con la leyenda *"Consulta consolidada — R.M. 0090"* y deshabilitar la edición. |
| `frontend/src/pages/ConsultaCompletaPage.tsx` | Al recibir un 409, mostrar el mensaje del backend y ofrecer *"Registrar nota de enmienda"* en vez de un error seco. |

---

## R12 · Solo el autor enmienda

**Backend:** ya implementado en la política de dominio.

**Frontend:** en `HistoriaClinicaPage.tsx`, el botón de editar solo aparece si `consulta.medicoId` corresponde al médico de la sesión.

---

## R13 · Toda enmienda queda auditada

**Backend:** ya implementado — `consulta.service.ts` registra `oldValue`, `newValue` y `reason`.

**Frontend**

| Archivo | Qué hacer |
|---|---|
| `frontend/src/pages/AuditLogPage.tsx` | Permitir filtrar por `entityType = 'ConsultaMedica'` y mostrar el antes/después de cada enmienda en un panel expandible. Es la pantalla que se muestra en la defensa. |

---

## R14 · El log de auditoría no se edita ni se borra

**Backend**

| Archivo | Qué hacer |
|---|---|
| `backend/src/modules/audit/infrastructure/controllers/` | Verificar que **no exista** ningún endpoint `PUT`, `PATCH` ni `DELETE`. Si existe, eliminarlo. |

**Frontend:** `AuditLogPage.tsx` es de solo lectura. Ninguna acción de edición.

---

## R15 · Todo documento impreso lleva encabezado y firma

**Backend**

| Archivo | Qué hacer |
|---|---|
| `backend/src/modules/receta/infrastructure/receta-pdf.service.ts` | Ya existe. Verificar que incluya encabezado institucional y matrícula del médico. |

**Frontend**

| Archivo | Qué hacer |
|---|---|
| `frontend/src/index.css` | Las reglas `@media print` ya están. **No las modifiques sin leerlas.** |
| `RecetasPage.tsx` · `HistoriaClinicaPage.tsx` · `ConsultaCompletaPage.tsx` · `TurnosPage.tsx` | Normalizar las cuatro plantillas: encabezado (clínica, dirección, teléfono, NIT), cuerpo (paciente, CI, edad, fecha), pie (médico, matrícula, espacio de firma y sello). |

**No instalar librerías de PDF.** Con `@media print` y *Guardar como PDF* el resultado ya es un PDF vectorial válido.

---

# BLOQUE 4 — CADA ROL HACE LO SUYO

## R16–R21 · Restricciones por rol

**Backend**

| Archivo | Qué hacer |
|---|---|
| `backend/src/common/guards/roles.guard.ts` | Verificar que esté aplicado en **todos** los controladores, no solo en algunos. Listar los que no lo tienen. |
| `backend/src/common/constants/permissions.ts` | Debe reflejar la matriz real. |
| Controladores de `paciente`, `consulta`, `receta` | El rol `admin` **no debe** figurar en los decoradores de roles de estos endpoints. |

**Frontend — ya aplicado, verificar**

| Archivo | Estado |
|---|---|
| `frontend/src/data/navigation.ts` | `ADMISION`, `CLINICO`, `MEDICO`, `STAFF_PAC` ya no incluyen `admin`. |
| `frontend/src/routes/AppRoutes.tsx` | Mismos conjuntos. Deben coincidir exactamente con `navigation.ts`. |
| `frontend/src/data/rbac.ts` | La matriz declara lo que el código hace. |

**Prueba obligatoria:** un test que recorra `rbac.ts` y falle si algún conjunto clínico vuelve a incluir `admin`.

---

# BLOQUE 5 — LA PRIORIDAD CLÍNICA MANDA

## R22–R24 · Orden por ESI y tiempos reales

**Backend**

| Archivo | Qué hacer |
|---|---|
| `backend/src/modules/triage/application/triage.service.ts` | El listado debe devolver `createdAt` y `nivelEsi`, ordenado por nivel ESI ascendente y luego por `createdAt` ascendente. El orden se define en el backend, no en la interfaz. |

**Frontend**

| Archivo | Qué hacer |
|---|---|
| `frontend/src/pages/TriajePage.tsx` | Calcular el tiempo transcurrido con `Date.now() - createdAt`, refrescando cada 30 s con un `setInterval` que se limpie en el `return` del `useEffect`. Marcar visualmente a quien superó su tiempo máximo: E1 inmediato · E2 10 min · E3 30 · E4 60 · E5 120. |
| `frontend/src/pages/TurnosSalaPage.tsx` · `TurnosTVPage.tsx` | Mismo orden de prioridad. |

---

# BLOQUE 6 — INTEGRIDAD DE LOS DATOS

## R25 · CI única

**Backend:** `paciente/domain/services/paciente-domain.service.ts` valida unicidad. Verificar que la entidad tenga índice único en la columna de CI.
**Frontend:** `PacientesPage.tsx` muestra el mensaje del backend, no uno genérico.

## R26 · Sin citas superpuestas

**Backend:** `cita/domain/services/cita-domain.service.ts` — validar solapamiento por médico y rango horario antes de guardar. Lanzar `ConflictException` con las horas en conflicto.
**Frontend:** `AgendaPage.tsx` y `CitasPage.tsx` — marcar los bloques ocupados y no permitir seleccionarlos.

## R27 · Camas coherentes

**Backend:** `hospitalizacion/application/hospitalizacion.service.ts` — no internar en cama ocupada o en mantenimiento; no dar de alta desde cama vacía.
**Frontend:** `HospitalizacionPage.tsx` — camas en mantenimiento no seleccionables.

## R28 · Consulta no se cierra sin diagnóstico

**Backend:** `consulta/domain/services/consulta-domain.service.ts` — validar al menos un diagnóstico CIE-10 al cerrar.
**Frontend:** `ConsultaCompletaPage.tsx` — botón de cerrar deshabilitado con la razón visible (regla R9).

## R29 · Errores que explican

**Frontend:** `frontend/src/api/errMsg.ts` — mapear cada código HTTP a un mensaje accionable. **Prohibido** mostrar *"Error"* a secas.

---

# BLOQUE 7 — CÓMO SE VE

## R30 · El color se reserva para lo clínico

`frontend/src/styles/theme.css` · `index.css` — ya está aplicado: 0 colores crudos, 0 degradados llamativos. Al agregar pantallas nuevas, usar solo tokens. Rojo, ámbar y verde intensos **solo** para alertas, ESI y estados clínicos.

## R31 · Responsive

Revisar a **375 / 768 / 1280 px**: `ConsultasPage` · `TurnosPage` · `CajaPage` · `HistoriaClinicaPage` · `TriajePage` · `RecetasPage`. Toda tabla ancha va dentro de un contenedor con `overflow-x: auto`. El `body` nunca hace scroll horizontal.

## R32 · Foco visible

`index.css` ya define `:focus-visible` global. Verificar que ningún componente lo anule con `outline: none`.

---

# FORMATO DE REPORTE

```
REGLA: R<n>
BACKEND:  [YA CUMPLÍA / IMPLEMENTADA / NO IMPLEMENTADA] — <archivos>
FRONTEND: [YA CUMPLÍA / IMPLEMENTADA / NO IMPLEMENTADA] — <archivos>
PRUEBA: <archivo del test, o "sin prueba" y por qué>
VERIFICACIÓN: tsc backend [OK/FALLA] · tsc frontend [OK/FALLA] · tests [N/N]
RIESGO: <qué se pudo haber roto>
```

**Si una regla no se implementó, decláralo.** No la marques como hecha.

Un sistema con 25 reglas cumplidas y 7 declaradas pendientes es defendible. Uno con 32 declaradas y 5 mentidas, no lo es — y la mentira se descubre justo en el peor momento.

---

# ORDEN DE PRIORIDAD

| # | Bloque | Por qué va ahí |
|---|---|---|
| 1 | **1 — Seguridad del paciente** | Es el aporte central del proyecto de grado |
| 2 | **3 — Expediente médico-legal** | Tiene sustento normativo boliviano explícito |
| 3 | **2 — El paciente no salta pasos** | Regla de negocio pedida por el autor |
| 4 | **4 — Roles** | Ya está casi completo, cerrarlo es barato |
| 5 | **6 — Integridad de datos** | Evita preguntas incómodas del tribunal |
| 6 | **5 y 7 — Prioridad y presentación** | Mejoran el sistema, no deciden la defensa |
