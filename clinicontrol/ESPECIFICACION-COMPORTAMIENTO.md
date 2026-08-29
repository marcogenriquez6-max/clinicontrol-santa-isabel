# ASÍ DEBE COMPORTARSE CLINICONTROL
## Especificación de comportamiento — no es una pregunta, es una orden

> ```
> cd C:\Users\Equipo\ccpr\clinicontrol
> opencode
> ```
> Pegar: `Lee ESPECIFICACION-COMPORTAMIENTO.md. Esas reglas son obligatorias. Empieza por el Bloque 1, impleméntalo, verifica y repórtame. No avances al Bloque 2 sin mi aprobación.`

---

## INSTRUCCIÓN AL DESARROLLADOR

Lo que sigue no son sugerencias ni preguntas. Son **las reglas de negocio del sistema**. Tu trabajo es que el código las cumpla.

Para cada regla:
1. Verifica si ya se cumple. Si sí, dilo y pasa a la siguiente.
2. Si no se cumple, impleméntala.
3. Escribe una prueba unitaria que falle si alguien la rompe en el futuro.
4. Si una regla contradice algo que ya existe, **para y avísame** — no decidas solo.

Trabaja un bloque por vez. Verifica con `tsc` y `npm test` antes de seguir.

---

## BLOQUE 1 — SEGURIDAD DEL PACIENTE
*(máxima prioridad: aquí se juega la vida de alguien)*

**R1.** El sistema **debe** mostrar las alergias del paciente en pantalla, de forma permanente, mientras el médico redacta la consulta o prescribe una receta. No en un modal que se cierra: siempre visible.

**R2.** El sistema **debe** bloquear la prescripción de un medicamento al que el paciente es alérgico, y **debe** exigir una confirmación explícita con justificación escrita para continuar. No basta un aviso que se pueda ignorar con un clic.

**R3.** La verificación de alergias **debe** hacerse por grupo farmacológico y reactividad cruzada, nunca por coincidencia de texto. Un paciente alérgico a la penicilina **debe** disparar alerta ante amoxicilina, ampicilina y cefalosporinas.

**R4.** Cuando un paciente no tenga alergias registradas, el sistema **debe** decirlo explícitamente: *"Sin alergias registradas"*. Nunca **debe** dejar el espacio vacío, porque un espacio vacío se lee como "no revisé" y como "no tiene" a la vez.

**R5.** El sistema **debe** mostrar los signos vitales tomados en triaje dentro de la pantalla de consulta. El médico no **debe** tener que salir a buscarlos.

---

## BLOQUE 2 — EL PACIENTE NO SALTA PASOS

**R6.** Un médico **no debe** poder atender a un paciente que no pagó. El bloqueo **debe** estar en el backend, no solo en la interfaz.

**R7.** **Excepción obligatoria:** un paciente con triaje **E1 (Reanimación) o E2 (Emergencia)** **debe** poder ser atendido sin pago previo. Cobrar antes de atender una urgencia vital es una falta ética y legal. Esta excepción **debe** estar documentada en el código.

**R8.** El tablero del médico **debe** mostrar únicamente los pacientes asignados a él. Un médico **no debe** ver la cola de otro.

**R9.** Cuando una acción esté bloqueada, el sistema **debe** decir por qué. *"Pendiente de cobro en caja"* es correcto; un botón gris y mudo no lo es.

**R10.** Una cita agendada **debe** poder convertirse en turno con una sola acción cuando el paciente llega. Recepción **no debe** tener que volver a escribir los mismos datos.

---

## BLOQUE 3 — EL EXPEDIENTE ES UN DOCUMENTO MÉDICO-LEGAL

**R11.** Una nota clínica registrada **no debe** poder modificarse libremente. Fuera de la ventana de enmienda de 24 horas, el texto original es inmutable.

**R12.** Solo el médico que suscribió la consulta **debe** poder enmendarla. Otro profesional **debe** registrar una nota firmada a su nombre.

**R13.** Toda enmienda **debe** quedar en el log de auditoría con el valor anterior, el nuevo, quién la hizo y cuándo.

**R14.** El log de auditoría **no debe** poder editarse ni borrarse desde ninguna pantalla del sistema.

