# CliniControl — Entrega

Este paquete contiene el **software** y el **documento** del prototipo tecnológico
para la Clínica **"Santa Isabel"** (Oruro, Bolivia): un sistema de información de
gestión integral con registro único de pacientes, historia clínica electrónica
longitudinal, agenda de citas, triaje ESI, hospitalización y seguridad
farmacológica.

## Contenido

| Elemento | Descripción |
|----------|-------------|
| `clinicontrol/` | Código fuente completo (backend NestJS, frontend React y base de datos). |
| `clinicontrol/GUIA-INSTALACION.md` | **Empiece aquí.** Guía paso a paso para instalar, ejecutar y cargar los datos. |
| `DOCUMENTO-CliniControl-APA7.docx` | Documento del proyecto en formato APA 7 (análisis, diseño, metodología Scrum, modelado y capturas). |

## Inicio rápido

Con **Node.js 20+** y **PostgreSQL** instalados, desde la carpeta `clinicontrol/`:

```bash
createdb -h localhost -U postgres clinicontrol   # crear la base de datos
cd backend && cp .env.example .env && cd ..       # configurar el backend
npm install                                        # instalar dependencias
npm run dev                                         # levantar backend + frontend
```

Luego abra **http://localhost:5173/** e inicie sesión como administrador:

- Usuario: `admin@clinica.com`
- Contraseña: `Admin123!`

La base de datos se crea y se llena **automáticamente** en el primer arranque con
los datos de demostración (6 usuarios por rol, catálogos, pacientes, un caso de
paciente recurrente con historial, camas, triajes y alergias).

> Para el detalle completo, otras credenciales y la solución de problemas,
> consulte **`clinicontrol/GUIA-INSTALACION.md`**.

## Nota sobre las dependencias

Por tamaño y portabilidad, el paquete **no incluye las carpetas `node_modules`**.
Se instalan automáticamente con `npm install`. Todo lo necesario para
reconstruirlas (`package.json` y `package-lock.json`) está incluido.
