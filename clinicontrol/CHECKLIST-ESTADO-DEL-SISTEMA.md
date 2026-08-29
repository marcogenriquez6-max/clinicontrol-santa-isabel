# CHECKLIST DEL SISTEMA — CliniControl
## Estado verificado el 29 de agosto de 2026

---

## RESUMEN

**Lo verificado está bien. Lo que falta verificar solo se puede probar en Windows.**

Desde aquí pude revisar el backend y la coherencia del frontend. La compilación del frontend, las pruebas y el arranque real necesitan su máquina: las herramientas de Node de este proyecto son binarios de Windows y no corren desde el puente.

| | Resultado |
|---|---|
| Verificado desde aquí | **9 de 9 correctos** |
| Pendiente de verificar en Windows | **5 puntos** |
| Problemas encontrados | **0** |
| Riesgo abierto | **1 — no hay punto de restauración en git** |

---

## A · VERIFICADO — TODO CORRECTO

- [x] **El backend compila sin errores.** `tsc --noEmit` sobre 37 módulos: salida 0.

- [x] **Los conjuntos de roles coinciden entre el menú y las rutas.** Comparé los seis (`TODOS`, `ADMISION`, `CLINICO`, `MEDICO`, `STAFF_PAC`, `GERENCIA`) entre `data/navigation.ts` y `routes/AppRoutes.tsx`: idénticos. Si difirieran, un usuario vería un ítem de menú que la ruta le negaría.

- [x] **El administrador está fuera de todo lo clínico.** Cero conjuntos clínicos lo incluyen. No puede registrar pacientes, ni atender consultas, ni ver historias.

- [x] **No hay enlaces rotos en el menú.** Cada `path` de `navigation.ts` tiene su `<Route>` correspondiente.

- [x] **Sucursales y MFA retirados de la interfaz.** Sin pantallas, sin rutas, sin llamadas a la API, sin entradas de menú.

- [x] **Las reglas de impresión están activas.** El bloque `@media print` existe en `index.css` y cubre los cuatro documentos.

- [x] **Cero colores crudos llamativos.** Ni un `violet`, `purple`, `fuchsia`, `cyan`, `teal`, `indigo`, `rose` o `pink` suelto en las 27 pantallas. Todo pasa por tokens.

- [x] **35 archivos de prueba en el backend**, incluidos los dos que sostienen el proyecto: seguridad farmacológica e inmutabilidad del expediente.

- [x] **Bug "N/A" de recetas corregido.** El contrato entre backend y frontend quedó alineado.

### Único resto, y es inofensivo

Quedan **4 referencias a `sucursal`**, todas en archivos de tipos (`types/cita.types.ts`, `types/sucursal.types.ts`, `types/index.ts`). Son declaraciones de TypeScript: no generan pantallas, ni rutas, ni llamadas a la API. Existen porque el backend conserva la columna `sucursal_id` a nivel de entidad, cosa que ya le expliqué. **No hay que tocarlas.**

---

## B · PENDIENTE DE VERIFICAR — CÓRRALO EN WINDOWS

Cinco comandos. Marque cada uno según el resultado.

```powershell
cd C:\Users\Equipo\ccpr\clinicontrol
```

- [ ] **1. El frontend compila**
  ```powershell
  cd frontend
  npx tsc -p tsconfig.app.json --noEmit
  ```
  Esperado: sin salida. Si aparecen errores, el primero es el que importa.

- [ ] **2. Las pruebas pasan**
  ```powershell
  cd ..\backend
  npm test
  ```
  Esperado: todas en verde. La última vez eran 328 de 330; los dos fallos eran de una prueba desactualizada que ya corregí. **Confirme que ahora pasan todas.**

- [ ] **3. El backend arranca**
  ```powershell
  npm run start:dev
  ```
  Esperado: `Nest application successfully started`. Con PostgreSQL corriendo primero.

- [ ] **4. El frontend arranca y se puede ingresar**
  ```powershell
  cd ..\frontend
  npm run dev
  ```
  Abrir el navegador, iniciar sesión, llegar al panel.

