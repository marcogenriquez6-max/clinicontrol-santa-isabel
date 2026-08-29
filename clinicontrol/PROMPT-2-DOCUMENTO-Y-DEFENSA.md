# PROMPT 2 — ALINEACIÓN DEL DOCUMENTO Y PREPARACIÓN DE LA DEFENSA
## CliniControl / Clínica Santa Isabel — Marco Gabriel Enriquez Saavedra

> **Cuándo usar este archivo:** solo después de que el `PROMPT-OPENCODE-CLINICONTROL.md` haya terminado sus fases y el sistema compile y arranque.
>
> ```
> cd C:\Users\Equipo\ccpr\clinicontrol
> opencode
> ```
> Pegar: `Lee PROMPT-2-DOCUMENTO-Y-DEFENSA.md y ejecuta la Fase A. Muéstrame la tabla de contradicciones antes de tocar el documento.`

---

## 0. EL PROBLEMA QUE RESUELVE ESTE PROMPT

El código ya está corregido. Ahora hay un riesgo distinto y más peligroso: **que el documento diga cosas que el sistema no hace**.

Un tribunal no revisa 40.000 líneas de código. Revisa el documento, elige tres o cuatro afirmaciones, y pide verlas funcionando. Si una no aparece, deja de creer el resto del capítulo — aunque el resto sea verdad.

Tu trabajo aquí es que **cada afirmación del documento sea verificable en el sistema en menos de un minuto**.

