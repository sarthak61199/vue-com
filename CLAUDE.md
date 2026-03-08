# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Structure

npm workspaces monorepo with two packages:
- `packages/web` — Vue 3 + TypeScript SPA (Vite)
- `packages/server` — Hono REST API + Prisma + SQLite

## Commands

Run from the respective package directory (no root-level scripts):

```sh
# Web (packages/web/)
npm run dev          # Vite dev server
npm run build        # type-check + build for production
npm run lint         # oxlint then eslint (both with --fix)
npm run format       # format src/ with oxfmt
npm run type-check   # vue-tsc type checking only

# Server (packages/server/)
npm run dev          # tsx watch src/index.ts (port 3000)
npm run build        # tsc
npm run start        # node dist/index.js
```

No test suite configured.

## Web Architecture (`packages/web/`)

Vue 3 + TypeScript SPA scaffolded with Vite. Stack:
- **Vue Router 5** — page components in `src/pages/`, registered manually in `src/router/index.ts`
- **Pinia** — stores in `src/stores/`
- **`@` alias** resolves to `src/`

`src/App.vue` renders `<AppHeader>`, `<router-view />`, and `<AppFooter>`. Routes: `/` (HomePage), `/product/:id` (ProductPage), `/cart` (CartPage), `/checkout` (CheckoutPage), `/success` (SuccessPage), `/orders` (OrdersPage).

### Data layer (web)

All API types and the `api` object live in `src/services/api.ts` (`ApiProduct`, `ApiCart`, `ApiCartItem`, `ApiOrder`, `ApiOrderItem`). Stores call the server API directly:

- **`useProductStore`** — auto-fetches products on creation; exposes `products`, `loading`, `error`, `getProductById(id)`
- **`useCartStore`** — persists `cartId` in `localStorage`; auto-inits on creation (creates or hydrates cart); exposes `cartItems`, `addToCart`, `updateQuantity`, `removeFromCart`, `clearCart`
- **`useOrderStore`** — exposes `createOrder(cartId)`, `getOrderById(id)`, `getOrders()`

Font: **Titillium Web** (400 & 700 weights) via `@fontsource/titillium-web` in `App.vue`.

### Linting & Formatting

Two linters run in sequence via `npm run lint`:
1. **oxlint** — configured in `.oxlintrc.json`
2. **eslint** — Vue-specific rules, configured in `eslint.config.ts`

Formatting uses **oxfmt** (not Prettier) scoped to `src/`. ESLint uses `eslint-config-prettier` to avoid conflicts.

## Server Architecture (`packages/server/`)

**Hono** on `@hono/node-server`, port 3000. CORS open to `*`.

### API Routes

- `GET/GET:id /api/products` — list all or get one product
- `POST /api/carts` — create cart; `GET /api/carts/:id` — get cart with items
- `POST /api/carts/:id/items` — add item (upserts, increments qty)
- `PATCH /api/carts/:id/items/:productId` — set quantity
- `DELETE /api/carts/:id/items/:productId` — remove item
- `POST /api/orders` — place order from cart (requires `{ cartId }`, clears cart items in transaction)
- `GET /api/orders` — list all orders; `GET /api/orders/:id` — get order with items

### Database

Prisma with **better-sqlite3** adapter. Schema in `packages/server/prisma/schema.prisma`. Generated client outputs to `prisma/generated/`.

Models: `Product`, `Cart`, `CartItem` (composite PK: cartId+productId), `Order`, `OrderItem` (composite PK: orderId+productId).

`DATABASE_URL` is set in `packages/server/.env` (default: `file:./dev.db`).

After schema changes: `npx prisma migrate dev` from `packages/server/`.
