# PROMPT DE EMERGENCIA — Cuando algo se rompe
## CliniControl · Qué hacer si el sistema deja de arrancar

> **Este archivo se lee cuando algo falla.** Guárdelo abierto los días previos a la defensa.

---

# ⚠ PRIMERO: HAGA ESTO HOY, ANTES QUE NADA

Su repositorio tiene **565 archivos modificados sin guardar** y ningún punto de restauración reciente. El último commit es `f616936 docs: corrige credenciales demo en el README`.

**Eso significa que hoy usted no puede volver atrás.** Si OpenCode rompe algo mañana, `git checkout` le borraría también todo lo bueno, porque no hay forma de separar lo uno de lo otro.

Ejecute esto **ahora**, en PowerShell:

```powershell
cd C:\Users\Equipo\ccpr\clinicontrol
git add -A
git commit -m "Punto de restauracion antes de las mejoras finales"
git tag punto-seguro
```

Con eso, en cualquier momento puede volver aquí:

```powershell
git reset --hard punto-seguro
```

**Y una copia fuera de git, por si acaso:**

```powershell
Copy-Item -Recurse -Force C:\Users\Equipo\ccpr C:\Users\Equipo\ccpr-COPIA-SEGURA
```

Un proyecto de grado se pierde una sola vez. Dos minutos ahora valen más que todo lo demás en este archivo.

> **Nota técnica:** buena parte de esos 565 archivos cambiaron solo en los fines de línea (CRLF ↔ LF), no en su contenido. Archivos como `backend/.prettierrc`, que nadie editó, aparecen modificados por completo. No es un daño, pero sí es la razón por la que hoy no puede distinguir un cambio real de ruido — y por la que necesita ese commit.

---

# 1 · EL SISTEMA NO ARRANCA — DIAGNÓSTICO EN ORDEN

Recorra esta lista **en este orden**. Son los errores reales que ya aparecieron en este proyecto.

## Error: `ECONNREFUSED 127.0.0.1:5432`
**PostgreSQL está apagado.**

```powershell
Get-Service -Name "postgresql*"
Start-Service -Name "postgresql-x64-15"
Set-Service -Name "postgresql-x64-15" -StartupType Automatic
```

La última línea hace que arranque solo al encender la máquina. Hágalo: no quiera acordarse de esto el día de la defensa.

## Error: `EADDRINUSE :::3000`
**Quedó un proceso node zombi ocupando el puerto.**

```powershell
Get-Process node | Stop-Process -Force
```

## Error: `JWT_REFRESH_SECRET is required`
**Falta el archivo `backend/.env`.** Está en `.gitignore`, así que no viaja con el repositorio. Si desapareció, hay que regenerarlo con las dos claves y los datos de conexión a la base.

## Error: `no existe la base de datos hospital_db`

```powershell
psql -U postgres -c "CREATE DATABASE hospital_db;"
```

## Error: 404 en `/auth/login`
**El backend no está corriendo.** El frontend arranca igual y parece funcionar hasta que intenta iniciar sesión. Levante el backend primero, siempre.

## Orden correcto de arranque

```powershell
# 1. PostgreSQL corriendo (verificar con Get-Service)
# 2. Terminal 1:
cd C:\Users\Equipo\ccpr\clinicontrol\backend
npm run start:dev

# 3. Esperar a ver "Nest application successfully started"
# 4. Terminal 2:
cd C:\Users\Equipo\ccpr\clinicontrol\frontend
npm run dev
```

---

# 2 · PROMPT PARA CUANDO ALGO SE ROMPIÓ

```
El sistema dejó de funcionar. Necesito que lo diagnostiques y lo arregles, pero
con cuidado: mi proyecto de grado se defiende en días.

REGLAS:
1. NO hagas cambios grandes. Encuentra la causa exacta y arregla solo eso.
2. Antes de modificar cualquier archivo, dime qué vas a cambiar y por qué.
3. Si la causa es un cambio reciente, prefiero revertir ese cambio antes que
   escribir código nuevo encima.

DIAGNOSTICA EN ESTE ORDEN:

1. ¿Compila?
   cd backend && npx tsc -p tsconfig.json --noEmit
   cd ../frontend && npx tsc -p tsconfig.app.json --noEmit
   Si hay errores, dame el primero completo con archivo y línea. Un solo error
   de tipos puede generar cincuenta mensajes: el primero es el que importa.

2. ¿Qué cambió?
   git status --short
   git diff --stat
   Dime qué archivos se tocaron desde el último commit.

3. ¿El error viene de un cambio reciente?
   Compara el archivo que falla contra su versión en el último commit:
   git diff <archivo>

4. ¿Falta un import o un provider?
   Los errores de NestJS del tipo "Nest can't resolve dependencies" casi siempre
   significan que un servicio nuevo no se registró en el módulo. Búscalo ahí.

REPORTA:
CAUSA: <la causa real, no el síntoma>
ARCHIVO: <cuál>
SOLUCIÓN PROPUESTA: <qué harías>
RIESGO: <qué más podría afectar>

Y espera mi aprobación antes de tocar nada.
```

