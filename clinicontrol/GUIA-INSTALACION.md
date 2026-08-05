# CliniControl — Guía de Instalación y Ejecución

Sistema de información de gestión integral para la Clínica **"Santa Isabel"**
(Oruro, Bolivia): registro único de pacientes, historia clínica electrónica
longitudinal, agenda de citas, triaje ESI, hospitalización y seguridad
farmacológica.

Esta guía explica, paso a paso, cómo instalar el sistema, levantarlo y cargar la
base de datos con los datos de demostración. La **semilla de datos es
automática**: en el primer arranque el sistema crea el esquema y lo llena solo.

---

## 1. Arquitectura y stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 19 · Vite · React Router · Zustand · Tailwind CSS |
| Backend | NestJS 11 · TypeORM 0.3 · JWT/Passport · Arquitectura Hexagonal |
| Base de datos | PostgreSQL (esquema autogenerado con TypeORM) |

El esquema de la base de datos y los datos de demostración se generan
**automáticamente** desde el código (`DB_SYNC=true` crea las tablas y
`RUN_SEED=true` ejecuta la semilla), por lo que **no es necesario ejecutar
scripts SQL manualmente**.

---

## 2. Requisitos previos

- **Node.js 20 o superior** y **npm 10+**.
- **PostgreSQL 14 o superior** instalado y en ejecución en el puerto `5432`.
- (Opcional) **Redis**, solo si desea habilitar el caché; el sistema funciona sin él.

> Nota importante: el paquete **no incluye las carpetas `node_modules`** (pesan
> cientos de MB y dependen del sistema operativo). Se instalan con `npm install`,
> como se indica abajo.

---

## 3. Instalación

### 3.1 Crear la base de datos

Con PostgreSQL en ejecución en `localhost:5432` (usuario `postgres`):

```bash
createdb -h localhost -U postgres clinicontrol
```

> Si `createdb` no está disponible, use:
> `psql -h localhost -U postgres -c "CREATE DATABASE clinicontrol;"`

No hace falta cargar ninguna tabla: el backend las crea solo en el primer arranque.

### 3.2 Configurar el backend

```bash
cd backend
cp .env.example .env      # el .env ya viene listo para localhost:5432
```

Abra el archivo `backend/.env` y verifique que `DB_USERNAME` y `DB_PASSWORD`
coincidan con su instalación de PostgreSQL (por defecto `postgres` / `postgres`).

### 3.3 Instalar dependencias

Desde la carpeta raíz del proyecto (`clinicontrol/`), que usa **workspaces de
npm**, un solo comando instala el backend y el frontend:

```bash
npm install
```

---

## 4. Ejecución

Desde la carpeta raíz del proyecto (`clinicontrol/`):

```bash
npm run dev
```

Este comando levanta **el backend y el frontend a la vez**. En el **primer
arranque**, el backend crea el esquema de la base de datos y ejecuta la semilla
(catálogos, usuarios, pacientes, camas, triajes y alergias); en la consola verá
el listado de credenciales sembradas.

| Servicio | URL |
|----------|-----|
| Aplicación (frontend) | http://localhost:5173/ |
| API (backend) | http://localhost:3000/ |

> Alternativamente puede ejecutar cada parte por separado:
> `npm run backend` (puerto 3000) y, en otra terminal, `npm run frontend`
> (puerto 5173). El frontend redirige automáticamente las llamadas de la API al
> backend.

### 4.1 Reiniciar con datos limpios

La semilla solo se ejecuta cuando la base está vacía. Para volver a empezar de
cero, borre y vuelva a crear la base de datos:

```bash
dropdb -h localhost -U postgres clinicontrol
createdb -h localhost -U postgres clinicontrol
npm run dev
```

---

## 5. Credenciales de acceso

Sembradas automáticamente en el primer arranque. **Cambiar en producción.**

| Rol | Correo | Contraseña |
|-----|--------|-----------|
| Administrador | `admin@clinica.com` | `Admin123!` |
| Gerente | `gerente@clinica.com` | `123456` |
| Secretaria | `secretaria@clinica.com` | `123456` |
| Recepcionista | `recepcion@clinica.com` | `123456` |
| Médico | `medico@clinica.com` | `123456` |
| Enfermería | `enfermeria@clinica.com` | `123456` |

Cada rol ve un menú distinto (control de acceso por roles, RBAC): el
administrador tiene acceso total; la recepcionista registra y busca pacientes y
agenda citas; el médico atiende desde su lista de citas, registra la consulta
(SOAP + CIE-10) y receta con alertas de seguridad; enfermería realiza el triaje.

---

## 6. Verificación rápida

1. Abra la aplicación e inicie sesión como **recepcionista**.
2. En **Pacientes**, intente registrar un paciente con una Cédula de Identidad
   ya existente: el sistema **impide el duplicado** (problema central resuelto).
3. Busque al paciente **Juan Pérez** y abra su **Historia Clínica**: verá varias
   consultas en distintas fechas (paciente recurrente con historial longitudinal).
4. Inicie sesión como **médico** (`medico@clinica.com`), abra una consulta y
   recete un medicamento al que el paciente es alérgico: aparece la **alerta de
   seguridad farmacológica**.
5. Como **enfermería**, registre un **triaje** con un nivel de severidad ESI.

---

## 7. Contenido del paquete

```
clinicontrol/
├── backend/            Código NestJS (sin node_modules — se instalan con npm)
│   └── .env.example    Plantilla de configuración (copiar a .env)
├── frontend/           Código React + Vite (sin node_modules)
├── database/           Esquema SQL de referencia (no requerido: TypeORM lo genera)
├── infrastructure/     Configuración de Docker (opcional, para despliegue)
├── package.json        Workspaces de npm (backend + frontend)
└── GUIA-INSTALACION.md Este documento
```

---

## 8. Problemas frecuentes

| Síntoma | Causa | Solución |
|---------|-------|----------|
| El login falla o no hay usuarios | La semilla no se ejecutó | Borre y recree la base (paso 4.1); revise `RUN_SEED=true` en `.env` |
| El backend no conecta a la base | PostgreSQL apagado o credenciales incorrectas | Verifique Postgres en `:5432` y `DB_USERNAME`/`DB_PASSWORD` en `backend/.env` |
| Error de binarios al iniciar el frontend | `node_modules` de otro sistema operativo | Borre `node_modules` y repita `npm install` |
| El puerto 3000 o 5173 está ocupado | Otro proceso lo usa | Libere el puerto o cambie `PORT` en `backend/.env` |
| Quiero empezar de cero | La base tiene datos viejos | Ejecute el paso 4.1 (dropdb + createdb) |

---

*CliniControl — Prototipo tecnológico. La documentación completa del proyecto
(análisis, diseño, metodología Scrum, modelado y capturas) se encuentra en el
documento adjunto `DOCUMENTO-CliniControl-APA7.docx`.*
