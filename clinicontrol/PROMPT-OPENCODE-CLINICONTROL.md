# PROMPT MAESTRO — CliniControl / Clínica Santa Isabel
## Para OpenCode (o Claude Code) — ejecutar dentro de `C:\Users\Equipo\ccpr\clinicontrol`

> **Cómo usar este archivo:**
> ```
> cd C:\Users\Equipo\ccpr\clinicontrol
> opencode
> ```
> Y pegar: `Lee el archivo PROMPT-OPENCODE-CLINICONTROL.md y ejecuta la Fase 0 y la Fase 1. No avances a la Fase 2 sin mostrarme los resultados de la verificación.`

---

## 0. QUIÉN ERES Y CUÁL ES LA SITUACIÓN

Eres un ingeniero de software senior con experiencia en sistemas de información en salud. Trabajas sobre **CliniControl**, el sistema de gestión de la Clínica Santa Isabel (Oruro, Bolivia), que es el proyecto de grado de Marco Gabriel Enriquez Saavedra.

**La defensa es en días. El sistema YA FUNCIONA.** Ese es el dato más importante de todo este archivo.

Tu objetivo NO es demostrar elegancia arquitectónica. Tu objetivo es que el día de la defensa el sistema arranque, haga lo que el documento dice que hace, y no tenga contradicciones entre el código y el documento.

**Stack real:** NestJS 11 + TypeORM + PostgreSQL 15 (backend) · React 19 + Vite + Tailwind CSS 4 + Zustand (frontend) · Arquitectura hexagonal en 37 módulos · Monolito modular.

---

## 1. REGLAS DURAS — SI VIOLAS UNA, EL TRABAJO NO SIRVE

1. **NO reescribas la arquitectura.** El sistema ya tiene arquitectura hexagonal (`domain/` · `application/` · `infrastructure/`) en 37 módulos. NO muevas archivos a estructuras nuevas tipo `aggregates/`, `value-objects/`, `ports/in/`, `ports/out/`. Mover cientos de archivos a días de una defensa es riesgo puro sin beneficio.

2. **NO rompas lo que funciona.** Antes de cambiar cualquier archivo, léelo completo. Después de cada bloque de cambios, ejecuta la verificación de la Sección 6. Si algo se rompe, revierte ese cambio antes de seguir.

3. **Respalda antes de borrar.** Nada se elimina sin copia previa. Usa `_respaldo/` en la raíz del módulo afectado. Si algo debe desaparecer, muévelo, no lo borres.

4. **Los archivos son CRLF (Windows).** Si editas con búsqueda de texto multilínea, normaliza `\r\n` → `\n` antes de comparar y restaura al escribir. Si no lo haces, tus reemplazos fallarán en silencio.

5. **NUNCA inventes que algo funciona.** Si no pudiste verificarlo, dilo. Frases prohibidas: "debería funcionar", "ahora todo está correcto". Frases correctas: "compilé y pasó", "no pude ejecutarlo, hay que probarlo con `npm test`".

6. **NO instales dependencias nuevas sin avisar.** El npm de esta máquina ha dado error 403. Si una tarea necesita una librería nueva, PARA y avisa antes de intentar instalarla.

7. **No toques el `.env`.** Contiene secretos JWT ya generados y está en `.gitignore`.

---

## 2. ESTADO REAL DEL SISTEMA (verificado, no supuesto)

### Lo que YA está hecho y funciona — no lo rehagas

| Área | Estado |
|---|---|
| Autenticación JWT + RBAC de 6 roles | Funciona |
| Registro único de paciente (validación de CI) | Funciona |
| Citas, turnos, agenda, caja | Funciona |
| Consulta SOAP + CIE-10 | Funciona |
| Triaje ESI (E1–E5) | Funciona |
| Hospitalización y control de camas | Funciona |
| Motor de seguridad farmacológica | Funciona, con 9 pruebas unitarias |
| Log de auditoría inmutable | Funciona |
| Inmutabilidad del expediente (Ley 3131 / R.M. 0090) | Implementado, con 9 pruebas |

### Correcciones ya aplicadas — no las deshagas

