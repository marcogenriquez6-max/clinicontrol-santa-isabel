# ESPECIFICACIÓN DE PANTALLAS Y BOTONES — CliniControl
## Qué hace cada botón, quién lo ve, qué valida y qué mensaje muestra

> ```
> cd C:\Users\Equipo\ccpr\clinicontrol
> opencode
> ```
> Pegar: `Lee ESPECIFICACION-PANTALLAS-Y-BOTONES.md. Implementa la pantalla 1 completa según la tabla de botones, verifica y repórtame. No avances a la siguiente sin mi aprobación.`

---

## CÓMO LEER ESTE DOCUMENTO

Cada pantalla tiene una tabla con esta estructura:

| Columna | Significa |
|---|---|
| **Control** | El botón, campo o acción, con el texto exacto que debe mostrar |
| **Quién lo ve** | Roles que tienen acceso. Si no está en la lista, el control **no se renderiza** |
| **Qué hace** | La acción, con el endpoint que llama |
| **Valida antes** | Condiciones sin las cuales el control está bloqueado |
| **Si sale bien** | Mensaje y a dónde va el usuario |
| **Si sale mal** | Mensaje exacto. **Prohibido decir solo "Error"** |

**Reglas transversales, para todas las pantallas:**

1. Un botón deshabilitado **siempre** muestra al lado por qué lo está.
2. Todo botón que dispara una petición muestra estado de carga y se bloquea mientras dura.
3. Toda acción irreversible (anular, dar de alta, cerrar caja) pide confirmación con `ConfirmDialog`.
4. Los mensajes de error vienen del backend a través de `frontend/src/api/errMsg.ts`, nunca inventados en la pantalla.
5. Ningún control usa colores crudos de Tailwind: solo tokens del tema.

---

# 1 · LOGIN — `pages/LoginPage.tsx`

**Quién entra:** todos. **A dónde va:** `/dashboard`.

| Control | Quién lo ve | Qué hace | Valida antes | Si sale bien | Si sale mal |
|---|---|---|---|---|---|
| Campo **Correo electrónico** | Todos | Captura el email | Formato de email válido | — | *"Ingrese un email válido"* |
| Campo **Contraseña** | Todos | Captura la clave, oculta | Mínimo 6 caracteres | — | *"Mínimo 6 caracteres"* |
| **Ingresar al sistema** | Todos | `POST /auth/login` | Ambos campos válidos | Toast *"Bienvenido"* → `/dashboard` | *"Credenciales inválidas. Verifique su email y contraseña."* |
| **¿Olvidó su contraseña?** | Todos | Navega a `/forgot-password` | — | — | — |
| Casilla **Recordar sesión** | Todos | Extiende la duración del refresh token | — | — | — |

**No debe haber** paso de verificación en dos etapas: fue retirado del alcance.

---

# 2 · PADRÓN DE PACIENTES — `pages/PacientesPage.tsx`

**Quién entra:** recepcionista, secretaria, médico, enfermería. **NO el administrador.**

| Control | Quién lo ve | Qué hace | Valida antes | Si sale bien | Si sale mal |
|---|---|---|---|---|---|
| **Nuevo paciente** | recepcionista, secretaria | Abre el modal de registro | — | — | — |
| Campo **Cédula de identidad** | recepcionista, secretaria | Captura la CI | Obligatorio · solo dígitos · **único en el sistema** | — | *"Ya existe un paciente registrado con la cédula NNNNN. Búsquelo en el padrón."* |
| **Buscar** | Todos los del padrón | Filtra por nombre o CI, reactivo | Mínimo 2 caracteres | Lista filtrada | Estado vacío: *"Ningún paciente coincide con la búsqueda"* |
| **Guardar paciente** | recepcionista, secretaria | `POST /pacientes` | Nombre, apellido, CI y fecha de nacimiento completos | Toast *"Paciente registrado"* → cierra modal y refresca | Mensaje del backend |
| **Ver expediente** (icono) | médico, enfermería | Navega a `/historia-clinica?paciente=ID` | — | — | — |
| **Editar** (icono) | recepcionista, secretaria | Abre el modal con datos cargados | — | Toast *"Datos actualizados"* | Mensaje del backend |
| **Cambiar estado** (icono) | recepcionista, secretaria | Activa o desactiva el expediente | `ConfirmDialog` obligatorio | Toast con el nuevo estado | Mensaje del backend |

