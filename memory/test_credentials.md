# NABI MEN — Test Credentials

## Admin
- URL Login: `/admin/login`
- Username: `admin`
- Password: `Eljaraja20%`

## Endpoints clave
- `POST /api/auth/login` — body `{ "username": "admin", "password": "Eljaraja20%" }` → `{ token, user }`
- `GET /api/auth/me` — requiere `Authorization: Bearer <token>`
- Todos los endpoints admin requieren `Authorization: Bearer <token>` excepto los GET públicos:
  - `GET /api/products`, `GET /api/categories`, `GET /api/tag-groups`, `GET /api/tags`, `GET /api/settings`, `GET /api/health`
  - `POST /api/orders` (creación pública desde el carrito)

## WhatsApp
- Número configurado: `595986616939` (configurable desde admin → Tasa de Cambio)

## DB
- MongoDB: `nabimen_db`
- Collections: `users`, `products`, `categories`, `tag_groups`, `tags`, `orders`, `settings`
