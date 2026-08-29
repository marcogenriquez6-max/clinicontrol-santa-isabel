# CHECKLIST DE ROLES — CliniControl
## Qué hace cada rol · verificado en el código el 29 de agosto de 2026

---

## RESUMEN

| | Resultado |
|---|---|
| Roles revisados | 6 |
| Menú y rutas del frontend | **Coherentes** |
| Permisos del backend | **2 problemas encontrados** |

**Lo importante:** el frontend está bien cerrado, pero **el backend todavía deja pasar al administrador a todo lo clínico**. Hoy la restricción es cosmética: se esconde el menú, pero la API responde igual.

---

# 1 · ADMINISTRADOR

**Debe:** configurar el sistema. **No debe:** tocar pacientes ni el acto asistencial.

### Ve en el menú
- [x] Dashboard
- [x] Usuarios · Médicos · Roles
- [x] Auditoría · Arqueo de Caja
- [x] Perfil · Cambiar contraseña

### NO ve (correcto)
- [x] Pacientes, Citas, Turnos, Caja
- [x] Consultas, Historia Clínica, Triaje, Hospitalización, Recetas, Alergias, Vacunas

### ⚠ Problema en el backend
- [ ] **El API todavía le permite todo lo clínico.** Estos controladores siguen declarando `'admin'`:

  | Controlador | Declara hoy |
  |---|---|
  | `paciente.controller.ts` | `@Roles('admin', 'medico', 'recepcionista', 'secretaria')` |
  | `consulta.controller.ts` | `@Roles('admin', 'medico', 'enfermeria')` |
  | `receta.controller.ts` | `@Roles('admin', 'medico')` |
  | `triage.controller.ts` | `@Roles('admin', 'medico', 'enfermeria')` |
  | `cita.controller.ts` | `@Roles('admin', 'medico', 'recepcionista', 'secretaria')` |
  | `hospitalizacion.controller.ts` | `@Roles('admin', 'medico', 'enfermeria')` |

  Un administrador con su token puede crear consultas y emitir recetas llamando la API directamente. **Es la pregunta clásica de un tribunal técnico:** *"¿la restricción está en el backend o solo esconden el botón?"*

---

# 2 · GERENCIA

**Debe:** supervisar. Solo lectura.

### Ve en el menú
- [x] Dashboard
- [x] Auditoría
- [x] Arqueo de Caja
- [x] Perfil · Cambiar contraseña

### NO ve (correcto)
- [x] Todo lo asistencial
- [x] Usuarios, Médicos y Roles — no administra el sistema

### Pendiente
- [ ] **No tiene pantalla de reportes.** Existe el módulo `backend/src/modules/reports/` pero ninguna página que lo consuma. Si el documento promete "reportes estadísticos para gerencia", hoy no hay dónde verlos.
- [ ] **Verificar que sea realmente solo lectura.** `caja.controller.ts` incluye a `gerente`: confirmar que solo en los endpoints de consulta, nunca en los de cobro o cierre.

---

# 3 · RECEPCIONISTA

**Debe:** ser la ventanilla. Registra, agenda, emite turnos y cobra.

### Ve en el menú
- [x] Dashboard
- [x] Pacientes · Citas · Turnos · Agenda Médica · Caja
- [x] Perfil · Cambiar contraseña

### NO ve (correcto)
- [x] Consultas, Historia Clínica, Recetas — no accede al diagnóstico
- [x] Usuarios, Roles, Auditoría

### Backend coherente
- [x] `paciente`, `cita`, `turno` y `caja` la incluyen

### Funciones a probar
- [ ] Registrar paciente y que rechace CI duplicada *(HU-02)*
- [ ] Agendar cita sin solapamiento
- [ ] Registrar llegada: convertir cita en turno
- [ ] Cobrar y que el paciente aparezca en la cola del médico

---

# 4 · SECRETARIA

**Mismos permisos que recepcionista.** Apoyo administrativo.

- [x] Menú idéntico al de recepcionista
- [x] Backend coherente en los cuatro controladores

- [ ] **Decisión a tomar:** si secretaria y recepcionista tienen exactamente los mismos permisos, el documento debe explicar por qué son dos roles y no uno. Un tribunal puede preguntarlo. La respuesta válida es organizacional (son dos puestos distintos en la clínica), pero hay que decirla.

---

# 5 · MÉDICO

**Debe:** atender, prescribir e internar. Solo sus pacientes.

### Ve en el menú
- [x] Dashboard
- [x] Pacientes · Agenda Médica
- [x] Consultas · Consulta Completa · Historia Clínica
- [x] Triaje · Hospitalización · Recetas · Alergias · Vacunas
- [x] Perfil · Cambiar contraseña