**Regla clave (HU-02):** el sistema **debe** impedir dos expedientes con la misma CI. Es la historia de usuario que se demuestra en la defensa: intentar registrar una CI repetida y mostrar el rechazo.

---

# 3 · CITAS — `pages/CitasPage.tsx`

**Quién entra:** recepcionista, secretaria.

| Control | Quién lo ve | Qué hace | Valida antes | Si sale bien | Si sale mal |
|---|---|---|---|---|---|
| **Nueva cita** | recepcionista, secretaria | Abre el formulario | — | — | — |
| Selector **Paciente** | " | Búsqueda por CI o nombre | Obligatorio | — | *"Seleccione un paciente"* |
| Selector **Médico** | " | Lista de médicos activos | Obligatorio | — | *"Seleccione un médico"* |
| Selector **Fecha y hora** | " | Elige del horario disponible | **No debe solaparse** con otra cita del mismo médico | — | *"El Dr. X ya tiene una cita de 10:00 a 10:30. Elija otro horario."* |
| **Agendar cita** | " | `POST /citas` | Los tres campos anteriores | Toast *"Cita agendada para el DD/MM a las HH:MM"* | Mensaje del backend |
| **Registrar llegada** | recepcionista, secretaria | `POST /citas/:id/llegada` — convierte la cita en turno | Solo en citas de **hoy** en estado pendiente o confirmada | Toast *"Turno #NNN emitido"* → muestra el ticket | *"Esta cita ya tiene un turno emitido"* |
| **Reprogramar** | " | Abre el formulario con datos cargados | Cita no completada ni cancelada | Toast *"Cita reprogramada"* | Mensaje del backend |
| **Cancelar cita** | " | Cambia el estado a cancelada | `ConfirmDialog` + motivo obligatorio | Toast *"Cita cancelada"* | Mensaje del backend |

**Columna de estado:** cada fila muestra si la cita ya tiene turno emitido. Sin esa señal, recepción no sabe a quién le falta registrar la llegada.

---

# 4 · TURNOS — `pages/TurnosPage.tsx`

**Quién entra:** recepcionista, secretaria.

**Estructura:** asistente de tres pasos con indicador de progreso. **No se avanza sin completar el paso anterior.**

| Control | Paso | Qué hace | Valida antes | Si sale bien | Si sale mal |
|---|---|---|---|---|---|
| **Buscar paciente** | 1 | Búsqueda reactiva por CI o nombre | Mínimo 2 caracteres | Muestra la ficha del paciente | *"No se encontró el paciente. Regístrelo primero."* |
| **Paciente nuevo** | 1 | Abre el registro sin salir del asistente | — | Vuelve al paso 1 con el paciente cargado | — |
| **Siguiente** | 1 | Avanza al paso 2 | Paciente seleccionado | — | Botón bloqueado: *"Seleccione un paciente"* |
| Tarjeta de **servicio** | 2 | Selecciona servicio, precio y duración | Obligatorio | Marca la tarjeta elegida | — |
| Tarjeta de **médico** | 2 | Selecciona el profesional | El médico debe estar **Disponible** | Marca la tarjeta | Las tarjetas de médicos ocupados no son seleccionables, con la leyenda *"En consulta"* |
| **Siguiente** | 2 | Avanza al paso 3 | Servicio y médico elegidos | — | *"Elija servicio y médico"* |
| **Emitir turno** | 3 | `POST /turnos` | Resumen completo con total calculado | Toast *"Turno #NNN emitido"* + ticket imprimible | Mensaje del backend |
| **Imprimir ticket** | 3 | `window.print()` sobre `#print-area` | Turno emitido | Abre el diálogo de impresión | — |
| **Atrás** | 2 y 3 | Vuelve al paso anterior conservando lo elegido | — | — | — |

**El total a cobrar se muestra siempre en el paso 3**, con `font-variant-numeric: tabular-nums`.

---

# 5 · CAJA — `pages/CajaPage.tsx`

**Quién entra:** recepcionista, secretaria.

## Caja cerrada