**R15.** Todo documento impreso **debe** llevar encabezado institucional, datos del paciente, y el nombre y matrícula del médico responsable. Un documento clínico sin firma identificable no tiene valor legal.

> Sustento: **Ley N° 3131** del Ejercicio Profesional Médico y **R.M. N° 0090**, Norma Nacional para el Manejo del Expediente Clínico.

---

## BLOQUE 4 — CADA ROL HACE LO SUYO Y NADA MÁS

**R16.** El **administrador** configura el sistema: usuarios, roles, catálogos. **No debe** registrar pacientes, atender consultas ni ver historias clínicas.

**R17.** **Gerencia** consulta indicadores, auditoría y arqueo. **Solo lectura**: no modifica transacciones ni datos médicos.

**R18.** **Recepción** registra pacientes, agenda citas y emite turnos. **No debe** ver diagnósticos ni marcar cobros por su cuenta.

**R19.** **Enfermería** clasifica el triaje, toma signos vitales y aplica vacunas. **No debe** emitir diagnósticos definitivos ni alterar tarifas.

**R20.** El **médico** atiende, prescribe e interna. **No debe** ver pacientes que no le fueron asignados.

**R21.** Estas restricciones **deben** aplicarse en el backend mediante guardas, no solo escondiendo botones en la interfaz.

---

## BLOQUE 5 — LA PRIORIDAD CLÍNICA MANDA SOBRE EL ORDEN DE LLEGADA

**R22.** La cola de atención **debe** ordenarse por nivel ESI primero y por hora de llegada después. Un E1 que acaba de llegar va antes que un E4 que espera hace dos horas.

**R23.** Los tiempos de espera **deben** calcularse en tiempo real, no mostrarse congelados.

**R24.** El sistema **debe** marcar visualmente a todo paciente que superó el tiempo máximo de su nivel: E1 inmediato, E2 diez minutos, E3 treinta, E4 sesenta, E5 ciento veinte.

---

## BLOQUE 6 — INTEGRIDAD DE LOS DATOS

**R25.** El sistema **no debe** permitir dos expedientes con la misma cédula de identidad.

**R26.** El sistema **no debe** permitir agendar al mismo médico en dos citas superpuestas.

**R27.** El sistema **no debe** permitir dar de alta a un paciente desde una cama vacía, ni internar en una cama ocupada o en mantenimiento.

**R28.** Una consulta **no debe** poder cerrarse sin diagnóstico registrado.

**R29.** Cuando una operación falle, el sistema **debe** explicar qué pasó y qué hacer. *"Error"* a secas no es un mensaje aceptable.

---

## BLOQUE 7 — CÓMO SE VE

**R30.** El color fuerte se reserva para la información clínica. Alertas, alergias y niveles ESI llevan color; los menús, botones y tarjetas van en tonos sobrios. Si todo grita, nada se escucha.

**R31.** El sistema **debe** funcionar a 375 px, 768 px y 1280 px. Ninguna página **debe** hacer scroll horizontal; las tablas anchas se desplazan dentro de su propio contenedor.

**R32.** Todo control **debe** tener estado de foco visible para navegación por teclado.

---

## CÓMO REPORTAR

Por cada regla:

```
REGLA: R<n>
ESTADO: [YA SE CUMPLÍA / IMPLEMENTADA / NO IMPLEMENTADA]
ARCHIVOS: <rutas completas>
PRUEBA: <archivo del test, o "sin prueba" y por qué>
VERIFICACIÓN: tsc [OK/FALLA] · tests [N/N]
```

**Si una regla no se pudo implementar, dilo.** No la marques como hecha. Un sistema con veinticinco reglas cumplidas y siete declaradas pendientes es defendible. Uno con treinta y dos declaradas y cinco mentidas, no.

---

## PRIORIDAD SI FALTA TIEMPO

| Orden | Bloque | Por qué |
|---|---|---|
| 1 | **Bloque 1** — Seguridad del paciente | Es el aporte central del proyecto |
| 2 | **Bloque 3** — Expediente médico-legal | Tiene sustento normativo boliviano explícito |
| 3 | **Bloque 2** — El paciente no salta pasos | Regla de negocio pedida por el autor |
| 4 | **Bloque 4** — Roles | Ya está casi completo |
| 5 | Bloques 5, 6 y 7 | Mejoran el sistema, no deciden la defensa |