### NO ve (correcto)
- [x] Citas, Turnos, Caja — no agenda ni cobra
- [x] Usuarios, Roles, Auditoría, Arqueo

### Restricciones verificadas
- [x] **Solo ve su propia cola.** `ConsultasPage` cruza `medico.usuarioId` con la sesión
- [x] **Guard de propiedad aplicado** en tres endpoints de turnos
- [x] **No puede atender sin pago** — `validarPagoPrevio()` se invoca en el cambio a `atencion`
- [x] **Excepción E1/E2** implementada con su fundamento documentado
- [x] **Solo puede enmendar sus propias consultas**, dentro de 24 h

### Pendiente de probar
- [ ] Entrar con dos médicos distintos y confirmar que cada uno ve solo su cola
- [ ] Que un E3 impago sea rechazado y un E1 impago pase

---

# 6 · ENFERMERÍA

**Debe:** triaje, signos vitales, vacunas y apoyo en internación.

### Ve en el menú
- [x] Dashboard
- [x] Pacientes
- [x] Consultas · Historia Clínica · Triaje · Hospitalización · Alergias · Vacunas
- [x] Perfil · Cambiar contraseña

### NO ve (correcto)
- [x] Recetas y Consulta Completa — no prescribe ni diagnostica
- [x] Citas, Turnos, Caja
- [x] Todo lo administrativo

### ⚠ Problema encontrado
- [ ] **Ve "Pacientes" en el menú pero el API se lo niega.**

  El frontend incluye `enfermeria` en `STAFF_PAC`, pero `paciente.controller.ts` declara `@Roles('admin', 'medico', 'recepcionista', 'secretaria')` — **sin enfermería**.

  Resultado: enfermería hace clic en Pacientes y recibe un **403**. Es un error visible en cualquier demostración.

  **Hay que decidir:** o enfermería accede al padrón (agregarla en el backend), o no lo ve (quitarla de `STAFF_PAC` en el frontend). Lo clínicamente razonable es que **sí acceda**, porque necesita identificar al paciente para el triaje.

---

# CÓMO ARREGLAR LOS DOS PROBLEMAS

Pegue esto en OpenCode:

```
Hay dos incoherencias de permisos entre el frontend y el backend. Corrígelas.

PROBLEMA 1 — El administrador no participa del acto asistencial, pero el API
todavía se lo permite. Quita 'admin' del decorador @Roles en estos controladores:

  modules/paciente/infrastructure/controllers/paciente.controller.ts
  modules/consulta/infrastructure/controllers/consulta.controller.ts
  modules/receta/infrastructure/controllers/receta.controller.ts
  modules/triage/infrastructure/controllers/triage.controller.ts
  modules/cita/infrastructure/controllers/cita.controller.ts
  modules/hospitalizacion/infrastructure/controllers/hospitalizacion.controller.ts

IMPORTANTE: revisa cada endpoint uno por uno antes de quitarlo. Si alguno lo
necesita para tareas de configuración (por ejemplo cargar catálogos), déjalo y
avísame cuál y por qué.

PROBLEMA 2 — Enfermería ve "Pacientes" en el menú pero paciente.controller.ts
no la incluye, así que recibe 403. Agrega 'enfermeria' al @Roles de los endpoints
de LECTURA de paciente (GET), no a los de creación ni edición: enfermería
necesita identificar al paciente para el triaje, pero no registra pacientes.

Después de cada cambio: npx tsc -p tsconfig.json --noEmit && npm test
Y escribe una prueba que falle si 'admin' vuelve a aparecer en un controlador
clínico.
```

---

# VERIFICACIÓN FINAL — PRUÉBELO USTED

Entre con cada rol y confirme. Es lo que hará el tribunal.

- [ ] **admin** — no ve Pacientes ni Historia Clínica en el menú
- [ ] **gerente** — ve Auditoría y Arqueo, nada asistencial
- [ ] **recepcionista** — registra, agenda, emite turno y cobra
- [ ] **secretaria** — igual que recepcionista
- [ ] **medico** — ve solo su cola, no puede atender impagos
- [ ] **enfermeria** — abre Pacientes **sin recibir 403** *(después del arreglo)*
- [ ] Los seis pueden entrar con su contraseña y llegar al Dashboard
- [ ] Ninguno ve Sucursales ni Verificación MFA

---

# VEREDICTO

**El frontend está bien.** Los seis roles ven exactamente lo que corresponde, el menú coincide con las rutas y el administrador quedó fuera de lo clínico.

**El backend está a medias.** Las restricciones existen, pero el administrador conserva permisos clínicos y enfermería tiene un permiso de menos. Son dos correcciones de pocas líneas.

Vale la pena hacerlas: la diferencia entre *"escondimos el botón"* y *"el API lo rechaza"* es exactamente lo que separa un sistema que se defiende de uno que se cae en una pregunta.
