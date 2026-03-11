# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Structure

npm workspaces monorepo with three packages:
- `packages/web` — Vue 3 + TypeScript SPA (Vite)
- `packages/server` — Hono REST API + Prisma + SQLite
- `packages/schemas` — shared Zod validation schemas (imported by both web and server)

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
npm run build        # tsc + tsc-alias (path alias replacement)
npm run start        # node dist/index.js
npm run seed         # tsx prisma/seed.ts (alternative to npx tsx)

# Database (packages/server/)
npx prisma migrate dev --name <name>   # create + apply migration
npx prisma migrate reset               # wipe DB, re-apply all migrations + seed
npx tsx prisma/seed.ts                 # run seed manually
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

All API types and the `api` object live in `src/services/api.ts`. Stores call the server API directly:

- **`useAuthStore`** — restores session on creation via `fetchMe()` (exposes `initPromise`); exposes `user`, `login`, `logout`, `register`
- **`useProductStore`** — exposes `products`, `total`, `loading`, `error`, `categories`, `fetchProducts(filters: ProductFilters)`, `fetchCategories()`. No auto-fetch on creation; `HomePage` drives fetching. `fetchCategories()` is idempotent (skips if already loaded).
- **`useCartStore`** — persists `cartId` in `localStorage`; auto-inits on creation (creates or hydrates cart); exposes `cartItems`, `addToCart({ variantId, quantity })`, `updateQuantity({ variantId, quantity })`, `removeFromCart(variantId)`, `clearCart`
- **`useOrderStore`** — exposes `createOrder(cartId, addressId?)`, `getOrderById(id)`, `getOrders()`. `getOrderById` caches in `currentOrder`; skips the fetch if `currentOrder.id` already matches.
- **`useWishlistStore`** — no auto-init; exposes `items`, `wishlistedIds` (computed `Set<string>` for O(1) lookups), `fetchWishlist()`, `toggleWishlist(productId)`. `WishlistButton` lazy-fetches the wishlist on first click (tracked per-component via a `fetched` ref) so guest page loads incur no auth calls.
- **`useAddressStore`** — no auto-init; exposes `items`, `loading`, `error`, `fetchAddresses()`, `createAddress(data)`, `deleteAddress(id)`. `createAddress` prepends to `items` on success; `deleteAddress` splices from `items`.

`ProfilePage` (`/profile/:tab`) is the user hub with four tabs: **info** (read-only email + join date), **password** (change password form using `api.changePassword()`), **orders** (order list, lazy-fetched only when the tab is first visited via `watch` on `route.params.tab`), and **addresses** (saved delivery addresses, also lazy-fetched on first visit).

`src/constants.ts` exports `IMAGE` — a placeholder image URL used across product displays.

Font: **Titillium Web** (400 & 700 weights) via `@fontsource/titillium-web` in `App.vue`.

### API Types

Key types in `src/services/api.ts`:

- **`ApiProduct`** — includes optional `variantTypes?`, `variants?`, `priceRange?: { min, max }`, `defaultVariantId?`, `averageRating?`, `reviewCount?`. Ratings computed server-side.
- **`ApiVariantType`** — `{ id, name, position, options: ApiVariantOption[] }`. Options ordered by `position`.
- **`ApiVariantOption`** — `{ id, value, position, variantTypeId }`
- **`ApiProductVariant`** — `{ id, productId, price, stock, image, isDefault, values: ApiProductVariantValue[] }`
- **`ApiCartItem`** — `{ cartId, variantId, quantity, variant: ApiProductVariant & { product: ApiProduct } }`. Access product via `cartItem.variant.product`, price via `cartItem.variant.price`.
- **`ApiOrderItem`** — `{ orderId, variantId, quantity, price, variant: ApiProductVariant & { product: ApiProduct } }`. `price` is a snapshot taken at order creation time.
- **`ProductFilters`** — `{ page?, search?, categoryId?, minPrice?, maxPrice?, minRating?, excludeOutOfStock? }`

### Product Variants

Every product has at least one `ProductVariant` (simple products get a single default variant). This means cart/order operations always reference a `variantId`, never a `productId` directly.

**ProductPage variant selector** — for products with `variantTypes`, renders pill buttons per type. Selection is stored in URL query params (key = slugified type name, e.g. `pot-size`, value = optionId). On mount, auto-initialises params from the default variant. `selectedVariant` is computed by matching selected option IDs against `product.variants`. If a selected combination has no matching variant, the Add to Cart button is disabled.

Variant label helper pattern (used in cart, checkout, orders):
```ts
variant.values.map(v => v.option.value).join(' / ')  // e.g. "Medium (6") / Terracotta"
```

**Stock display patterns** — `ProductPage` computes `selectedStock`, `isOutOfStock` (stock ≤ 0), `isLowStock` (stock 1–5) from `selectedVariant.stock`; shows inline status and disables Add to Cart when OOS; passes `disableMinus`/`disablePlus` to `QuantityStepper` based on quantity bounds, OOS state, and variant availability. `CartPage` and `CheckoutPage` both compute `hasStockIssue` (any item where `quantity > variant.stock` or stock = 0) to disable the proceed/place-order button and surface per-item warnings.

