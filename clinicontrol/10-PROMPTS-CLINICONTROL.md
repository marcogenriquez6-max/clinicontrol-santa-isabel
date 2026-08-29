# 10 PROMPTS PARA MEJORAR CLINICONTROL
## Uno a la vez, en este orden. Copiar y pegar en OpenCode.

> **Antes de empezar, siempre:**
> ```
> cd C:\Users\Equipo\ccpr\clinicontrol
> opencode
> ```
>
> **Regla de oro:** un prompt, verificar, y recién el siguiente. Si mezcla dos, cuando algo se rompa no va a saber cuál lo rompió.
>
> **Verificación después de cada uno:**
> ```
> cd backend && npx tsc -p tsconfig.json --noEmit && npm test
> cd ../frontend && npx tsc -p tsconfig.app.json --noEmit
> ```

---

## PROMPT 1 — Banda del paciente con alergias visibles
**Por qué primero:** hoy el médico prescribe sin ver las alergias en pantalla. En un sistema clínico real eso es lo más grave que hay. Es también lo que más se nota en una demostración.

```
Crea el componente frontend/src/components/clinico/BandaPaciente.tsx: una franja
fija en la parte superior con nombre completo, CI, edad, sexo, grupo sanguíneo y
las alergias del paciente destacadas en rojo. Si no hay alergias registradas debe
decir explícitamente "Sin alergias registradas", nunca quedar vacío.

Móntala en ConsultaCompletaPage.tsx, HistoriaClinicaPage.tsx y RecetasPage.tsx.

Usa únicamente los tokens CSS existentes (var(--danger-500), var(--text-primary),
var(--bg-card), var(--border-primary)). No uses clases de color crudas de Tailwind.
Lee primero uno de esos archivos para respetar el estilo del proyecto.

Al terminar dime qué archivos modificaste y si compila.
```

---

## PROMPT 2 — El médico no atiende sin pago (con excepción de emergencias)
**Por qué:** es la regla de negocio que usted mismo pidió. Hoy solo la valida el frontend; la API no.

```
En el servicio de turnos del backend, al cambiar el estado de un turno a 'atencion',
valida que el turno esté pagado. Si no lo está, lanza ConflictException con un
mensaje claro para el usuario.

EXCEPCIÓN OBLIGATORIA: los turnos con triaje nivel E1 (Reanimación) y E2
(Emergencia) deben poder atenderse SIN pago previo. Es una urgencia vital y cobrar
primero sería una falta ética y legal. Documenta esa excepción con un comentario
en el código explicando el fundamento.

Escribe pruebas unitarias que cubran: turno pagado pasa, turno impago se rechaza,
turno impago con ESI E1 pasa, turno impago con ESI E2 pasa, turno impago con E3 se
rechaza.
```

---

## PROMPT 3 — Cerrar el acceso a turnos ajenos en el backend
**Por qué:** el tablero ya filtra por médico, pero solo en la interfaz. Con el token de un médico, la API todavía devuelve todos los turnos.

```
El archivo backend/src/common/guards/ownership.guard.ts ya existe y está aplicado
en el controlador de consultas. Aplícalo también al controlador de turnos para que
GET /turnos devuelva únicamente los turnos del médico autenticado.

Los usuarios con rol admin, gerente, recepcionista y secretaria deben seguir viendo
todos los turnos: la restricción aplica solo al rol medico.

Lee primero cómo está usado en consulta.controller.ts y sigue el mismo patrón.
```

---

## PROMPT 4 — Cronómetros de triaje en tiempo real
**Por qué:** hoy todos los pacientes muestran "2 h 43 min · superó tiempo máximo", el mismo valor congelado. Eso se nota en una demostración y deja mal.

```
En la pantalla de Triaje, los tiempos de espera están estáticos. Calcúlalos en
tiempo real comparando la hora actual contra la hora de registro del triaje, y
actualízalos cada 30 segundos con un intervalo que se limpie al desmontar el
componente.

Ordena la lista por prioridad clínica: primero por nivel ESI (E1 antes que E2,
antes que E3...) y dentro del mismo nivel por hora de llegada. Un E1 que acaba de
llegar va antes que un E4 que espera hace dos horas.

Marca visualmente al paciente que superó su tiempo máximo según su nivel:
E1 inmediato, E2 diez minutos, E3 treinta, E4 sesenta, E5 ciento veinte.
```

---

## PROMPT 5 — Mapa de camas interactivo
**Por qué:** la lista de camas es texto plano. Un mapa visual es lo que usan los sistemas hospitalarios reales y se ve muy bien proyectado.

```
Reemplaza el listado de camas de HospitalizacionPage.tsx por una cuadrícula
agrupada por sala (Medicina Interna, Pediatría, Ginecología, Cirugía, Observación).

Cada cama es una tarjeta según su estado:
- Libre: borde verde sobrio, botón "Ingresar paciente".
- Ocupada: muestra nombre del paciente, médico tratante, diagnóstico y días de
  estancia, con botones "Nota de evolución" y "Alta médica".
- En mantenimiento: gris, no seleccionable.

Usa los tokens del sistema, no colores crudos. Mantén intactas las llamadas a la
API que ya existen: solo cambia la presentación.
```

