# NABI MEN — PRD

## Problema original
Tienda online "NABIMEN" (reventa de productos SHEIN en Paraguay) con storefront público estilo Shein + panel admin completo. Stack: React + FastAPI + MongoDB. Modelo de negocio: 50% seña al confirmar pedido, 2–3 semanas de espera, flete extra calculado al arribo según peso, pago final al recibir.

## Arquitectura
- **Backend (FastAPI)**: `/app/backend/server.py` (todos los routers en un solo módulo, prefijo `/api`).
- **Frontend (React 18 + Tailwind + Lucide + Recharts + react-router-dom)**: storefront + panel admin con tema dual (claro/oscuro).
- **DB**: MongoDB local en contenedor (collections: `users`, `products`, `categories`, `tag_groups`, `tags`, `orders`, `settings`).
- **Auth**: JWT bearer en `Authorization` header, token guardado en `localStorage` (`nm_token`). Único usuario admin sembrado en startup desde `.env`.
- **Files manager**: archivos físicos bajo `/app/backend/uploads/` servidos como static en `/api/uploads/<path>`.

## Personas
- **Cliente final**: navega tienda, agrega al carrito, paga vía WhatsApp.
- **Admin (dueño NABI MEN)**: gestiona productos, etiquetas, pedidos, archivos, dashboard y tasa de cambio.

## Requerimientos fijos
- Logo "NABI MEN" (bold negro + MEN en azul/indigo).
- Categorías iniciales: Championes, Remeras, Camisas, Pantalones, Shorts, Relojes, Accesorios (editables).
- WhatsApp: +595 986 616 939 (editable).
- Estados de pedido: `en_proceso` → `pagado_parcialmente` → `en_envio` → `arribado` → `completado` + `cancelado`.
- Precio: `cost_usd * (1 + profit_pct/100) * exchange_rate` redondeado al millar PYG.

## Implementado (May 2026)
- ✅ **Storefront público**: hero editorial bento, navegación por categoría, búsqueda, filtros (marca, precio min/max), sort precio asc/desc + más nuevos.
- ✅ **Product card** con favoritos (heart), badge "destacado", precio en PYG.
- ✅ **Modal de producto** con galería multifoto, descripción, selectores de tag por grupo (button/tag), variantes con sus propias fotos, cantidad, add to cart.
- ✅ **Carrito** persistente (localStorage), edición de qty, total, políticas embebidas, transición a form de datos (nombre, teléfono opcional, ubicación CDE/Asunción/Encarnación/San Lorenzo/Otra, notas). Confirmar abre `wa.me` con mensaje autogenerado + persiste orden en backend.
- ✅ **Favoritos** persistente, side sheet con listado y acceso al modal.
- ✅ **Admin login** dark theme con gradient.
- ✅ **Admin sidebar** con beam tracing activo: Dashboard, Productos, Categorías, Etiquetas, Pedidos, Archivos, Tasa de Cambio.
- ✅ **Dashboard**: KPIs (productos activos, pedidos por estado, completados, cancelados, flete cobrado), tarjetas grandes (Ingresos, Costo total, Ganancia neta), chart mensual con Recharts (BarChart Ingresos/Costo/Ganancia).
- ✅ **Productos panel**: tabla con foto, búsqueda, filtro por categoría, costo/ganancia/precio final calculado. Editor modal completo (datos básicos, etiquetas seleccionables, fotos principales con upload o URL, reordenar, variantes con tags propios + fotos específicas).
- ✅ **Categorías**: CRUD completo.
- ✅ **Etiquetas**: CRUD de grupos (display_type: button/tag) + tags con color hex opcional.
- ✅ **Pedidos**: listado con filtro por estado, detalle con flujo state machine (botón "avanzar"), input de flete cuando aplica, historial de estados, cancelar, eliminar, link directo WhatsApp al cliente.
- ✅ **Archivos**: explorador tipo Windows (carpetas, archivos, breadcrumbs, drag&drop, ZIP autoextract preservando estructura, eliminar, copiar URL pública). Path-traversal protegido.
- ✅ **Tasa de Cambio**: input manual USD→PYG, edita WhatsApp, business name, políticas. Al guardar recalcula precios automáticamente.

## Backlog priorizado

### P0 (siguientes pasos sugeridos)
- Migración a PostgreSQL local del usuario (Prisma o SQLAlchemy + Alembic) cuando quiera deployar a Vercel.
- Subida real de las fotos del usuario (ZIP de relojes pendiente que mencionó).
- Mostrar **flete acumulado** como línea separada en el carrito + WhatsApp.
- Soporte de **múltiples WhatsApp** o pasar por etapa con contestación interna antes de wa.me (opcional).

### P1
- **Búsqueda avanzada** con typeahead.
- **Reordenar variantes** y fijar variante por defecto.
- Mostrar **stock** opcional por variante.
- Compartir producto (Open Graph + URL slug `/producto/<slug>`).
- Subida de logo desde admin (settings).

### P2
- **Internacionalización** (es/en/pt).
- Exportar pedidos a CSV/Excel.
- Notificación browser/sonora cuando llega nueva orden.
- Tracking público del pedido con código (cliente ve estado actual).
- Dark/Light toggle en storefront.

## Endpoints clave
```
POST   /api/auth/login            (público)
GET    /api/auth/me               (admin)
GET    /api/settings              (público)
PUT    /api/settings              (admin)
GET    /api/categories            (público)
POST   /api/categories            (admin)
PUT    /api/categories/{id}       (admin)
DELETE /api/categories/{id}       (admin)
GET    /api/tag-groups, /api/tags (público)
POST/PUT/DELETE para tag-groups, tags (admin)
GET    /api/products              (público, ?category=, ?q=, ?sort=)
GET    /api/products/{id}         (público)
POST/PUT/DELETE para products     (admin)
GET    /api/orders                (admin, ?status=)
POST   /api/orders                (público — carrito)
PUT    /api/orders/{id}           (admin — cambio de estado, flete)
DELETE /api/orders/{id}           (admin)
GET    /api/files/list            (admin)
POST   /api/files/mkdir, upload, rename (admin)
DELETE /api/files/delete          (admin)
GET    /api/uploads/<path>        (público static)
GET    /api/dashboard/stats       (admin)
GET    /api/health
```

## Stack & seeds
- Tasa default: ₲ 7800 / USD.
- 7 productos seed (uno por categoría) usando URLs Unsplash/Pexels.
- 3 grupos de tags + 18 tags seed.

## Testing status (May 2026)
- ✅ Backend: 27/27 pytest tests passing.
- ✅ Frontend: ~95% flows working (storefront, carrito, WhatsApp checkout, admin login, todos los paneles, CRUD productos, exchange rate).
- Issues menores resueltos: mkdir duplicado retorna 400 (en lugar de 500).
