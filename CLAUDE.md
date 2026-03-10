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

`src/App.vue` renders `<AppHeader>`, `<router-view />`, and `<AppFooter>`. Routes: `/` (HomePage), `/product/:id` (ProductPage), `/cart` (CartPage), `/checkout` (CheckoutPage, requires auth), `/success` (SuccessPage), `/profile` (redirect → `/profile/info`), `/profile/info` | `/profile/password` | `/profile/orders` | `/profile/addresses` (ProfilePage, requires auth), `/profile/orders/:id` (OrderDetailPage, requires auth), `/wishlist` (WishlistPage, requires auth), `/login` (LoginPage, guest only), `/register` (RegisterPage, guest only).

`/profile/orders/:id` is registered before `/profile/:tab` in the router so it takes priority over the catch-all tab param.

Route guards in `src/router/index.ts` use `meta.requiresAuth` and `meta.guestOnly`. Guards await `authStore.initPromise` before evaluating, so session hydration completes before any redirect. When redirecting an unauthenticated user to `/login`, the guard passes `?redirectTo=<original path>` as a query param; `LoginPage` reads this and redirects back after successful login.

### Data layer (web)

All API types and the `api` object live in `src/services/api.ts` (`ApiProduct`, `ApiProductPage`, `ApiCategory`, `ProductFilters`, `ApiCart`, `ApiCartItem`, `ApiOrder`, `ApiOrderItem`, `ApiUser`, `ApiReview`, `ApiReviewsResponse`, `ApiEligibilityResponse`, `ApiWishlistItem`, `ApiAddress`). Stores call the server API directly:

- **`useAuthStore`** — restores session on creation via `fetchMe()` (exposes `initPromise`); exposes `user`, `login`, `logout`, `register`
- **`useProductStore`** — exposes `products`, `total`, `loading`, `error`, `categories`, `fetchProducts(filters: ProductFilters)`, `fetchCategories()`. No auto-fetch on creation; `HomePage` drives fetching. `fetchCategories()` is idempotent (skips if already loaded).
- **`useCartStore`** — persists `cartId` in `localStorage`; auto-inits on creation (creates or hydrates cart); exposes `cartItems`, `addToCart`, `updateQuantity`, `removeFromCart`, `clearCart`
- **`useOrderStore`** — exposes `createOrder(cartId, addressId?)`, `getOrderById(id)`, `getOrders()`. `getOrderById` caches in `currentOrder`; skips the fetch if `currentOrder.id` already matches.
- **`useWishlistStore`** — no auto-init; exposes `items`, `wishlistedIds` (computed `Set<string>` for O(1) lookups), `fetchWishlist()`, `toggleWishlist(productId)`. `WishlistButton` lazy-fetches the wishlist on first click (tracked per-component via a `fetched` ref) so guest page loads incur no auth calls.
- **`useAddressStore`** — no auto-init; exposes `items`, `loading`, `error`, `fetchAddresses()`, `createAddress(data)`, `deleteAddress(id)`. `createAddress` prepends to `items` on success; `deleteAddress` splices from `items`.

`ProfilePage` (`/profile/:tab`) is the user hub with four tabs: **info** (read-only email + join date), **password** (change password form using `api.changePassword()`), **orders** (order list, lazy-fetched only when the tab is first visited via `watch` on `route.params.tab`), and **addresses** (saved delivery addresses, also lazy-fetched on first visit).

`ApiProduct` includes `categoryId: string | null`, optional `category?: ApiCategory | null`, and optional `averageRating?: number | null` and `reviewCount?: number` fields. Ratings are computed server-side on every product endpoint (via `groupBy` for the list, `aggregate` for single).

`ProductFilters` is `{ page?, search?, categoryId?, minPrice?, maxPrice?, minRating? }` — the shape passed to both `api.getProducts()` and `useProductStore.fetchProducts()`.

`src/constants.ts` exports `IMAGE` — a placeholder image URL used across product displays.

### Shared Components

Base primitives (use these for forms and actions throughout the app):
- **`BaseButton.vue`** — props: `variant` (`primary` | `dark` | `ghost` | `text`), `size` (`sm` | `md` | `lg`), `type`, `disabled`, `loading`, `fullWidth`. `loading` shows a spinner and disables the button.
- **`BaseInput.vue`** — props: `modelValue`, `type`, `placeholder`, `id`, `disabled`, `error`, `variant` (`default` | `ghost`). Uses `inheritAttrs: false` with `v-bind="$attrs"` on the `<input>` so arbitrary HTML attributes (e.g. `autocomplete`, `required`) pass through directly.

