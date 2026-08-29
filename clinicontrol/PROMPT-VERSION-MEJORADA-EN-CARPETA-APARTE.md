# PROMPT — Construir la versión mejorada en una carpeta aparte
## CliniControl · El sistema que funciona no se toca

> ```
> cd C:\Users\Equipo\ccpr\clinicontrol
> opencode
> ```
> Pegar: `Lee PROMPT-VERSION-MEJORADA-EN-CARPETA-APARTE.md y ejecuta la FASE 0. Pará ahí y reportame antes de seguir.`

---

## LA IDEA

`frontend/` es el sistema que hoy funciona y es el que se defiende. **No se toca.**

Todo el trabajo de mejora se hace en `frontend-mejorado/`, una copia completa. Cuando una pantalla queda terminada y verificada allí, recién ahí se decide si pasa a la carpeta original.

**Por qué así:** ya se rompió `theme.css` una vez trabajando directo sobre el original. Con dos carpetas, el peor caso es perder la copia — nunca el sistema que va a proyectar el día de la defensa.

---

# FASE 0 · CREAR LA COPIA

```
Vas a crear una copia de trabajo del frontend. NO toques la carpeta frontend/
en ninguna de las fases siguientes.

PASO 1 — Copiar todo menos node_modules
Desde C:\Users\Equipo\ccpr\clinicontrol, en PowerShell:

  robocopy frontend frontend-mejorado /E /XD node_modules dist .vite

robocopy devuelve códigos 0 a 7 como éxito. Un código 8 o mayor es error real.

PASO 2 — Compartir las dependencias en vez de reinstalarlas
El npm de esta máquina ha dado error 403, así que NO ejecutes npm install.
En su lugar, creá un enlace a las dependencias que ya existen:

  cmd /c mklink /J frontend-mejorado\node_modules frontend\node_modules

Eso crea una unión de directorio: la copia usa las mismas dependencias sin
ocupar espacio ni descargar nada.

PASO 3 — Que las dos puedan correr a la vez
En frontend-mejorado/vite.config.ts, fijá el puerto 5174 para que no choque
con el original:

  server: { port: 5174 }

PASO 4 — Verificar que la copia compila ANTES de tocar nada

  cd frontend-mejorado
  npx tsc -p tsconfig.app.json --noEmit

Si da errores, la copia salió mal: borrala y repetí el paso 1.

PASO 5 — Confirmar que el verificador la reconoce

  cd ..
  node scripts/verificar-especificacion.cjs frontend-mejorado

REPORTAME:
- Cuántos archivos copió robocopy
- Si el enlace de node_modules funcionó
- El resultado de tsc
- El resultado del verificador (es el punto de partida contra el que vamos a
  medir el progreso)

PARÁ ACÁ. No sigas a la Fase 1 sin mi aprobación.
```

---

# FASE 1 · IMPLEMENTAR LA ESPECIFICACIÓN, PANTALLA POR PANTALLA

```
A partir de ahora trabajás EXCLUSIVAMENTE dentro de frontend-mejorado/.
Si en algún momento vas a escribir en frontend/, PARÁ y avisame.

Leé ESPECIFICACION-PANTALLAS-Y-BOTONES.md. Implementá UNA pantalla por vez,
en este orden:

  1. ConsultaCompletaPage    (pantalla 8 — la banda de alergias)
  2. RecetasPage             (pantalla 9 — el aporte central)
  3. ConsultasPage           (pantalla 7 — la regla de cobro previo)
  4. TurnosPage              (pantalla 4)
  5. CajaPage                (pantalla 5)
  6. TriajePage              (pantalla 6)
  7. El resto, en el orden del documento

POR CADA PANTALLA, EL CICLO ES:

  a) Leé el archivo completo antes de tocarlo.
  b) Compará control por control contra la tabla de la especificación.
  c) Implementá lo que falte. Respetá el texto EXACTO de cada mensaje: están
     escritos así a propósito.
  d) Verificá:
       cd frontend-mejorado && npx tsc -p tsconfig.app.json --noEmit
       cd .. && node scripts/verificar-especificacion.cjs frontend-mejorado
  e) Reportame con el formato de abajo.
  f) Esperá mi aprobación antes de la siguiente pantalla.

FORMATO DE REPORTE:

  PANTALLA: <nombre> — frontend-mejorado/src/pages/<archivo>
  CONTROLES DE LA ESPECIFICACIÓN: N
  YA CUMPLÍAN: <lista>
  IMPLEMENTADOS AHORA: <lista>
  NO IMPLEMENTADOS: <lista y por qué>
  MENSAJES DE ERROR: [todos específicos / quedan N genéricos]
  BOTONES BLOQUEADOS SIN EXPLICACIÓN: N
  VERIFICACIÓN: tsc [OK/FALLA] · verificador [N incumplimientos]
  DIFERENCIA CON frontend/: <qué archivos quedaron distintos>

REGLAS QUE NO SE NEGOCIAN:

  - Nunca reescribas theme.css entero. Solo líneas puntuales. Si el conteo de
    tokens de color baja de 195, rompiste algo.
  - Los archivos son CRLF. Normalizá \r\n a \n antes de comparar texto y
    restaurá al escribir, o tus reemplazos van a fallar en silencio.
  - No instales dependencias. El npm da 403.
  - Solo tokens del tema. Ningún color crudo de Tailwind.
  - Ningún texto por debajo de 12px. Datos clínicos, mínimo 14px.
  - Ningún mensaje que diga solo "Error".
```