---

## PROMPT 6 — Punto de cobro de caja
**Por qué:** usted dijo que caja está fea, y es la pantalla que conecta admisión con la atención médica.

```
Rediseña CajaPage.tsx en dos columnas:
- Izquierda: datos del paciente y desglose del servicio con el detalle de lo que
  se cobra.
- Derecha: método de pago (efectivo, tarjeta, QR), monto recibido y cálculo
  automático del vuelto.

El modal de apertura de caja debe validar que el fondo inicial sea un número
positivo antes de permitir abrir.

Usa font-variant-numeric: tabular-nums en todos los montos para que las cifras
queden alineadas en columna. Usa los tokens existentes del tema.
```

---

## PROMPT 7 — Emisión de turno como asistente por pasos
**Por qué:** hoy es un formulario largo donde se ven doce servicios y cinco médicos de golpe. Un asistente guiado se entiende solo.

```
Convierte la emisión de turno en TurnosPage.tsx en un asistente de tres pasos con
indicador de progreso:

Paso 1: buscar paciente por CI o nombre, con búsqueda reactiva.
Paso 2: elegir servicio y médico, mostrando disponibilidad del médico
        (Disponible / En consulta / No disponible).
Paso 3: confirmación con el resumen y el total a cobrar, y emisión del ticket.

No se puede avanzar de paso sin completar el anterior. Mantén el ticket imprimible
que ya existe.
```

---

## PROMPT 8 — Documentos clínicos impresos con encabezado institucional
**Por qué:** las reglas de impresión ya están en index.css. Falta que los documentos tengan forma de documento médico-legal.

```
En frontend/src/index.css ya existen las reglas @media print que aíslan el
documento. Ahora normaliza las cuatro plantillas imprimibles (receta, historia
clínica, consulta y ticket de turno) para que todas tengan la misma estructura:

Encabezado: nombre de la clínica, dirección, teléfono y NIT.
Cuerpo: datos del paciente (nombre, CI, edad, fecha), y el contenido del documento
        en una cuadrícula ordenada.
Pie: nombre y matrícula profesional del médico, y espacio para firma y sello.

No instales ninguna librería nueva. Con las reglas @media print y "Guardar como
PDF" del navegador el resultado ya es un PDF vectorial válido.
```

---

## PROMPT 9 — Eliminar código muerto y archivos que mienten
**Por qué:** si el tribunal abre `schema-unified.sql` ve tablas que no existen en la base real. Eso destruye credibilidad.

```
Busca y reporta ANTES de tocar nada:

1. backend/src/database/schema-unified.sql describe tablas que no existen en la
   base real (grupo_farmacologico, principio_activo, contraindicacion). La base la
   crea TypeORM con synchronize desde las entidades. Muévelo a _respaldo/.

2. Componentes en frontend/src/components/ui/ que ningún archivo importa.
3. Exports en frontend/src/api/services.ts que ningún componente consume.
4. Reglas CSS sin uso en index.css y styles/theme.css.

Regla: nada se borra, todo se mueve a _respaldo/. Reporta cada archivo con su
número de referencias (debe ser 0) y dónde quedó la copia. Recompila después de
cada tanda.
```

---

## PROMPT 10 — Pruebas del frontend y modo estricto
**Por qué:** el backend tiene pruebas, el frontend ninguna. Es la pregunta fácil del tribunal.

```
PRIMERO: revisa si vitest está instalado en frontend/package.json. Si NO está,
PARA y avísame antes de instalar nada — el npm de esta máquina ha dado error 403.

Si está disponible, escribe pruebas para:
- store/authStore.ts: login exitoso, login fallido, logout limpia la sesión.
- El filtro por médico de ConsultasPage: que solo devuelva turnos pagados del
  médico autenticado.
- data/rbac.ts: que ningún rol clínico incluya a admin.

Después, activa "strict": true en tsconfig.app.json y reporta cuántos errores
aparecen. NO los corrijas todos de golpe: dame el número y los diez más
importantes primero.
```

---

## CÓMO SABER SI VA BIEN

Después de cada prompt, exija este reporte. Si no se lo dan, pídalo:

```
ARCHIVOS MODIFICADOS: <rutas completas>
QUÉ CAMBIÓ: <dos o tres líneas>
VERIFICACIÓN: tsc backend [OK/FALLA] · tsc frontend [OK/FALLA] · tests [N/N]
NO VERIFICADO: <lo que no se pudo probar y por qué>
```

**Si le dicen que algo funciona sin haberlo ejecutado, no lo crea.** Pida que lo corran.

---

## SI SE LE ACABA EL TIEMPO

Si solo alcanza a hacer tres, haga estos y deje el resto:

**1, 2 y 9.**

- El **1** es lo que más se ve y lo más importante clínicamente.
- El **2** es una regla de negocio real y bien argumentada, con la excepción de emergencias que se defiende sola.
- El **9** elimina un archivo que puede costarle credibilidad si alguien lo abre.

Los otros siete son mejoras de presentación. Importan, pero ninguno decide una defensa.
