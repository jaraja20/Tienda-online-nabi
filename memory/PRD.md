# NABI MEN — PRD

Tienda online (Paraguay) con catálogo, checkout vía WhatsApp y panel admin completo.

## Stack
- Backend: FastAPI + MongoDB (local). Endpoint base `/api`. Auth JWT (admin/Eljaraja20%).
- Frontend: React (CRA) + Tailwind. AppContext con estado global. Hot reload activo.
- Deploy: Emergent + dominio `nabimen.store` (Hostinger DNS → CF IPs).

## Features implementadas
- Catálogo: productos, categorías, tags (grupos), variantes por producto.
- Carrito + favoritos persistentes (localStorage).
- Checkout vía WhatsApp (`wa.me/<num>`) que arma mensaje con productos, cliente, ciudad y notas.
- Panel admin: Dashboard, Productos, Categorías, Etiquetas, Pedidos, Archivos, Tasa de cambio, Eventos.
- Importador de productos por carpeta.
- Drag & drop de imágenes entre fotos principales y variantes; reordenar fotos; portada.
- Etiqueta libre por variante: aparece como botón en la tienda y cambia la foto.
- Sección Hero del home editable desde admin (3 slots: main, side_top, side_bottom) con carrusel auto-rotate.

## Cambios recientes (2026-05)
- `2026-05-28` MVP montado, dominio `nabimen.store` vinculado.
- `2026-05-28` Fix etiquetas tienda: solo muestra tags asignados (no fallback a todos).
- `2026-05-29` Drag&drop fotos en editor admin (overlay con pointer-events-none).
- `2026-05-29` Variantes con label libre → botones de selección en la tienda.
- `2026-05-29` activePhoto se resetea al cambiar variante.
- `2026-05-29` **WhatsApp en móvil**: detecta UA y usa `window.location.href` (en desktop pre-abre tab).
- `2026-05-29` **Admin móvil**: topbar con hamburger, sidebar slide-out, backdrop. Botón retraer/expandir sidebar en desktop (icon-only mode persistido en localStorage).
- `2026-05-29` **Eventos del Hero editables**: nueva colección `hero_events`, endpoints CRUD, panel admin `EventsPanel`, componente `HeroSection` con carrusel autoplay (5.5s) por slot.

## Backlog / Próximas
- P1: typeahead búsqueda, slug `/producto/<id>` para compartir, exportar CSV pedidos.
- P1: subir fotos reales del catálogo.
- P2: i18n, tracking público de pedidos.

## Credenciales
- Admin: `admin` / `Eljaraja20%` (también en `/app/memory/test_credentials.md`)

## Cambios 2026-06-13
- `feat`: **Pedidos manuales** (admin) — nueva pestaña "Pedidos Manuales" en `Orders` panel. Permite cargar pedidos de SHEIN no listados en el catálogo. Cada item lleva: nombre, código, cantidad, costo, venta, descripción, foto de referencia. Si "Envío" está activo, pide cédula + dirección + transportadora. Se persiste con `source="manual"` en la misma colección `orders`. Aparecen en dashboard y stats junto a los de WhatsApp.
- `feat`: **Sin stock** (productos) — campo `out_of_stock: bool` en `ProductIn`. Endpoint `PATCH /api/products/{id}/stock` para toggle rápido. En la tienda: el card muestra overlay "AGOTADO" y el botón "Agregar al carrito" queda deshabilitado.

## Cambios 2026-06-13 (v2)
- `fix`: **Dashboard ahora incluye TODOS los pedidos activos** (no solo completados). Antes los pedidos en `en_envio` / `pagado_parcialmente` / `arribado` no se sumaban en el dashboard.
- `feat`: **Cash flow realista** en dashboard:
  - **Ganancia realizada** = seña 50% de pedidos en curso + 100% de los completados.
  - **Ganancia no realizada** = 50% restante por cobrar.
  - **Gastos** = suma de costos de todos los pedidos activos (no cancelados).
  - **Ganancia neta** = realizado − gastos.
- `feat`: **Desglose por origen** (WhatsApp vs Manuales) en dashboard.
- `feat`: **Chart mensual** ahora muestra Realizado vs Ventas totales vs Costo (no solo completados).
- `fix`: subida de imagen en pedido manual usaba endpoint incorrecto (`/uploads` → `/files/upload`, campo `files`).
- `feat`: costo en pedido manual con selector USD/₲ (conversión automática usando exchange_rate).
- `feat`: precio venta unitario es OPCIONAL; nuevo campo "Precio venta TOTAL del pedido" para venta por lote.