---

# FASE 2 · COMPARAR LAS DOS CARPETAS

```
Cuando termines las pantallas, quiero ver la diferencia completa antes de
decidir nada.

PASO 1 — Listado de archivos distintos

  cd C:\Users\Equipo\ccpr\clinicontrol
  fc /L frontend\src\pages\ConsultaCompletaPage.tsx frontend-mejorado\src\pages\ConsultaCompletaPage.tsx

O mejor, generá un diff completo con git:

  git diff --no-index --stat frontend/src frontend-mejorado/src

PASO 2 — Verificar las dos y comparar

  node scripts/verificar-especificacion.cjs frontend
  node scripts/verificar-especificacion.cjs frontend-mejorado

PASO 3 — Reportame una tabla:

  | Medida | frontend | frontend-mejorado |
  |---|---|---|
  | Incumplimientos del verificador | N | N |
  | Errores de tsc | N | N |
  | Archivos modificados | — | N |
  | Pantallas que cumplen la especificación | N de 27 | N de 27 |

PARÁ ACÁ. La decisión de reemplazar es mía, no tuya.
```

---

# FASE 3 · EL CAMBIO — SOLO CUANDO YO LO DIGA

```
NO ejecutes esta fase por tu cuenta. Solo cuando yo te lo pida explícitamente.

REQUISITOS ANTES DE CAMBIAR:
  1. frontend-mejorado compila con 0 errores
  2. El verificador da 0 incumplimientos sobre frontend-mejorado
  3. El sistema levantó y se probó a mano en el puerto 5174
  4. Hay un commit del estado actual

PROCEDIMIENTO:

  cd C:\Users\Equipo\ccpr
  git add -A
  git commit -m "Antes de reemplazar frontend por la version mejorada"
  git tag antes-del-cambio

  cd clinicontrol
  ren frontend frontend-anterior
  ren frontend-mejorado frontend

  cd frontend
  npx tsc -p tsconfig.app.json --noEmit
  npm run dev

Si algo falla, se vuelve atrás en dos comandos:

  cd C:\Users\Equipo\ccpr\clinicontrol
  ren frontend frontend-mejorado
  ren frontend-anterior frontend

frontend-anterior NO se borra hasta después de la defensa.
```

---

# LO QUE HAY QUE SABER ANTES DE EMPEZAR

**Dos carpetas significan dos versiones que se separan.** Cada corrección que haga en una y no en la otra las aleja. Por eso el orden importa: primero se termina la copia, después se compara, y recién al final se cambia. No se trabaja en las dos a la vez.

**El estado actual de `frontend/` conviene revisarlo antes de copiar.** Si la carpeta volvió a una versión anterior, la copia va a arrastrar esa versión — y entonces estaría mejorando un punto de partida viejo. Vale la pena confirmar qué contiene antes de la Fase 0:

```powershell
cd C:\Users\Equipo\ccpr\clinicontrol
findstr /C:"--" frontend\src\styles\theme.css | find /C ":"
dir frontend\src\components\clinico
findstr /C:"@media print" frontend\src\index.css
```

Si `theme.css` no tiene alrededor de 195 tokens, si no está `BandaPaciente.tsx`, o si no aparece `@media print`, la carpeta está en un estado anterior al último trabajo verificado. En ese caso conviene recuperar primero y copiar después:

```powershell
cd C:\Users\Equipo\ccpr
git checkout punto-seguro -- clinicontrol/
```

**Y una alternativa que quizá le sirva más:** lo mismo se logra con una rama de git, sin duplicar carpetas ni enlazar dependencias.

```powershell
git checkout -b mejoras
```

Se trabaja normal, y si sale mal `git checkout main` devuelve todo. Es menos pasos y no hay dos copias que mantener. La carpeta aparte tiene una ventaja real igual: puede tener las dos corriendo a la vez, una en el puerto 5173 y otra en el 5174, y compararlas en pantalla.

Elija la que le resulte más cómoda de entender. La que se entiende es la que se usa bien.