- **Sucursales y MFA retirados** del sistema por decisión del autor: el documento no los menciona. Código respaldado en `frontend/_fuera-de-alcance/` y `backend/_fuera-de-alcance/`. Los controladores HTTP están desregistrados.
- **Bug "N/A" en recetas corregido**: el backend envía `medicamentoNombre` (texto plano), el frontend leía `medicamento.nombre` (objeto anidado).
- **Reglas de impresión agregadas** en `frontend/src/index.css`: había 9 elementos `print-area` y cero `@media print`, por eso `window.print()` imprimía toda la interfaz.
- **El administrador ya no atiende pacientes**: removido de `ADMISION`, `CLINICO`, `MEDICO`, `STAFF_PAC` en `navigation.ts` y `AppRoutes.tsx`.
- **Tablero de Consultas filtrado por médico**: cruza `medico.usuarioId` con el usuario de la sesión.
- **Paleta clínica aplicada**: 0 colores crudos llamativos, degradados eliminados.

---

## 3. FASE 0 — DIAGNÓSTICO (hazlo primero, siempre)

Ejecuta y reporta en una tabla, sin cambiar nada todavía:

```bash
# 1. ¿Compila?
cd backend && npx tsc -p tsconfig.json --noEmit
cd ../frontend && npx tsc -p tsconfig.app.json --noEmit

# 2. ¿Pasan las pruebas?
cd ../backend && npm test

# 3. ¿Cuántos 'any' hay en el frontend?
cd ../frontend && npx eslint src --ext .ts,.tsx 2>&1 | tail -5

# 4. Código muerto: exports que nadie importa
grep -rn "export " src --include=*.ts --include=*.tsx | wc -l
```

Reporta: errores de compilación, pruebas que fallan, y cuántos avisos hay. **No arregles nada todavía.**

---

## 4. FASE 1 — LO QUE FALTA, EN ORDEN DE IMPORTANCIA

Haz una tarea, verifica, reporta. Luego la siguiente. **No hagas todas de golpe.**

### 1.1 — Banda del paciente en la consulta *(máxima prioridad clínica)*

**Problema:** el médico escribe la consulta en `frontend/src/pages/ConsultaCompletaPage.tsx` sin ver las alergias del paciente. En un sistema clínico real eso es inaceptable: la alergia debe estar visible mientras se prescribe.

**Qué hacer:** crear `frontend/src/components/clinico/BandaPaciente.tsx` — una franja fija en la parte superior con: nombre completo, CI, edad, sexo, grupo sanguíneo y **alergias en rojo**. Si no hay alergias registradas, decirlo explícitamente ("Sin alergias registradas"), nunca dejarlo vacío.

Montarla en `ConsultaCompletaPage.tsx`, `HistoriaClinicaPage.tsx` y `RecetasPage.tsx`.

Usa los tokens existentes (`var(--danger-500)`, `var(--text-primary)`, etc.), nunca colores crudos de Tailwind.

### 1.2 — Regla de cobro previo *(la pidió el autor explícitamente)*

**Regla:** el médico no puede atender a un paciente que no pagó.

**Dónde:** el frontend ya filtra por `t.pagado` en `ConsultasPage.tsx`, pero **el backend no lo valida**. Alguien podría llamar la API directamente.

**Qué hacer:** en el servicio de turnos, al cambiar el estado a `atencion`, verificar que el turno esté pagado. Si no lo está, lanzar `ConflictException` con mensaje claro.

**Excepción obligatoria:** los turnos con triaje **E1 (Reanimación) y E2 (Emergencia) se atienden sin pago previo**. Es una urgencia vital; cobrar primero sería una falta ética y legal. Documenta esa excepción en un comentario del código — es un punto que se defiende muy bien.

### 1.3 — Guard de propiedad en turnos

`backend/src/common/guards/ownership.guard.ts` ya existe y está aplicado en el controlador de consultas. Aplicarlo también al endpoint de turnos, para que `GET /turnos` devuelva solo los del médico autenticado.

### 1.4 — Pruebas unitarias del frontend

No existe ninguna. `vitest` no está instalado — **PARA y avisa antes de instalar**. Si el autor aprueba, cubre: `authStore`, el filtro por médico de `ConsultasPage` y la matriz `rbac.ts`.

### 1.5 — Revisión responsive

Revisar a 375 px, 768 px y 1280 px: `ConsultasPage`, `TurnosPage`, `CajaPage`, `HistoriaClinicaPage`, `TriajePage`. Buscar tablas que desbordan horizontalmente. Envolverlas en un contenedor con `overflow-x: auto`. El cuerpo de la página nunca debe hacer scroll horizontal.

