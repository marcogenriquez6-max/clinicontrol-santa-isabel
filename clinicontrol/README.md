# CliniControl - Sistema de Gestión Hospitalaria

Sistema web full-stack para la digitalización de procesos asistenciales y administrativos de la Clínica "Santa Isabel" (Oruro, Bolivia).

## Arquitectura

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS, Zustand, Vite |
| Backend | NestJS 11, TypeScript, TypeORM 0.3 |
| Base de datos | PostgreSQL 15 |
| Storage | MinIO (object storage) |
| Infraestructura | Docker, Docker Compose, Nginx |

### Arquitectura Hexagonal (Backend)

Cada módulo sigue la estructura de Puertos y Adaptadores:
```
modules/
  {modulo}/
    domain/          # Entidades, puertos abstractos, servicios puros
    application/     # Casos de uso, orquestación
    infrastructure/  # Controladores REST, adaptadores TypeORM, DTOs
```

## Módulos del Sistema

| Módulo | Funcionalidad |
|--------|--------------|
| Auth | JWT dual-token, RBAC 6 roles |
| Pacientes | Registro único, validación CI, búsqueda ágil |
| Historia Clínica | HCE longitudinal, formato SOAP, CIE-10 |
| Recetas | Prescripción electrónica con seguridad farmacológica |
| Seguridad Farmacológica | Alertas de alergias e interacciones medicamentosas |
| Citas | Agendamiento y gestión de citas médicas |
| Turnos | Admisión y asignación de consultorios |
| Triaje | Clasificación ESI (E1-E5) |
| Hospitalización | Control de camas, admisiones, altas |
| Exámenes | Solicitud, resultados, valores de referencia |
| Cirugías | Registro de cirugías previas |
| Reportes | Dashboard, reportes operativos |
| Auditoría | Log inmutable de acciones (trazabilidad) |
| Usuarios | Gestión de usuarios y roles (RBAC) |
| Sucursales | Gestión multi-sucursal |
| Agenda | Horarios médicos, bloqueos de agenda |

## Roles del Sistema

| Rol | Permisos principales |
|-----|---------------------|
| `admin` | Acceso total al sistema |
| `gerente` | Reportes, facturación, gestión de usuarios/sucursales |
| `secretaria` | Pacientes, citas, consultas, recetas |
| `medico` | Consultas, recetas, exámenes, historia clínica |
| `enfermera` | Triaje, hospitalización |
| `recepcionista` | Admisión, turnos, pacientes |

## Requisitos Previos

- Docker y Docker Compose v2
- Node.js 22+ (solo para desarrollo local)
- npm 10+

## Instalación Rápida

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd clinicontrol

# 2. Configurar variables de entorno
cp infrastructure/.env.example infrastructure/.env

# 3. Iniciar todos los servicios
cd infrastructure
docker compose up -d

# 4. Verificar
curl http://localhost:8080
```

## URLs de Acceso

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:8080 |
| API (Swagger) | http://localhost:3000/api |
| API Health | http://localhost:3000/health |
| MinIO Console | http://localhost:9001 |

## Credenciales de Demostración

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@clinica.com | Admin123! | Administrador |
| gerente@clinica.com | Demo2026! | Gerente |
| secretaria@clinica.com | Demo2026! | Secretaria |
| medico@clinica.com | Demo2026! | Médico |
| enfermeria@clinica.com | Demo2026! | Enfermería |
| recepcion@clinica.com | Demo2026! | Recepcionista |

> Las cuentas demo (todas menos `admin`) solo se siembran cuando `NODE_ENV` no es `production`.
> La contraseña de `admin` se toma de la variable `ADMIN_PASSWORD` (`Admin123!` en `backend/.env.example`);
> si no se define, el seeder genera una aleatoria y la muestra en la consola en el primer arranque.

## Desarrollo Local

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run start:dev

# Frontend (otra terminal)
cd frontend
npm install
npm run dev
```

## Estructura del Proyecto

```
clinicontrol/
├── backend/                  # NestJS API
│   ├── src/
│   │   ├── common/           # Guards, interceptors, filtros, seeder
│   │   ├── config/           # App config, database config
│   │   ├── entities/         # Entidades TypeORM compartidas
│   │   └── modules/          # Módulos del dominio
│   │       ├── auth/
│   │       ├── paciente/
│   │       ├── consulta/
│   │       ├── receta/
│   │       ├── cita/
│   │       ├── interaccion-medicamento/
│   │       └── ...
│   └── test/                 # Tests e2e
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── api/              # Servicios HTTP
│   │   ├── components/       # Componentes reutilizables
│   │   │   ├── layout/       # TopNav, Sidebar, Layout
│   │   │   ├── ui/           # DataTable, Modal, Badge, etc.
│   │   │   ├── consulta/     # Componentes de consulta
│   │   │   └── examenes/     # Modales de exámenes
│   │   ├── hooks/            # useTheme, custom hooks
│   │   ├── pages/            # Páginas (lazy-loaded)
│   │   ├── store/            # Zustand (app + auth)
│   │   ├── styles/           # Theme CSS variables
│   │   └── types/            # Interfaces TypeScript
│   └── dist/                 # Build de producción (no versionar)
├── infrastructure/           # Docker y configuración
│   ├── docker-compose.yml
│   ├── backend.Dockerfile
│   └── docker/nginx/         # Nginx reverse proxy
└── DOCUMENTO-CliniControl-APA7.docx  # Documentación académica
```

## Seguridad

- **Autenticación**: JWT dual-token (Access 15min + Refresh 7d HttpOnly cookie)
- **RBAC**: 6 roles con permisos granulares por módulo
- **Ownership Guard**: Verificación de propiedad del expediente
- **Auditoría**: Registro inmutable de acciones con usuario, entidad, timestamp e IP
- **Bcrypt**: Hashing de contraseñas (cost factor 12)
- **Rate Limiting**: Protección contra fuerza bruta en login
- **Helmet**: Headers de seguridad HTTP

## Documentación

El documento académico APA7 se encuentra en `DOCUMENTO-CliniControl-APA7.docx`.

## Licencia

Proyecto académico - Universidad Privada de Oruro