Feature components:
- **`EmptyState.vue`** — props: `heading`, `message`, `linkTo`, `linkText`. Used in CartPage, ProfilePage (orders/addresses tabs), and HomePage (no-results state).
- **`QuantityStepper.vue`** — props: `quantity`, `min` (default 1); emits `change` with new quantity. Disables decrement at `min`. Used in CartPage and ProductPage.
- **`StarRating.vue`** — presentational; props: `rating: number | null`, `count?: number`, `size?: 'sm' | 'md'`. Renders ★/☆ glyphs. Used in ProductCard and ProductPage.
- **`ProductReviews.vue`** — props: `productId`; emits `reviewSubmitted`. Fetches reviews and eligibility on mount, renders aggregate summary, review form (if eligible), and reviews list. Review submission re-fetches both reviews and the parent product (via emitted event handled in ProductPage).
- **`ReviewForm.vue`** — extracted form used inside `ProductReviews.vue` for submitting a review.
- **`WishlistButton.vue`** — props: `productId`; self-contained heart toggle. Always calls `preventDefault` + `stopPropagation` (safe to nest inside `<router-link>`). Redirects guests to `/login?redirectTo=<current path>`. Lazy-fetches wishlist on first interaction for logged-in users.
- **`AddressForm.vue`** — self-contained address creation form; calls `useAddressStore.createAddress()` internally; emits `saved(ApiAddress)` on success and `cancel` on dismissal. Used in CheckoutPage (inside the "+ Add new address" radio option) and ProfilePage (addresses tab).
- **`FilterPanel.vue`** — sidebar filter UI; props: `categories`, `categoryId`, `minPrice`, `maxPrice`, `minRating`; emits `category-change`, `price-change`, `rating-change`, `clear`. Used in `HomePage` alongside `PaginationControls`.

### Pagination, Search & Filtering

`GET /api/products` supports `?page=N&search=query&categoryId=X&minPrice=N&maxPrice=N&minRating=N` — returns `{ items: ApiProduct[], total: number }` (9/page, `createdAt asc`). `HomePage` reads all filter params from URL query and passes them to `fetchProducts(filters)`. Search and price inputs are debounced (300ms) via `src/composables/useDebounce.ts` before pushing to URL. Category and rating changes are immediate. `FilterPanel` shows active filter pills; `clearFilters` preserves the current search term. `PaginationControls.vue` is presentational (props: `page`, `total`, `pageSize`; emits `prev`/`next`). `ProductPage` fetches its product directly via `api.getProductById(id)` (not from the store) since the store only holds the current page.

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

- `POST /api/auth/register` — create user; `POST /api/auth/login` — start session (sets httpOnly cookie); `POST /api/auth/logout` — end session; `GET /api/auth/me` — get current user (requires auth); `PATCH /api/auth/password` — change password (requires auth, body `{ currentPassword, newPassword }`)
- `GET /api/products?page=N&search=query&categoryId=X&minPrice=N&maxPrice=N&minRating=N` — paginated list (9/page, optional filters, returns `{ items, total }`); `GET /api/products/:id` — single product
- `GET /api/categories` — returns `ApiCategory[]`
- `POST /api/carts` — create cart; `GET /api/carts/:id` — get cart with items
- `POST /api/carts/:id/items` — add item (upserts, increments qty)
- `PATCH /api/carts/:id/items/:productId` — set quantity
- `DELETE /api/carts/:id/items/:productId` — remove item
- `POST /api/orders` — place order from cart (requires `{ cartId }`, optional `{ addressId }`; clears cart items in transaction); `GET /api/orders` — list all orders; `GET /api/orders/:id` — get order with items; both GET endpoints include `address` in response
- `GET /api/addresses` — auth; list user addresses; `POST /api/addresses` — auth; body `{ label?, line1, line2?, city, state, zip, country? }`; `DELETE /api/addresses/:id` — auth; ownership-checked
- `GET /api/reviews/product/:productId` — public; returns `{ reviews, averageRating, reviewCount }`
- `GET /api/reviews/eligibility/:productId` — auth; returns `{ canReview, existingReview }` (`canReview` true if user has an OrderItem for this product)
- `POST /api/reviews` — auth; body `{ productId, rating (1–5), body? }`; upserts (one review per user per product); validates purchase first
- `GET /api/wishlist` — auth; returns `WishlistItem[]` with product included, ordered by `createdAt desc`
- `POST /api/wishlist` — auth; body `{ productId }`; upserts (idempotent)
- `DELETE /api/wishlist/:productId` — auth; removes item

### Database

Prisma with **better-sqlite3** adapter. Schema in `packages/server/prisma/schema.prisma`. Generated client outputs to `prisma/generated/`.

Models: `Category` (`name @unique`, `@@map("categories")`), `Product` (has optional `categoryId` FK), `Cart`, `CartItem` (composite PK: cartId+productId), `Order` (has `userId` FK, optional `addressId` FK), `OrderItem` (composite PK: orderId+productId), `User`, `Session` (has `userId` FK, `expiresAt`), `Review` (`@@unique([userId, productId])`, `rating Int`, `body String?`), `WishlistItem` (composite PK: userId+productId, `@@index([userId])`), `Address` (has `userId` FK; fields: `label?`, `line1`, `line2?`, `city`, `state`, `zip`, `country`; `@@index([userId])`).

`DATABASE_URL` is set in `packages/server/.env` (default: `file:./dev.db`).

After schema changes: `npx prisma migrate dev` from `packages/server/`.