---

## 5. FASE 2 — LO QUE NO EXISTE: CONSTRUIR O BORRAR DEL DOCUMENTO

Estas tres cosas **NO están en el código**. Si el documento las menciona, el tribunal las va a pedir y no aparecerán. Reporta cuáles menciona el documento `DDDDDD.docx` y, para cada una, di si conviene construirla o quitarla del texto.

| Cosa | Estado real | Recomendación |
|---|---|---|
| **Módulo de Laboratorio** (`OrdenLaboratorio`, `ResultadoExamen`, valores críticos) | No existe ningún módulo | Quitarlo del documento. Construirlo ahora es un contexto completo. |
| **Inventario de medicamentos** con descuento de stock al emitir receta | Solo existe `medicamento` como catálogo | Quitarlo del documento, o declararlo como trabajo futuro. |
| **Eventos de Dominio** (`PacienteRegistradoEvent`, `AlertaCriticaDetectadaEvent`, etc.) | No existe ni uno | Quitarlo del documento. |

**Criterio:** es preferible un documento que describa menos y sea exacto, que uno que prometa un módulo inexistente. Un tribunal que pide ver algo y no lo encuentra deja de creer el resto del capítulo.

---

## 6. QUÉ ELIMINAR — CÓDIGO MUERTO

Busca y reporta antes de tocar. Mueve a `_respaldo/`, no borres:

1. **`backend/src/database/schema-unified.sql`** — describe tablas que no existen en la base real (`grupo_farmacologico`, `principio_activo`, `contraindicacion`). La base la crea TypeORM con `synchronize` desde las entidades. Ese archivo contradice el sistema: si el tribunal lo abre, ve un esquema falso.

2. **Componentes y páginas que nadie importa.** Detéctalos así:
   ```bash
   cd frontend/src
   for f in $(ls components/ui/*.tsx); do
     n=$(basename $f .tsx)
     c=$(grep -rl "$n" --include=*.tsx . | grep -v "$f" | wc -l)
     [ "$c" -eq 0 ] && echo "SIN USO: $f"
   done
   ```

3. **Exports muertos en `api/services.ts`** — servicios que ningún componente consume.

4. **Reglas CSS sin uso** en `index.css` y `styles/theme.css`.

**Regla:** cada eliminación se reporta con el archivo, cuántas referencias tenía (debe ser 0) y dónde quedó el respaldo. Después de cada tanda, recompila.

---

## 7. PROTOCOLO DE VERIFICACIÓN — OBLIGATORIO DESPUÉS DE CADA TAREA

```bash
cd backend  && npx tsc -p tsconfig.json --noEmit      # debe dar 0 errores
cd ../frontend && npx tsc -p tsconfig.app.json --noEmit
cd ../backend && npm test                              # deben pasar todas
```

Y arrancar el sistema completo para confirmar que sigue vivo:

```bash
# Terminal 1 — PostgreSQL debe estar corriendo
cd backend && npm run start:dev

# Terminal 2
cd frontend && npm run dev
```

Si un cambio rompe la compilación o una prueba, **revierte ese cambio** y reporta qué pasó. No acumules cambios rotos.

---

## 8. CÓMO REPORTAR

Al terminar cada tarea, entrega exactamente esto:

```
TAREA: <cuál>
ARCHIVOS MODIFICADOS: <lista con ruta completa>
QUÉ CAMBIÓ: <2 o 3 líneas, sin adornos>
VERIFICACIÓN: tsc backend [OK/FALLA] · tsc frontend [OK/FALLA] · tests [N/N]
NO VERIFICADO: <lo que no pudiste probar y por qué>
RIESGO: <qué se podría haber roto>
```

**Prohibido decir que algo funciona sin haberlo ejecutado.** Si no lo probaste, va en "NO VERIFICADO". Esa honestidad vale más que el código: si el sistema falla el día de la defensa por algo que diste por bueno sin probar, el daño es irreparable.

---

## 9. CRITERIO FINAL

Ante cualquier duda entre **"más elegante"** y **"más seguro"**, elige más seguro. Este sistema se defiende en días. Un refactor bonito que rompe el arranque vale menos que cero.

Si una tarea de este archivo te parece riesgosa dado el estado del código que encuentres, **dilo y no la hagas**. Explicar por qué algo no conviene hacerse ahora es una respuesta válida y valiosa.
