# CHECKLIST DE VERIFICACIÓN — para pegar a la IA
## CliniControl · "Revisá si ya está todo bien"

> ```
> cd C:\Users\Equipo\ccpr\clinicontrol
> opencode
> ```
> Pegue el bloque de abajo. La IA debe responder con **una tabla de OK / FALLA**, nada más.

---

## EL PROMPT — cópielo entero

```
Verificá esta lista punto por punto sobre el código de este proyecto.

REGLAS DE TU RESPUESTA:
- NO modifiques ningún archivo. Esto es solo verificación.
- Respondé con una tabla: N° | Qué se verifica | OK o FALLA | Evidencia (archivo:línea)
- Si algo FALLA, decí exactamente qué encontraste.
- Si no pudiste verificar un punto, poné "NO VERIFICADO" y por qué. No lo marques OK.
- No me felicites. Solo la tabla y, al final, una frase de veredicto.

=== A · COMPILACIÓN Y PRUEBAS ===
A1  El backend compila: cd backend && npx tsc -p tsconfig.json --noEmit → 0 errores
A2  El frontend compila: cd frontend && npx tsc -p tsconfig.app.json --noEmit → 0 errores
A3  Las pruebas pasan: cd backend && npm test → decime cuántas pasan de cuántas
A4  No hay imports de archivos que ya no existen

=== B · ROLES: LO QUE VE CADA UNO ===
B1  Los conjuntos TODOS, ADMISION, CLINICO, MEDICO, STAFF_PAC y GERENCIA son
    idénticos entre data/navigation.ts y routes/AppRoutes.tsx
B2  Ningún conjunto clínico (ADMISION, CLINICO, MEDICO, STAFF_PAC) incluye 'admin'
B3  Cada path del menú tiene su <Route> correspondiente en AppRoutes.tsx
B4  Cada <Route> protegida aparece en el menú de algún rol (no hay pantallas huérfanas)
B5  data/rbac.ts describe lo mismo que hacen navigation.ts y AppRoutes.tsx

=== C · ROLES: LO QUE PERMITE EL BACKEND ===
C1  paciente.controller.ts NO incluye 'admin' en @Roles
C2  consulta.controller.ts NO incluye 'admin' en @Roles
C3  receta.controller.ts NO incluye 'admin' en @Roles
C4  triage.controller.ts NO incluye 'admin' en @Roles
C5  cita.controller.ts NO incluye 'admin' en @Roles
C6  hospitalizacion.controller.ts NO incluye 'admin' en @Roles
C7  paciente.controller.ts SÍ incluye 'enfermeria' en los endpoints GET
C8  Todo controlador que maneja datos de pacientes tiene RolesGuard aplicado
C9  Para cada rol del frontend, el backend le permite lo mismo. Listá cualquier
    caso donde el menú muestre algo que la API rechazaría con 403

=== D · REGLAS CLÍNICAS ===
D1  El médico no puede atender un turno impago: la validación existe Y SE INVOCA
    en el cambio de estado a 'atencion' (no basta que el método esté definido)
D2  Existe la excepción para triaje E1 y E2, documentada con un comentario
D3  La excepción E1/E2 mira solo el triaje de HOY o el del turno actual, no todo
    el historial del paciente (un E1 de hace meses no debe eximir del pago hoy)
D4  El tablero de Consultas filtra por el médico de la sesión vía medico.usuarioId
D5  El OwnershipGuard está aplicado en el controlador de turnos
D6  Una consulta de más de 24 horas no se puede modificar (inmutabilidad)
D7  Solo el médico autor puede enmendar su propia consulta
D8  Cada enmienda queda en el log de auditoría con valor anterior y nuevo
D9  No existe ningún endpoint PUT, PATCH ni DELETE sobre el log de auditoría
D10 La verificación de alergias es por grupo farmacológico, no por texto:
    penicilina + amoxicilina debe disparar alerta

=== E · INTERFAZ ===
E1  BandaPaciente.tsx está montada en ConsultaCompletaPage, RecetasPage e
    HistoriaClinicaPage
E2  Cuando no hay alergias, muestra "Sin alergias registradas" y no un espacio vacío
E3  La columna Medicamentos de RecetasPage nunca muestra "N/A"
E4  index.css tiene el bloque @media print
E5  No hay colores crudos de Tailwind (violet, purple, fuchsia, cyan, teal,
    indigo, rose, pink) en ningún .tsx
E6  No queda ninguna referencia a MFA ni a Sucursales en pantallas, rutas o
    llamadas a la API (los archivos de tipos no cuentan)
E7  Ningún botón deshabilitado sin un texto que explique por qué
E8  Ningún mensaje de error dice solo "Error" sin explicar qué pasó

=== F · DATOS Y ARRANQUE ===
F1  Existe backend/.env con JWT_SECRET y JWT_REFRESH_SECRET
F2  .env está en .gitignore
F3  El seeder crea un usuario por cada uno de los seis roles
F4  El seeder crea al menos un paciente con alergia a penicilina
F5  Cada médico del seeder tiene su usuarioId vinculado (sin eso el tablero del
    médico no puede filtrar su cola)
F6  El seeder crea turnos en distintos estados y camas en los tres estados

=== G · COHERENCIA CON EL DOCUMENTO ===
G1  ¿Existe un módulo de Laboratorio? (esperado: NO)
G2  ¿Existe inventario de medicamentos con descuento de stock? (esperado: NO)
G3  ¿Existen eventos de dominio implementados? (esperado: NO)
G4  ¿Existe backend/src/database/schema-unified.sql y describe tablas que no
    están en las entidades? (si sí, hay que sacarlo)

=== H · RESPALDO ===
H1  ¿Hay cambios sin commitear? Decime cuántos archivos
H2  ¿Cuál es el último commit y de cuándo es?

Al final, una sola frase: ¿este sistema está listo para defenderse, sí o no, y
qué es lo único que falta si la respuesta es no?
```

---

## CÓMO LEER LA RESPUESTA

**Los puntos que no pueden fallar.** Si alguno da FALLA, arréglelo antes que cualquier otra cosa:

| Punto | Por qué es crítico |
|---|---|
| **A1 · A2** | Si no compila, no hay demostración |
| **D1** | La regla de cobro previo es la que usted pidió y va en el documento |
| **D10** | Es el aporte central de su tesis |
| **E2** | Un espacio vacío donde van las alergias es peligroso, no feo |
| **F1 · F5** | Sin `.env` no arranca; sin `usuarioId` el tablero del médico sale vacío |

**Los que pueden quedar en FALLA sin drama:** E7, E8, G1, G2, G3. Son mejoras o cosas a corregir en el documento, no en el código.

---

## SI LA IA CONTESTA MAL

Desconfíe si:

- **Marca todo OK sin dar evidencia.** Cada OK debe traer archivo y línea.
- **No encontró ni un solo FALLA.** Cuando yo revisé encontré dos problemas reales de permisos. Un sistema en desarrollo siempre tiene algo.
- **Dice "debería estar bien"** en vez de haber ejecutado el comando.
- **Marca A3 como OK sin dar el número** de pruebas que pasan.

En cualquiera de esos casos, respóndale:

> Volvé a verificar el punto X. Dame el archivo y la línea exactos, o decime que no lo pudiste verificar. No lo marques OK sin evidencia.