| Control | Qué hace | Valida antes | Si sale bien | Si sale mal |
|---|---|---|---|---|
| Campo **Fondo inicial (Bs.)** | Captura el monto de apertura | Número **mayor que cero** | — | *"El fondo inicial debe ser mayor a cero"* |
| **Abrir caja** | `POST /caja/apertura` | Fondo válido · sin sesión abierta | Toast *"Caja abierta con Bs. NNN"* → vista de cobros | *"Ya existe una sesión de caja abierta"* |

## Caja abierta

| Control | Qué hace | Valida antes | Si sale bien | Si sale mal |
|---|---|---|---|---|
| Lista de **turnos por cobrar** | Muestra turnos impagos con paciente, servicio y monto | — | — | Vacío: *"No hay cobros pendientes"* |
| Selector **método de pago** | Efectivo · Tarjeta · QR | Obligatorio | — | *"Seleccione el método de pago"* |
| Campo **Monto recibido** | Solo con método Efectivo | ≥ al total | Calcula y muestra el **vuelto** automáticamente | *"El monto recibido es menor al total"* |
| **Registrar cobro** | `POST /caja/cobro` | Método elegido y monto suficiente | Toast *"Cobro registrado — Bs. NNN"* + recibo imprimible. **El turno pasa a pagado y el paciente aparece en la cola del médico** | Mensaje del backend |
| **Imprimir recibo** | `window.print()` | Cobro registrado | Diálogo de impresión | — |
| **Cerrar caja** | `POST /caja/cierre` | `ConfirmDialog` con el resumen del día | Toast *"Caja cerrada"* + arqueo imprimible | *"Existen cobros pendientes de registrar"* |

**Presentación:** dos columnas. Izquierda, paciente y desglose del servicio. Derecha, método de pago, monto recibido y vuelto. Todos los montos con `tabular-nums`.

---

# 6 · TRIAJE ESI — `pages/TriajePage.tsx`

**Quién entra:** enfermería, médico.

| Control | Qué hace | Valida antes | Si sale bien | Si sale mal |
|---|---|---|---|---|
| **Nuevo triaje** | Abre el formulario | — | — | — |
| Selector **Paciente** | Búsqueda por CI o nombre | Obligatorio | — | *"Seleccione un paciente"* |
| Selector **Nivel ESI** | E1 a E5 con descripción | Obligatorio | — | *"Clasifique la severidad"* |
| Campos de **signos vitales** | Temperatura, FC, PA, FR, SpO₂, peso, glucosa | Rangos fisiológicos plausibles | — | *"La frecuencia cardíaca 400 está fuera de rango. Verifique el valor."* |
| **Registrar triaje** | `POST /triaje` | Paciente, nivel y motivo | Toast *"Triaje E<n> registrado"*. **Si es E1 o E2, el turno pasa directo a espera médica sin cobro** | Mensaje del backend |
| Tarjeta de **paciente en cola** | Muestra nivel, motivo, signos y **tiempo de espera en vivo** | — | El tiempo se actualiza cada 30 s | — |
| **Iniciar atención** | Cambia el estado del triaje | Solo enfermería o el médico asignado | Toast *"En atención"* | Mensaje del backend |

**Orden de la lista:** por nivel ESI ascendente, después por hora de llegada. Un E1 recién llegado va **antes** que un E4 de hace dos horas.

**Tiempos máximos, marcados visualmente al superarse:** E1 inmediato · E2 10 min · E3 30 min · E4 60 min · E5 120 min.

---

# 7 · TABLERO DE CONSULTAS — `pages/ConsultasPage.tsx`

**Quién entra:** médico, enfermería.

| Control | Quién lo ve | Qué hace | Valida antes | Si sale bien | Si sale mal |
|---|---|---|---|---|---|
| Lista **En espera · Pagados** | médico | Solo **sus** pacientes pagados, o E1/E2 sin pago | — | — | Vacío: *"No hay pacientes pagados asignados a usted en este momento"* |
| **Llamar paciente** | médico | Cambia el turno a llamado y avisa a la pantalla de sala | Turno pagado, o ESI E1/E2 | Toast *"Llamando al turno #NNN"* | *"El paciente no registra pago en caja"* |
| **Atender** | médico | Cambia a `atencion` → navega a `/consulta-completa` | Turno pagado o urgencia | Abre la consulta con el paciente cargado | *"El paciente no registra pago en caja. Regístrelo antes de iniciar la atención."* |
| Etiqueta **Urgencia** | médico | Marca visible en turnos E1/E2 sin pago | — | Leyenda *"Urgencia — atención sin cobro previo"* | — |
| **Buscar** | médico | Filtra la cola por nombre o CI | — | — | — |