- [ ] **5. La prueba que decide su defensa**
  Entrar como médico → nueva receta → paciente **alérgico a penicilina** → prescribir **amoxicilina** → **debe saltar la alerta**.

  Si esto funciona, su aporte central funciona. Si no, es lo primero que hay que arreglar.

---

## C · PRUEBA FUNCIONAL COMPLETA — EL RECORRIDO ENTERO

Hágalo una vez de principio a fin. Es el mismo recorrido de la defensa.

- [ ] Ingresar como **recepcionista**
- [ ] Registrar un paciente nuevo
- [ ] Intentar registrar la **misma CI** otra vez → debe rechazarlo *(HU-02)*
- [ ] Agendar una cita
- [ ] Emitir un turno
- [ ] Ingresar como **enfermería** → registrar triaje ESI
- [ ] Ingresar como **recepcionista** → cobrar en caja
- [ ] Ingresar como **médico** → el paciente aparece en su cola
- [ ] Verificar que **solo aparecen sus pacientes**, no los de otro médico
- [ ] Atender: registrar consulta SOAP con diagnóstico CIE-10
- [ ] Prescribir → **verificar que salta la alerta de alergia**
- [ ] Imprimir la receta → *Guardar como PDF* → revisar que salga limpia
- [ ] Intentar editar una consulta de más de 24 h → debe rechazarlo
- [ ] Ingresar como **administrador** → confirmar que **no ve** Pacientes ni Historia Clínica
- [ ] Ingresar como **gerencia** → ver auditoría y arqueo
- [ ] Revisar el log de auditoría: debe estar todo lo anterior

---

## D · RIESGO ABIERTO — ATIÉNDALO HOY

- [ ] **No hay punto de restauración en git.**

  565 archivos modificados sin guardar; el último commit es anterior a todos estos cambios. Hoy no puede volver atrás sin perder también lo bueno.

  ```powershell
  cd C:\Users\Equipo\ccpr\clinicontrol
  git add -A
  git commit -m "Punto de restauracion antes de las mejoras finales"
  git tag punto-seguro
  ```

  ```powershell
  Copy-Item -Recurse -Force C:\Users\Equipo\ccpr C:\Users\Equipo\ccpr-COPIA-SEGURA
  ```

  **Dos minutos. Es lo más importante de todo este archivo.**

---

## E · LO QUE FALTA IMPLEMENTAR

Nada de esto impide defenderse. Están en orden de valor.

- [ ] Banda del paciente con alergias visibles al prescribir
- [ ] Cobro previo validado en el backend, con excepción E1/E2
- [ ] Guard de propiedad aplicado al endpoint de turnos
- [ ] Cronómetros de triaje en tiempo real
- [ ] Pruebas unitarias del frontend
- [ ] Revisión responsive a 375 / 768 / 1280 px

---

## F · COHERENCIA CON EL DOCUMENTO

Tres cosas que el documento podría mencionar y **no existen en el código**. Verifique y corrija el texto:

- [ ] **Módulo de Laboratorio** — no existe ningún módulo
- [ ] **Inventario con descuento de stock** — solo hay catálogo de medicamentos
- [ ] **Eventos de dominio** — no hay ninguno implementado

- [ ] **`backend/src/database/schema-unified.sql`** describe tablas que no existen en la base real. Muévalo a `_respaldo/`.

---

## VEREDICTO

**El sistema está en buen estado.** El backend compila limpio, la arquitectura es coherente, los roles están bien cerrados, la interfaz está unificada y las dos piezas que sostienen su tesis —seguridad farmacológica e inmutabilidad del expediente— están implementadas y con pruebas.

Lo que queda es de dos tipos: **verificaciones que solo puede hacer en su máquina** (sección B) y **mejoras que suman pero no deciden** (sección E).

La única acción urgente es la de la sección D. Hágala antes de seguir tocando código.

**No puedo afirmar que el sistema arranca ni que las pruebas pasan, porque desde aquí no pude ejecutarlos.** Eso lo confirma usted con los cinco comandos de la sección B.
