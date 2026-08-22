# Auditoría y Mejoras — CliniControl (Clínica Santa Isabel)

## Resumen
Sistematización integral del sistema: unificación de tablas en `DataTable` con filtros, navegación móvil tipo app (barra inferior), seguridad de autenticación endurecida, corrección del bug de impresión de reportes, flujo de turnos alineado a HU-03 (paciente debe existir en Padrón) y reparación de Caja/Arqueo (faltaban las tablas en BD).

## Auditoría — problemas principales encontrados
| # | Severidad | Problema | Estado |
|---|-----------|----------|--------|
| 1 | **P0** | `/auth/register` público: cualquiera creaba usuarios (se halló `test@test.com`) | ✅ Corregido |
| 2 | **P0** | Tablas `caja_sessions` y `arqueos_caja` inexistentes en BD → módulo Caja roto ("No se pudo conectar") | ✅ Migración aplicada |
| 3 | **P0** | Impresión de Reporte salía en blanco: `display:none` no lo anula `visibility` | ✅ Corregido |
| 4 | **P1** | Turnos creaba pacientes incompletos → volcado crudo de errores de validación | ✅ Corregido (lookup por CI + aviso amable) |
| 5 | **P1** | Errores del backend (arrays de class-validator) se mostraban sin formato | ✅ Normalizado (`api/errMsg.ts`) |
| 6 | **P1** | Búsqueda anidada (`paciente.nombre`) no funcionaba en tablas | ✅ Soporte de rutas con punto |
| 7 | **P2** | 5 tablas con estilos dispares (audit/arqueo/vacunas) | ✅ Migradas a DataTable |
| 8 | **P2** | Navegación móvil con drawer poco usable | ✅ BottomNav estilo app + safe-area |
| 9 | **P2** | Mensaje genérico de error de red en Caja (no distinguía sesión expirada/saturación/red) | ✅ Mensajes diferenciados |

## UX/UI
- Design system de tokens CSS (`--primary-*`, estados, texto) aplicado en toda la app; sin gradientes decorativos ni emojis.
- `PageHeader` estandarizado en todas las páginas.
- Badges de estado consistentes (auditoría, arqueo, vacunas).

## Frontend
- `DataTable v2`: filtros por columna declarativos (`filters[]` con `predicate`), slot `toolbar`, modo servidor (`server{page,totalPages,totalItems,limit,onPageChange}`), ordenamiento, paginación con rango, export, columnas ocultables, loading skeleton, empty state.
- Páginas sobre DataTable: Pacientes, Citas (+filtro estado), Médicos (+filtro especialidad), Recetas, Alergias, Auditoría (servidor), Arqueo (+filtro cuadre), Catálogo Vacunas (+filtro obligatoria), Historial y Calendario de vacunas (+filtro estado).
- Layout móvil: barra inferior fija con ítems según rol (máx. 5), padding `safe-area-inset-bottom`; sidebar solo ≥1024px.
- Tipado endurecido: eliminados `any` en páginas/componentes tocados; `catch` sin variables muertas.

## Backend
- `AuthController`: ya no es `@Public()` a nivel clase. Públicos solo: login, login/mfa, refresh, forgot/reset-password. `register` requiere JWT + rol `admin`.
- Migración `1724256000000-AddCajaArqueo`: crea `caja_sessions` y `arqueos_caja` (aditiva, con `IF NOT EXISTS` e índices). `InitialSchema` registrada como aplicada en `migrations_history`.

## Seguridad
- Registro cerrado ✓ · Throttling global 60 req/min (login 5/min, register 3/min) verificado ✓ · Guards globales JWT/Roles/Permissions intactos ✓.
- Pendiente sugerido: eliminar usuario residual `test@test.com` (decisión del propietario).

## Rendimiento
- Bundle 265 KB gzip 84 KB, build ~1.2s.
- Turnos: carga de pacientes en paralelo con turnos/médicos (una sola pasada).
- Auditoría paginada en servidor (30/fila página) en lugar de cargar todo.

## QA realizado
- `tsc -b --noEmit` limpio en frontend y backend.
- ESLint 0 errores en todos los archivos modificados.
- `npm run build` verde (frontend) · backend compila.
- Pruebas en vivo con JWT admin: login 200 · register sin token 401 · register con token llega a validación DTO (400 esperado) · `/caja/actual` y `/arqueo` 200 · turnos/triage/pacientes/citas 200.
- Rate-limit verificado (429 tras ráfaga de logins) y diferenciado en UI.

## Pendientes (reales, no bloqueantes)
1. Persistir recetas creadas dentro de Consulta Completa (hoy se descartan si el endpoint no las guarda) — requiere decisión de contrato API.
2. Rechazar citas con fecha en el pasado (validación de negocio pendiente en backend).
3. Limpieza de warnings `react-hooks/exhaustive-deps` preexistentes en páginas grandes (bajo impacto).