**En el encabezado debe leerse de quién es la cola:** *"Su cola de atención — Dr. X · solo pacientes con pago registrado"*.

---

# 8 · CONSULTA COMPLETA (SOAP) — `pages/ConsultaCompletaPage.tsx`

**Quién entra:** médico.

**Arriba, fija:** `<BandaPaciente>` con CI, edad, sexo, grupo sanguíneo y **alergias en rojo**. Nunca se oculta al hacer scroll.

| Control | Pestaña | Qué hace | Valida antes | Si sale bien | Si sale mal |
|---|---|---|---|---|---|
| **Motivo de consulta** | S · Subjetivo | Texto libre | Obligatorio | — | *"El motivo de consulta es obligatorio"* |
| **Síntomas** · **Enfermedad actual** | S | Texto libre | — | — | — |
| **Signos vitales** | O · Objetivo | **Precargados desde el triaje**, editables | Rangos plausibles | Nota: *"Tomados en triaje a las HH:MM"* | *"Valor fuera de rango. Verifique."* |
| **Examen físico** | O | Texto libre | — | — | — |
| **Buscar diagnóstico CIE-10** | A · Evaluación | Autocompletado sobre el catálogo | Mínimo 3 caracteres | Agrega el diagnóstico a la lista | *"No se encontró el código o descripción"* |
| **Quitar diagnóstico** | A | Elimina uno de la lista | — | — | — |
| **Plan de tratamiento** · **Indicaciones** | P · Plan | Texto libre | — | — | — |
| **Agregar receta** | P | Abre el prescriptor con verificación de alergias | Al menos un diagnóstico registrado | Abre el modal | *"Registre el diagnóstico antes de prescribir"* |
| **Guardar borrador** | Todas | Guarda sin cerrar la consulta | — | Toast *"Borrador guardado"* | Mensaje del backend |
| **Cerrar consulta** | Todas | `POST /consultas/completa` | Motivo + **al menos un diagnóstico CIE-10** | Toast *"Consulta registrada"* → vuelve al tablero. **El turno pasa a finalizado** | Botón bloqueado con la razón: *"Falta registrar el diagnóstico"* |
| **Imprimir** | Todas | `window.print()` sobre la plantilla | Consulta guardada | Diálogo de impresión | — |

**Al intentar editar una consulta de más de 24 horas:** mensaje del backend (409) y ofrecer **"Registrar nota de enmienda"** en vez de un error seco.

---

# 9 · RECETAS — `pages/RecetasPage.tsx`

**Quién entra:** médico.

| Control | Qué hace | Valida antes | Si sale bien | Si sale mal |
|---|---|---|---|---|
| **Nueva receta** | Abre el prescriptor con la banda del paciente arriba | — | — | — |
| **Buscar medicamento** | Autocompletado sobre el catálogo | Mínimo 3 caracteres | Agrega el fármaco a la lista | *"Medicamento no encontrado en el catálogo"* |
| Campos **Dosis · Frecuencia · Duración · Cantidad** | Por cada medicamento | Todos obligatorios | — | *"Complete dosis, frecuencia y duración de <fármaco>"* |
| **Quitar medicamento** | Elimina una línea | — | — | — |
| **Verificar seguridad** | `POST /recetas/verificar-seguridad` | Al menos un medicamento | Muestra `PharmaAlertCard` con las **cuatro** categorías: alergias, duplicidad, interacciones, contraindicaciones | Mensaje del backend |
| **Emitir receta** | `POST /recetas` | Sin alertas críticas **o** con justificación escrita | Toast *"Receta emitida"* + receta imprimible | Si hay alerta crítica sin justificar: abre el diálogo de confirmación |
| Campo **Justificación clínica** | Solo aparece ante alerta crítica | **Mínimo 20 caracteres** | Habilita el botón de confirmar | El botón sigue bloqueado: *"Escriba la justificación clínica (mínimo 20 caracteres)"* |
| **Imprimir receta** | `window.print()` | Receta emitida | Diálogo de impresión | — |
| Columna **Medicamentos** (tabla) | Muestra los fármacos de cada receta | — | Nombres reales | Si no hay: *"Sin medicamentos prescritos"* — **nunca "N/A"** |