**Wishlists are product-level**, not variant-level — the `WishlistButton` takes `productId`. The wishlist "Add to Cart" uses `item.product.defaultVariantId`.

**Reviews are product-level** — one review per user per product regardless of variant.

### Shared Components

Base primitives (use these for forms and actions throughout the app):
- **`BaseButton.vue`** — props: `variant` (`primary` | `dark` | `ghost` | `text`), `size` (`sm` | `md` | `lg`), `type`, `disabled`, `loading`, `fullWidth`. `loading` shows a spinner and disables the button.
- **`BaseInput.vue`** — props: `modelValue`, `type`, `placeholder`, `id`, `disabled`, `error`, `variant` (`default` | `ghost`). Uses `inheritAttrs: false` with `v-bind="$attrs"` on the `<input>` so arbitrary HTML attributes (e.g. `autocomplete`, `required`) pass through directly.

Feature components:
- **`EmptyState.vue`** — props: `heading`, `message`, `linkTo`, `linkText`.
- **`QuantityStepper.vue`** — props: `quantity`, `disableMinus?`, `disablePlus?`; emits `change` with new quantity. Purely presentational — all disable logic is computed by the parent.
- **`StarRating.vue`** — presentational; props: `rating: number | null`, `count?: number`, `size?: 'sm' | 'md'`.
- **`ProductReviews.vue`** — props: `productId`; emits `reviewSubmitted`. Fetches reviews and eligibility on mount. Review submission re-fetches both reviews and parent product (via emitted event handled in ProductPage).
- **`ReviewForm.vue`** — extracted form used inside `ProductReviews.vue`.
- **`WishlistButton.vue`** — props: `productId`; self-contained heart toggle. Always calls `preventDefault` + `stopPropagation` (safe to nest inside `<router-link>`). Redirects guests to `/login?redirectTo=<current path>`.
- **`AddressForm.vue`** — self-contained address creation form; calls `useAddressStore.createAddress()` internally; emits `saved(ApiAddress)` and `cancel`. Used in CheckoutPage and ProfilePage.
- **`FilterPanel.vue`** — sidebar filter UI; props: `categories`, `categoryId`, `minPrice`, `maxPrice`, `minRating`, `excludeOutOfStock`; emits `category-change`, `price-change`, `rating-change`, `stock-change`, `clear`.
- **`ProductCard.vue`** — shows "From $X.XX" when `product.priceRange.min !== product.priceRange.max`, otherwise flat price.

### Pagination, Search & Filtering

`GET /api/products` supports `?page=N&search=query&categoryId=X&minPrice=N&maxPrice=N&minRating=N&excludeOutOfStock=true` — returns `{ items: ApiProduct[], total: number }` (9/page, `createdAt asc`). `HomePage` reads all filter params from URL query and passes them to `fetchProducts(filters)`. Search and price inputs are debounced (300ms) via `src/composables/useDebounce.ts` before pushing to URL. Category, rating, and stock-toggle changes are immediate. `PaginationControls.vue` is presentational (props: `page`, `total`, `pageSize`; emits `prev`/`next`). `ProductPage` fetches its product directly via `api.getProductById(id)` (not from the store).

### Linting & Formatting

Two linters run in sequence via `npm run lint`:
1. **oxlint** — configured in `.oxlintrc.json`
2. **eslint** — Vue-specific rules, configured in `eslint.config.ts`

Formatting uses **oxfmt** (not Prettier) scoped to `src/`. ESLint uses `eslint-config-prettier` to avoid conflicts.

## Server Architecture (`packages/server/`)

**Hono** on `@hono/node-server`, port 3000. CORS restricted to `http://localhost:5173` with `credentials: true`.

### Shared Schemas (`packages/schemas/`)

Zod schemas shared between web and server. Server imports via `schemas` path alias (configured in `packages/server/tsconfig.json`). Exports: `RegisterSchema`, `LoginSchema`, `ChangePasswordSchema`, `ProductQuerySchema`, `CreateOrderSchema`, `AddCartItemSchema`, `UpdateCartItemSchema`, `CreateReviewSchema`, `AddWishlistItemSchema`, `CreateAddressSchema`.

All server routes validate requests using the `validate()` helper from `src/lib/validate.ts` — wraps `@hono/zod-validator`, returns 400 with first error message on failure. Pattern:
```ts
app.post('/route', validate('json', CreateOrderSchema), async (c) => {
  const data = c.req.valid('json')
})
```

### Service Layer (`src/services/`)

Business logic lives in service files, not route handlers. Routes are thin controllers: parse input → call service → return response.

One service file per domain:
- `auth.service.ts` — register, login, logout, getMe, changePassword
- `address.service.ts` — CRUD with ownership check (403)
- `cart.service.ts` — create/get cart, add/update/remove items with stock validation
- `category.service.ts` — getAllCategories
- `order.service.ts` — createOrder (atomic stock decrement transaction), getOrderById (ownership check), getUserOrders
- `product.service.ts` — listProducts (filter/enrichment pipeline), getProductById
- `review.service.ts` — getProductReviews, getReviewEligibility, upsertReview (returns `{ review, isNew }` to distinguish 201/200)
- `wishlist.service.ts` — get/add/remove with `.map()` transform to inject `defaultVariantId`

