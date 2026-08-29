# PROMPT DE DIAGNÓSTICO — ¿Cómo está realmente CliniControl?
## Para preguntar el estado del sistema sin que nadie le endulce la respuesta

> ```
> cd C:\Users\Equipo\ccpr\clinicontrol
> opencode
> ```
> Y pegar el **Prompt A**. Es de solo lectura: no cambia ni un archivo.

---

## PROMPT A — Diagnóstico completo *(el principal)*

```
Quiero un diagnóstico honesto del estado de este sistema. NO modifiques ningún
archivo: esto es solo lectura y reporte.

Soy el autor y lo defiendo en pocos días. Necesito saber la verdad, no que me
digas que está bien. Si algo está mal, dímelo con el archivo y la línea.

Ejecuta y reporta:

1. COMPILACIÓN
   cd backend && npx tsc -p tsconfig.json --noEmit
   cd ../frontend && npx tsc -p tsconfig.app.json --noEmit
   Reporta el número exacto de errores de cada uno.

2. PRUEBAS
   cd backend && npm test
   Reporta cuántas pasan, cuántas fallan, y el nombre de cada una que falla.

3. ARRANQUE
   ¿El backend levanta? ¿PostgreSQL está corriendo? ¿El puerto 3000 está libre?
   Si algo falla, dime el error exacto y cómo se arregla.

4. QUÉ FUNCIONA DE VERDAD
   Recorre los módulos y dime cuáles están completos (entidad + servicio +
   controlador + pantalla conectada) y cuáles están a medias. Una pantalla que
   existe pero no llama a la API cuenta como incompleta.

5. QUÉ ESTÁ ROTO
   Busca: llamadas a endpoints que no existen, campos que el frontend lee y el
   backend no envía, imports de archivos borrados, y promesas sin catch.

6. CÓDIGO MUERTO
   Componentes, servicios y exports que nadie importa.

FORMATO DE RESPUESTA: una tabla por sección. Sin adornos, sin felicitaciones.
Al final, un veredicto de una sola frase: ¿este sistema está listo para
defenderse o no?
```

---

## PROMPT B — Revisión rápida *(cuando tiene poco tiempo)*

```
Dime en 10 líneas cómo está este sistema: ¿compila el backend? ¿compila el
frontend? ¿pasan las pruebas? ¿arranca? ¿qué es lo más grave que encuentras?
No modifiques nada. Sé directo, no me digas que está bien si no lo está.
```

---

## PROMPT C — Ojos de tribunal *(el más útil antes de defender)*

```
Actúa como un miembro del tribunal que va a evaluar este proyecto de grado.
No eres mi asistente: eres quien tiene que encontrarle los agujeros.

Revisa el código de este sistema y dime las 5 preguntas más incómodas que le
harías al autor. Para cada una:
- La pregunta.
- Por qué es incómoda (qué debilidad real del código la origina).
- El archivo y la línea que la sustenta.
- Qué debería responder el autor para salir bien parado, sin mentir.

Sé exigente. Si el sistema tiene una debilidad, prefiero descubrirla hoy y no
el día de la defensa.
```

---

## PROMPT D — Coherencia entre documento y sistema

```
El documento de mi proyecto de grado está en C:\Users\Equipo\ccpr\DDDDDD.docx.
El sistema está en C:\Users\Equipo\ccpr\clinicontrol.

Sin modificar nada, dime qué afirma el documento que el código NO respalda.
Para cada contradicción: qué dice el documento, qué dice el código realmente, y
el archivo que lo prueba.

Es lo más peligroso que me puede pasar en la defensa: que el documento prometa
algo que el sistema no hace.
```

---

## PROMPT E — ¿Qué pasa si...? *(prueba de resistencia)*

```
Sin modificar nada, analiza este sistema y dime qué ocurre en cada uno de estos
escenarios. Si el sistema no lo maneja, dilo claramente:

1. Dos recepcionistas agendan el mismo médico a la misma hora.
2. Un médico intenta abrir la historia clínica de un paciente que no es suyo.
3. Se registra un paciente con una CI que ya existe.
4. Se prescribe amoxicilina a un paciente alérgico a la penicilina.
5. Alguien intenta modificar una consulta registrada hace un mes.
6. El médico llama a un paciente que no pagó.
7. Se intenta dar de alta a un paciente de una cama que está vacía.
8. Un turno de emergencia E1 llega cuando hay diez pacientes esperando.

Para cada uno: ¿el sistema lo impide, lo permite, o falla? Archivo y línea.
```

---

## CÓMO LEER LAS RESPUESTAS

**Señales de que le están diciendo la verdad:**

- Le dan números concretos: "0 errores", "328 de 330 pruebas", "3 componentes sin uso".
- Citan archivo y línea.
- Admiten lo que no pudieron probar.
- Le dicen cosas que no quería oír.

**Señales de alarma — no lo crea:**

- "Todo está funcionando correctamente" sin haber ejecutado nada.
- "Debería funcionar."
- Ninguna debilidad encontrada. **Todo sistema tiene debilidades.** Si le dicen que no hay ninguna, no lo revisaron.
- Felicitaciones antes que datos.

---

## LA PREGUNTA QUE MÁS LE CONVIENE HACER

Si solo va a usar una, use el **Prompt C**. Que alguien busque los agujeros de su sistema hoy, en su computadora y con tiempo para arreglarlos, es infinitamente mejor que descubrirlos frente al tribunal.

Un proyecto no se cae por tener debilidades. Se cae cuando el autor no sabía que las tenía.
