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

`src/App.vue` renders `<AppHeader>`, `<router-view />`, and `<AppFooter>`. Routes: `/` (HomePage), `/product/:id` (ProductPage), `/cart` (CartPage), `/checkout` (CheckoutPage, requires auth), `/success` (SuccessPage), `/orders` (OrdersPage, requires auth), `/orders/:id` (OrderDetailPage, requires auth), `/wishlist` (WishlistPage, requires auth), `/login` (LoginPage, guest only), `/register` (RegisterPage, guest only).

Route guards in `src/router/index.ts` use `meta.requiresAuth` and `meta.guestOnly`. Guards await `authStore.initPromise` before evaluating, so session hydration completes before any redirect. When redirecting an unauthenticated user to `/login`, the guard passes `?redirectTo=<original path>` as a query param; `LoginPage` reads this and redirects back after successful login.

### Data layer (web)

All API types and the `api` object live in `src/services/api.ts` (`ApiProduct`, `ApiProductPage`, `ApiCart`, `ApiCartItem`, `ApiOrder`, `ApiOrderItem`, `ApiUser`, `ApiReview`, `ApiReviewsResponse`, `ApiEligibilityResponse`, `ApiWishlistItem`). Stores call the server API directly:

- **`useAuthStore`** — restores session on creation via `fetchMe()` (exposes `initPromise`); exposes `user`, `login`, `logout`, `register`
- **`useProductStore`** — exposes `products`, `total`, `loading`, `error`, `fetchProducts(page, search?)`. No auto-fetch on creation; `HomePage` drives fetching based on URL `?page` and `?search` params.
- **`useCartStore`** — persists `cartId` in `localStorage`; auto-inits on creation (creates or hydrates cart); exposes `cartItems`, `addToCart`, `updateQuantity`, `removeFromCart`, `clearCart`
- **`useOrderStore`** — exposes `createOrder(cartId)`, `getOrderById(id)`, `getOrders()`. `getOrderById` caches in `currentOrder`; skips the fetch if `currentOrder.id` already matches.
- **`useWishlistStore`** — no auto-init; exposes `items`, `wishlistedIds` (computed `Set<string>` for O(1) lookups), `fetchWishlist()`, `toggleWishlist(productId)`. `WishlistButton` lazy-fetches the wishlist on first click (tracked per-component via a `fetched` ref) so guest page loads incur no auth calls.

`ApiProduct` includes optional `averageRating?: number | null` and `reviewCount?: number` fields, computed server-side on every product endpoint (via `groupBy` for the list, `aggregate` for single). Both product endpoints always return these fields.

`src/constants.ts` exports `IMAGE` — a placeholder image URL used across product displays.

### Shared Components

- **`EmptyState.vue`** — props: `heading`, `message`, `linkTo`, `linkText`. Used in CartPage, OrdersPage, and HomePage (no-results state).
- **`QuantityStepper.vue`** — props: `quantity`, `min` (default 1); emits `change` with new quantity. Disables decrement at `min`. Used in CartPage and ProductPage.
- **`StarRating.vue`** — presentational; props: `rating: number | null`, `count?: number`, `size?: 'sm' | 'md'`. Renders ★/☆ glyphs. Used in ProductCard and ProductPage.
- **`ProductReviews.vue`** — props: `productId`; emits `reviewSubmitted`. Fetches reviews and eligibility on mount, renders aggregate summary, review form (if eligible), and reviews list. Review submission re-fetches both reviews and the parent product (via emitted event handled in ProductPage).
- **`WishlistButton.vue`** — props: `productId`; self-contained heart toggle. Always calls `preventDefault` + `stopPropagation` (safe to nest inside `<router-link>`). Redirects guests to `/login?redirectTo=<current path>`. Lazy-fetches wishlist on first interaction for logged-in users.

### Pagination & Search

`GET /api/products?page=N&search=query` returns `{ items: ApiProduct[], total: number }` — 9 per page, ordered by `createdAt asc`. Search filters by name or description (SQLite `contains`). `HomePage` reads `?page` and `?search` from the URL query, watches both with `{ immediate: true }`, and calls `fetchProducts(page, search)`. The search input is debounced via `src/composables/useDebounce.ts` (300ms) before being pushed to the URL. `PaginationControls.vue` is a presentational component (props: `page`, `total`, `pageSize`; emits `prev`/`next`); `HomePage` handles navigation via `router.push`. `ProductPage` fetches its product directly via `api.getProductById(id)` (not from the store) since the store only holds the current page's 9 items.

Font: **Titillium Web** (400 & 700 weights) via `@fontsource/titillium-web` in `App.vue`.

### Linting & Formatting

Two linters run in sequence via `npm run lint`:
1. **oxlint** — configured in `.oxlintrc.json`
2. **eslint** — Vue-specific rules, configured in `eslint.config.ts`

Formatting uses **oxfmt** (not Prettier) scoped to `src/`. ESLint uses `eslint-config-prettier` to avoid conflicts.

## Server Architecture (`packages/server/`)

**Hono** on `@hono/node-server`, port 3000. CORS restricted to `http://localhost:5173` with `credentials: true`.

### Auth

Session-cookie auth via `src/middleware/auth.ts`. The `requireAuth` middleware reads an httpOnly `session` cookie, looks up the session in DB, and sets `userId` in context. Sessions expire after 7 days. Passwords hashed with bcrypt (cost 12).

### API Routes

- `POST /api/auth/register` — create user; `POST /api/auth/login` — start session (sets httpOnly cookie); `POST /api/auth/logout` — end session; `GET /api/auth/me` — get current user (requires auth)
- `GET /api/products?page=N&search=query` — paginated list (9/page, optional search by name/description, returns `{ items, total }`); `GET /api/products/:id` — single product
- `POST /api/carts` — create cart; `GET /api/carts/:id` — get cart with items
- `POST /api/carts/:id/items` — add item (upserts, increments qty)
- `PATCH /api/carts/:id/items/:productId` — set quantity
- `DELETE /api/carts/:id/items/:productId` — remove item
- `POST /api/orders` — place order from cart (requires `{ cartId }`, clears cart items in transaction)
- `GET /api/orders` — list all orders; `GET /api/orders/:id` — get order with items
- `GET /api/reviews/product/:productId` — public; returns `{ reviews, averageRating, reviewCount }`
- `GET /api/reviews/eligibility/:productId` — auth; returns `{ canReview, existingReview }` (`canReview` true if user has an OrderItem for this product)
- `POST /api/reviews` — auth; body `{ productId, rating (1–5), body? }`; upserts (one review per user per product); validates purchase first
- `GET /api/wishlist` — auth; returns `WishlistItem[]` with product included, ordered by `createdAt desc`
- `POST /api/wishlist` — auth; body `{ productId }`; upserts (idempotent)
- `DELETE /api/wishlist/:productId` — auth; removes item

### Database

Prisma with **better-sqlite3** adapter. Schema in `packages/server/prisma/schema.prisma`. Generated client outputs to `prisma/generated/`.

Models: `Product`, `Cart`, `CartItem` (composite PK: cartId+productId), `Order` (has `userId` FK), `OrderItem` (composite PK: orderId+productId), `User`, `Session` (has `userId` FK, `expiresAt`), `Review` (`@@unique([userId, productId])`, `rating Int`, `body String?`), `WishlistItem` (composite PK: userId+productId, `@@index([userId])`).

`DATABASE_URL` is set in `packages/server/.env` (default: `file:./dev.db`).

After schema changes: `npx prisma migrate dev` from `packages/server/`.