**Error contract — `src/lib/errors.ts`:**
```ts
// Throw from services:
throw new ServiceError(404, 'Cart not found')
throw new ServiceError(400, 'Not enough stock', { availableStock: 3 }) // extra fields merged into response

// Catch in routes:
try {
  const result = await someService(...)
  return c.json(result)
} catch (err) {
  return handleServiceError(err, c)  // non-ServiceError re-throws to onError 500 handler
}
```

Cookie operations (`setCookie`, `deleteCookie`) stay in route handlers — they are HTTP concerns, not service concerns. The `loginUser` service returns `{ token, expiresAt }` and the route calls `setCookie`.

### Auth Context Type

`AuthEnv = { Variables: { userId: string } }` defined in `src/types/auth.ts`. Authenticated routes type their Hono context as `Context<AuthEnv>` to access `c.get('userId')` after `requireAuth` middleware runs.

### Auth

Session-cookie auth via `src/middleware/auth.ts`. The `requireAuth` middleware reads an httpOnly `session` cookie, looks up the session in DB, and sets `userId` in context. Sessions expire after 7 days. Passwords hashed with bcrypt (cost 12).

### API Routes

- `POST /api/auth/register` — create user; `POST /api/auth/login` — start session; `POST /api/auth/logout`; `GET /api/auth/me` (requires auth); `PATCH /api/auth/password` (requires auth, body `{ currentPassword, newPassword }`)
- `GET /api/products?page=N&search=query&categoryId=X&minPrice=N&maxPrice=N&minRating=N&excludeOutOfStock=true` — returns `{ items, total }` with `priceRange`, `defaultVariantId`, `averageRating`, `reviewCount`, `totalStock` per product; `GET /api/products/:id` — includes full `variantTypes` (with nested `options`) and `variants` (with nested `values.option`; each variant includes `stock`)
- `GET /api/categories`
- `POST /api/carts`; `GET /api/carts/:id` — includes `cartItems → variant → product` and `variant → values → option`
- `POST /api/carts/:id/items` — body `{ variantId, quantity }`, upserts (increments qty); rejects with 400 if `currentQtyInCart + quantity > variant.stock`
- `PATCH /api/carts/:id/items/:variantId` — set quantity; rejects with 400 if `quantity > variant.stock`; `DELETE /api/carts/:id/items/:variantId`
- `POST /api/orders` — body `{ cartId, addressId? }`; calculates total from `variant.price`; snapshots price into each `OrderItem.price`; atomically decrements `stock` per variant; rolls back with 400 if any variant has insufficient stock; clears cart in same transaction
- `GET /api/orders`; `GET /api/orders/:id` — includes `orderItems → variant → product` and `variant → values → option`
- `GET /api/addresses`; `POST /api/addresses` — body `{ label?, line1, line2?, city, state, zip, country? }`; `DELETE /api/addresses/:id` — ownership-checked
- `GET /api/reviews/product/:productId`; `GET /api/reviews/eligibility/:productId` — checks `orderItem.variant.productId` (purchase required); `POST /api/reviews` — body `{ productId, rating (1–5), body? }`; upserts
- `GET /api/wishlist` — returns items with product (includes `defaultVariantId`); `POST /api/wishlist` — body `{ productId }`; `DELETE /api/wishlist/:productId`

### Database

Prisma with **better-sqlite3** adapter. Schema in `packages/server/prisma/schema.prisma`. Generated client outputs to `prisma/generated/`.

**Models:**

- `Category` — `name @unique`
- `Product` — has optional `categoryId` FK; `price` field serves as base/display price for listings
- `VariantType` — belongs to Product (`onDelete: Cascade`); fields: `name`, `position`
- `VariantOption` — belongs to VariantType (`onDelete: Cascade`); fields: `value`, `position`
- `ProductVariant` — belongs to Product (`onDelete: Cascade`); fields: `price`, `stock` (default 0), `image?`, `isDefault`. Every product has ≥1 variant; simple products have exactly one with `isDefault: true`
- `ProductVariantValue` — join table (composite PK: `[variantId, optionId]`) linking ProductVariant to VariantOption
- `CartItem` — composite PK `[cartId, variantId]`; quantity only
- `OrderItem` — composite PK `[orderId, variantId]`; stores `quantity` and `price` snapshot
- `Order` — has `userId` FK, optional `addressId` FK, `total` (calculated at creation)
- `User`, `Session` (7-day expiry), `Review` (`@@unique([userId, productId])`), `WishlistItem` (composite PK `[userId, productId]`), `Address`

`DATABASE_URL` is set in `packages/server/.env` (default: `file:./dev.db`).

After schema changes: `npx prisma migrate dev --name <migration-name>` from `packages/server/`. The seed (`prisma/seed.ts`) creates 3 products with Pot Size + Pot Color variants (sparse combinations) and 9 simple products with single default variants.