Documento: `DDDDDD.docx` (y las variantes `DOCUMENTO-CliniControl-APA7-*.docx` en `C:\Users\Equipo\ccpr\`).
Sistema: `C:\Users\Equipo\ccpr\clinicontrol\`.

---

## 1. REGLAS

1. **El sistema es la verdad.** Cuando documento y código no coincidan, se corrige el documento — nunca al revés, y nunca inventando código para cubrir una frase.
2. **No agregues capacidades al documento que no puedas señalar con el dedo** en un archivo concreto del proyecto.
3. **Cita siempre la evidencia.** Cada corrección propuesta debe indicar el archivo y la línea que la sustenta.
4. **No reescribas el documento entero.** Correcciones quirúrgicas, sección por sección.
5. **Respeta APA 7** en citas, tablas y figuras: el documento ya sigue ese formato.

---

## 2. FASE A — TABLA DE CONTRADICCIONES *(hazlo primero, no corrijas nada todavía)*

Recorre el documento y produce esta tabla. Es el entregable más importante de todo el archivo.

| # | Afirmación del documento | Sección/Tabla | ¿Existe en el código? | Evidencia (archivo:línea) | Acción |
|---|---|---|---|---|---|

**Puntos que ya se sabe que hay que revisar** — verifica cada uno y agrega los que encuentres:

1. **Tabla 11 — Diccionario de datos.** No coincide con las entidades reales de TypeORM. Compara campo por campo contra `backend/src/entities/*.entity.ts`.

2. **Tabla 12 — Pruebas.** Verifica qué pruebas declara y cuáles existen realmente en `backend/src/**/__tests__/` y `*.spec.ts`. Reporta el número real de casos.

3. **`schema-unified.sql`.** Si el documento lo presenta como el esquema de la base, es falso: la base la crea TypeORM con `synchronize` desde las entidades. Las tablas `grupo_farmacologico`, `principio_activo` y `contraindicacion` **no existen** en la base real.

4. **MFA y Sucursales.** Fueron retirados del sistema. Si alguna sección, figura o tabla los menciona, hay que quitarlos.

5. **Stack tecnológico.** Verifica versiones reales en `backend/package.json` y `frontend/package.json`. No declares versiones de memoria.

6. **Laboratorio, inventario de medicamentos con descuento de stock, y eventos de dominio.** No existen. Si el documento los menciona, hay que quitarlos o moverlos a "trabajo futuro".

7. **Referencias a herramientas** (Newman, Postman, y similares). Si el documento afirma que se ejecutaron pruebas con una herramienta, deben existir las colecciones o los reportes. Si no existen, se quita la afirmación.

8. **Roles.** El documento describe seis roles. Verifica que las capacidades descritas coincidan con `frontend/src/data/rbac.ts` y con los guardas de `AppRoutes.tsx`. Recuerda: **el administrador ya no atiende pacientes**.

**Al terminar la Fase A, PARA.** Muestra la tabla y espera aprobación antes de editar el documento.

---

## 3. FASE B — CORRECCIÓN DEL DOCUMENTO

Solo con la tabla aprobada. Para cada fila, aplica la acción acordada.

**Criterios de redacción:**

- Lenguaje académico, tercera persona, tiempo pasado para lo construido ("se implementó", no "se implementará").
- Cada capacidad descrita debe ser demostrable en pantalla.
- Las limitaciones se declaran explícitamente en una sección propia. **Una limitación declarada es una fortaleza; una limitación descubierta por el tribunal es una falla.**
- Si quitas una tabla o figura, renumera las siguientes y corrige el índice.

**Sección que conviene agregar si no existe: "Alcance y limitaciones del sistema".** Algo así:

> El sistema cubre el ciclo asistencial desde la admisión hasta el cierre de la consulta, incluyendo prescripción con verificación de seguridad farmacológica, triaje ESI y hospitalización. Quedan fuera del alcance de esta versión los módulos de laboratorio clínico, gestión de inventario farmacéutico y facturación tributaria, identificados como líneas de trabajo futuro.

Eso se defiende sin problema. Prometer laboratorio y no tenerlo, no.

---

## 4. FASE C — CAPÍTULO DE ARQUITECTURA (redacción sobre lo real)

Redacta o corrige la sección de arquitectura describiendo lo que **efectivamente** se construyó:

- **Estilo:** monolito modular con diseño interno hexagonal (puertos y adaptadores), 37 módulos.
- **Capas por módulo:** `domain/` (lógica pura, sin dependencias de framework), `application/` (casos de uso), `infrastructure/` (controladores HTTP, persistencia TypeORM).
- **Ejemplo concreto a desarrollar:** el invariante de inmutabilidad del expediente clínico.
  - `domain/exceptions/expediente-inmutable.exception.ts` — excepciones de dominio puras.
  - `domain/services/inmutabilidad-expediente.service.ts` — la política: ventana de enmienda de 24 h, solo el médico autor, siete campos SOAP protegidos.
  - `application/consulta.service.ts` — traduce las excepciones de dominio a HTTP (409 / 403) y registra la enmienda en auditoría con valor anterior y nuevo.
  - Sustento normativo: **Ley N° 3131** del Ejercicio Profesional Médico y **R.M. N° 0090**, Norma Nacional para el Manejo del Expediente Clínico.

Ese es el mejor ejemplo del documento: muestra separación de capas real, una regla de negocio no trivial, sustento legal boliviano y pruebas unitarias. Desarróllalo en detalle.

- **Segundo ejemplo:** el motor de seguridad farmacológica (`backend/src/modules/receta/domain/`), que verifica alergias por grupo farmacológico con reactividad cruzada, no por coincidencia de texto.

---

## 5. FASE D — DATOS DE DEMOSTRACIÓN COHERENTES

El día de la defensa los datos en pantalla son parte del argumento. Revisa `backend/src/common/seeder.service.ts` y verifica que exista:

- Un paciente **con alergia a penicilina** — para demostrar la alerta farmacológica en vivo. Es el caso estrella.
- Al menos un paciente en cada nivel ESI (E1 a E5).
- Turnos en los tres estados: en espera pagado, en atención, atendido.
- Una consulta SOAP completa con diagnóstico CIE-10.
- Camas ocupadas, libres y en mantenimiento.
- Un usuario por cada uno de los seis roles, con credenciales anotadas.

Si falta algo, agrégalo al seeder. Reporta las credenciales de los seis roles en una tabla.

---

## 6. FASE E — GUION DE DEMOSTRACIÓN (7 minutos)

Escribe `GUION-DEFENSA.md` con el recorrido exacto, paso a paso, incluyendo qué decir en cada pantalla:

1. **Ingreso** — mostrar el control de acceso por rol. Entrar como recepcionista.
2. **Registro de paciente** — demostrar la validación de CI que impide expedientes duplicados (HU-02). Intentar registrar una CI existente y mostrar el rechazo.
3. **Cita y turno** — agendar y emitir el turno.
4. **Triaje ESI** — entrar como enfermería, clasificar un paciente.
5. **Caja** — cobrar. Señalar que sin este paso el médico no ve al paciente.
6. **Consulta** — entrar como médico. Mostrar que la cola **solo trae sus pacientes pagados**.
7. **Receta — el momento clave.** Prescribir amoxicilina a un paciente alérgico a penicilina. La alerta salta por **grupo farmacológico y reactividad cruzada**, no por coincidencia de nombre. Explicar por qué eso importa clínicamente.
8. **Inmutabilidad** — intentar modificar una consulta antigua y mostrar el rechazo con el sustento legal.
9. **Auditoría** — mostrar el registro inmutable de lo que se acaba de hacer.

Para cada paso: la ruta exacta, el usuario con que se entra, y una frase de lo que hay que decir.

**Incluye un plan B:** qué hacer si PostgreSQL no arranca, si el puerto 3000 está ocupado, o si falla el internet. Ese plan salva defensas.

---

## 7. FASE F — PREGUNTAS DEL TRIBUNAL

Escribe `PREGUNTAS-TRIBUNAL.md` con las preguntas probables y la respuesta honesta. Mínimo estas:

- ¿Por qué un monolito modular y no microservicios?
- ¿Cómo garantiza que una historia clínica no se altere? *(aquí va Ley 3131 y R.M. 0090)*
- ¿Qué pasa si dos recepcionistas agendan el mismo horario?
- ¿Cómo protege las contraseñas? *(bcrypt, factor de costo 12)*
- ¿Qué pasa si el médico intenta ver un paciente que no le corresponde?
- ¿Por qué no hay módulo de laboratorio? *(respuesta: fue una decisión de alcance, está declarada en las limitaciones)*
- ¿Qué cobertura tienen sus pruebas? *(dar el número real, no uno inventado)*
- ¿El sistema cumple con la normativa boliviana de expediente clínico?

**Regla para las respuestas:** si algo no está implementado, la respuesta correcta es decirlo y explicar la decisión. Nunca inventar. Un tribunal perdona un alcance limitado y bien argumentado; no perdona que le mientan.

---

## 8. ENTREGABLES

Al terminar:

1. Tabla de contradicciones (Fase A) con cada punto resuelto.
2. Documento corregido, sin una sola afirmación no verificable.
3. Sección de alcance y limitaciones.
4. Capítulo de arquitectura sobre lo real.
5. `GUION-DEFENSA.md`.
6. `PREGUNTAS-TRIBUNAL.md`.
7. Tabla de credenciales de los seis roles.

---

## 9. CRITERIO FINAL

El objetivo no es que el documento parezca más grande. Es que **cada línea del documento se pueda demostrar en el sistema**.

Un proyecto de grado honesto y acotado se defiende. Uno que promete más de lo que entrega, se cae en la primera pregunta.