**El caso que se demuestra en la defensa:** paciente alérgico a **penicilina** + prescripción de **amoxicilina** ⇒ alerta por grupo farmacológico, no por coincidencia de nombre.

---

# 10 · HISTORIA CLÍNICA — `pages/HistoriaClinicaPage.tsx`

**Quién entra:** médico, enfermería.

| Control | Qué hace | Valida antes | Si sale bien | Si sale mal |
|---|---|---|---|---|
| **Buscar paciente** | Carga el expediente | Paciente seleccionado | Muestra banda + pestañas | *"Seleccione un paciente"* |
| Pestaña **Consultas** | Historial cronológico | — | — | *"No hay consultas registradas"* |
| Pestaña **Alergias** | Alergias con severidad | — | — | *"Sin alergias registradas"* — **nunca vacío** |
| Pestaña **Recetas** | Recetas emitidas con sus fármacos | — | — | *"No hay recetas registradas"* |
| Pestaña **Cirugías previas** | Antecedentes quirúrgicos | — | — | *"No se registraron cirugías previas"* |
| **Ver consulta** | Abre el detalle completo | — | — | — |
| **Editar consulta** | Solo si es del médico de la sesión **y** tiene menos de 24 h | Autoría + ventana vigente | Abre el editor | Candado con la leyenda *"Consulta consolidada — R.M. 0090"* |
| **Registrar nota de enmienda** | Agrega una nota tipo enmienda sin tocar el original | Consulta consolidada | Toast *"Nota de enmienda registrada"* | Mensaje del backend |
| **Imprimir expediente** | `window.print()` | Paciente cargado | Diálogo de impresión | — |

---

# 11 · HOSPITALIZACIÓN — `pages/HospitalizacionPage.tsx`

**Quién entra:** médico, enfermería.

| Control | Qué hace | Valida antes | Si sale bien | Si sale mal |
|---|---|---|---|---|
| **Mapa de camas** | Cuadrícula por sala | — | — | — |
| Cama **libre** | Botón **"Ingresar paciente"** | Cama disponible | Abre el formulario de ingreso | — |
| Cama **ocupada** | Muestra paciente, médico, diagnóstico y días de estancia | — | Botones "Nota de evolución" y "Alta médica" | — |
| Cama **en mantenimiento** | No seleccionable, en gris | — | — | Leyenda *"Cama en mantenimiento"* |
| **Ingresar paciente** | `POST /hospitalizacion` | Paciente, médico tratante, cama libre y motivo | Toast *"Paciente internado en <cama>"* | *"La cama <X> ya está ocupada"* |
| **Nota de evolución** | Agrega una nota al ingreso | Texto no vacío | Toast *"Nota registrada"* | Mensaje del backend |
| **Alta médica** | Cierra el internamiento y libera la cama | `ConfirmDialog` + diagnóstico de egreso | Toast *"Alta registrada — cama <X> liberada"* | *"No hay paciente internado en esa cama"* |

**Indicadores arriba:** camas totales, ocupadas, disponibles y porcentaje de ocupación.

---

# 12 · ALERGIAS — `pages/AlergiasPage.tsx` · VACUNAS — `pages/VacunasPage.tsx`

**Quién entra:** médico, enfermería.

| Control | Qué hace | Valida antes | Si sale bien | Si sale mal |
|---|---|---|---|---|
| **Nueva alergia / vacuna** (catálogo) | Agrega al catálogo maestro | Nombre único | Toast *"Agregada al catálogo"* | *"Ya existe una entrada con ese nombre"* |
| **Buscar paciente** | Carga sus alergias o su esquema | — | Muestra la lista del paciente | *"Busque un paciente para gestionar sus registros"* |
| **Asignar al paciente** | Vincula catálogo ↔ paciente con severidad | Paciente + entrada del catálogo + severidad | Toast *"Registrada en el expediente"* | *"El paciente ya tiene registrada esa alergia"* |
| **Quitar del paciente** | Desvincula | `ConfirmDialog` | Toast *"Registro eliminado"* | Mensaje del backend |
| **Importar catálogo** | Carga masiva desde CSV | Archivo con las columnas esperadas | Toast *"N entradas importadas"* | *"La fila N tiene un formato inválido"* |