---

# 3 · CÓMO REVERTIR

## Deshacer el último cambio de un archivo

```powershell
git checkout -- ruta\del\archivo.ts
```

## Volver al punto seguro completo

```powershell
git reset --hard punto-seguro
```

## Recuperar de los respaldos que ya existen en el proyecto

| Carpeta | Qué tiene |
|---|---|
| `frontend\_fuera-de-alcance\` | Las pantallas de Sucursales y MFA, y las 8 versiones previas de los archivos editados |
| `backend\_fuera-de-alcance\` | Los 3 módulos originales antes de desregistrar los controladores |
| `frontend\_respaldo-diseno\` | Las 11 versiones previas a los cambios de diseño |

Para restaurar uno, cópielo encima del original.

## Si nada funciona

```powershell
Remove-Item -Recurse -Force C:\Users\Equipo\ccpr\clinicontrol
Copy-Item -Recurse C:\Users\Equipo\ccpr-COPIA-SEGURA\clinicontrol C:\Users\Equipo\ccpr\
```

Esto solo sirve si hizo la copia de la primera sección. **Hágala.**

---

# 4 · REGLA PARA LOS DÍAS PREVIOS

**Commit después de cada mejora que funcione.**

```powershell
git add -A
git commit -m "Banda del paciente con alergias"
```

Así, si el cambio siguiente rompe algo, retrocede uno solo y no un día entero de trabajo.

**Y una regla más dura:** desde 48 horas antes de la defensa, **no acepte ningún cambio nuevo**. Ni uno. El sistema que va a defender es el que funciona hoy, no el que podría funcionar mejor mañana.

La mayoría de los desastres en proyectos de grado no vienen de que faltara una funcionalidad. Vienen de un último cambio "rápido" la noche anterior.

---

# 5 · LISTA DE VERIFICACIÓN — LA NOCHE ANTES

Marque cada punto. Si alguno falla, arréglelo esa noche, no en la mañana.

- [ ] PostgreSQL configurado en arranque automático
- [ ] `backend/.env` existe y tiene las dos claves JWT
- [ ] La base `hospital_db` existe y tiene datos del seeder
- [ ] Backend levanta sin errores
- [ ] Frontend levanta sin errores
- [ ] Ingreso correcto con los seis roles — credenciales anotadas en papel
- [ ] Existe un paciente con alergia a penicilina cargado
- [ ] La alerta de amoxicilina funciona: **probada esa misma noche**
- [ ] Los documentos imprimen bien: probar "Guardar como PDF" de verdad
- [ ] Un commit final con todo funcionando y su etiqueta
- [ ] La copia de seguridad en `ccpr-COPIA-SEGURA` actualizada
- [ ] Batería cargada, cargador en la mochila
- [ ] El sistema probado **sin internet**, por si la sala no tiene red

---

# 6 · SI FALLA EL DÍA DE LA DEFENSA

Pasa, y no es el fin.

1. **No se disculpe tres veces.** Una basta.
2. Diga qué está fallando en términos técnicos concretos: *"El servicio de base de datos no levantó"* suena a alguien que entiende su sistema. *"No sé qué pasó"* no.
3. Tenga el proyecto **abierto en el editor** como plan B: puede mostrar y explicar el código del motor de seguridad farmacológica y de la inmutabilidad del expediente sin que el sistema esté corriendo.
4. Tenga **capturas de pantalla** de los flujos principales, tomadas la noche anterior con todo funcionando.

Un sistema que no arranca por un servicio apagado no invalida un año de trabajo. Un autor que no sabe explicar su propio sistema, sí.