**Nota sobre el catálogo:** debe cargarse desde el **seeder** o por importación CSV, no escribiéndolo a mano uno por uno.

---

# 13 · ADMINISTRACIÓN

## Usuarios — `pages/UsuariosPage.tsx` · Roles — `pages/RolesPage.tsx` · Médicos — `pages/MedicosPage.tsx`
**Quién entra:** solo administrador.

| Control | Qué hace | Valida antes | Si sale bien | Si sale mal |
|---|---|---|---|---|
| **Nuevo usuario** | `POST /usuarios` | Email único · rol asignado · contraseña de 8+ caracteres | Toast *"Usuario creado"* | *"Ya existe un usuario con ese correo"* |
| **Asignar rol** | Cambia el rol | `ConfirmDialog` | Toast *"Rol actualizado"* | Mensaje del backend |
| **Desactivar usuario** | Bloquea el acceso | `ConfirmDialog` · no puede ser uno mismo | Toast *"Usuario desactivado"* | *"No puede desactivar su propia cuenta"* |
| **Vincular médico a usuario** | Establece `medico.usuarioId` | Ambos existen | Toast *"Médico vinculado"* | Mensaje del backend |

**Sin este vínculo el tablero del médico no puede filtrar su cola.** Es un paso obligatorio al crear un médico.

## Auditoría — `pages/AuditLogPage.tsx`
**Quién entra:** administrador, gerencia. **Solo lectura: ninguna acción de edición ni borrado.**

| Control | Qué hace |
|---|---|
| **Filtros** (usuario, entidad, acción, rango de fechas) | Consulta el log |
| **Ver detalle** | Panel expandible con el valor anterior y el nuevo |
| **Exportar** | Descarga el resultado filtrado |

## Arqueo — `pages/ArqueoPage.tsx`
**Quién entra:** administrador, gerencia. Solo lectura sobre las transacciones.

---

# 14 · PANTALLAS DE SALA

## `pages/TurnosSalaPage.tsx` y `pages/TurnosTVPage.tsx`
**Sin sesión iniciada, sin controles.** Solo muestran la cola ordenada por prioridad ESI y luego por hora. Tipografía grande, legible desde lejos. Al llamarse un turno, señal visual destacada.

---

# 15 · MI CUENTA

| Pantalla | Controles |
|---|---|
| `ProfilePage.tsx` | Datos personales, último acceso. **No debe mostrar nada de verificación en dos pasos** |
| `ChangePasswordPage.tsx` | Contraseña actual · nueva · confirmación. Valida que la nueva tenga 8+ caracteres y que ambas coincidan. Error: *"Las contraseñas no coinciden"* |

---

# FORMATO DE REPORTE POR PANTALLA

```
PANTALLA: <nombre> — <archivo>
CONTROLES REVISADOS: N
YA CUMPLÍAN: <lista>
IMPLEMENTADOS: <lista>
NO IMPLEMENTADOS: <lista y por qué>
MENSAJES DE ERROR: [todos específicos / quedan N genéricos]
BOTONES BLOQUEADOS SIN EXPLICACIÓN: N
VERIFICACIÓN: tsc [OK/FALLA] · tests [N/N]
```

---

# ORDEN SUGERIDO

| # | Pantalla | Por qué |
|---|---|---|
| 1 | Consulta completa (8) | Aquí va la banda de alergias: lo más importante |
| 2 | Recetas (9) | El aporte central del proyecto |
| 3 | Tablero de consultas (7) | La regla de cobro previo |
| 4 | Turnos (4) y Caja (5) | Sostienen el flujo de admisión |
| 5 | Triaje (6) | Cronómetros y orden por prioridad |
| 6 | El resto | Presentación |

**No intente las quince de una sola vez.** Una pantalla, verificar, la siguiente.
