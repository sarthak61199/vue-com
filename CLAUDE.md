# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Structure

npm workspaces monorepo with five packages:
- `packages/web` — Vue 3 + TypeScript SPA (Vite)
- `packages/server` — Hono REST API + Prisma + SQLite
- `packages/schemas` — shared Zod validation schemas (imported by both web and server)
- `packages/ui` — shared base UI components and theme CSS (imported by web; intended for future admin panel too)
- `packages/api` — API fetch client and all response types (imported by web; intended for future admin panel too)

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
npx prisma generate                    # regenerate client after schema changes (SQLite enums need this)
npx tsx prisma/seed.ts                 # run seed manually
```

No test suite configured.

## Web Architecture (`packages/web/`)

Vue 3 + TypeScript SPA scaffolded with Vite. Stack:
- **Vue Router 5** — page components in `src/pages/`, registered manually in `src/router/index.ts`
- **Pinia** — stores in `src/stores/`
- **`@` alias** resolves to `src/`; **`ui`** alias resolves to `packages/ui/src/index.ts`; **`schemas`** alias resolves to `packages/schemas/src/index.ts`; **`api`** alias resolves to `packages/api/src/index.ts`

`src/index.css` imports `ui/theme.css` (CSS custom properties) and `ui/reset.css` (global resets) then adds the app-specific `#app` layout rule.

`src/App.vue` renders `<AppHeader>`, `<router-view />`, and `<AppFooter>`. Routes: `/` (HomePage), `/product/:id` (ProductPage), `/cart` (CartPage), `/checkout` (CheckoutPage, requires auth), `/success` (SuccessPage), `/profile` (redirect → `/profile/info`), `/profile/info` | `/profile/password` | `/profile/orders` | `/profile/addresses` (ProfilePage, requires auth), `/profile/orders/:id` (OrderDetailPage, requires auth), `/wishlist` (WishlistPage, requires auth), `/login` (LoginPage, guest only), `/register` (RegisterPage, guest only), `/:pathMatch(.*)*` (NotFoundPage).

`/profile/orders/:id` is registered before `/profile/:tab` in the router so it takes priority over the catch-all tab param.

Route guards in `src/router/index.ts` use `meta.requiresAuth` and `meta.guestOnly`. Guards await `authStore.initPromise` before evaluating, so session hydration completes before any redirect. When redirecting an unauthenticated user to `/login`, the guard passes `?redirectTo=<original path>` as a query param; `LoginPage` reads this and redirects back after successful login.

### Data layer (web)

All API types and the `api` fetch client live in `packages/api/src/index.ts` — import via `import { api, ApiProduct, ... } from 'api'`.

**Data fetching uses [Pinia Colada](https://github.com/posva/pinia-colada)** (registered in `main.ts` with global `staleTime: 30s`, `gcTime: 5min`, `refetchOnWindowFocus: true`). Query option factories and mutations live in `src/queries/`:

- **`useProducts.ts`** — `productsQuery(filters)` factory; key `['products', 'list', filters]`
- **`useProduct.ts`** — `productQuery(id)` factory; key `['products', id]`
- **`useCategories.ts`** — `categoriesQuery`; staleTime 5 min
- **`useRecommendations.ts`** — `recommendationsQuery(productId)`; key `['products', id, 'recommendations']`; staleTime 1 min
- **`useDisplayPromos.ts`** — `displayPromosQuery`; key `['promos', 'display']`; staleTime 1 min. Used by `ProductCard` and `ProductPage` to show sale prices; no auth required.
- **`useWishlist.ts`** — `wishlistQuery` + `useToggleWishlist` mutation. Toggle uses `onSettled` to invalidate (reverts to server state on error).
- **`useAddresses.ts`** — `addressesQuery` + `useCreateAddress` (optimistic `setQueryData` prepend) + `useDeleteAddress` (optimistic filter).
- **`useOrders.ts`** — `ordersQuery`, `orderQuery(id)` + `useCreateOrder` mutation; invalidates `QUERY_KEYS.orders` (`['orders']`) on success, which hierarchically covers `['orders', id]` too.
- **`useReviews.ts`** — `productReviewsQuery(id)`, `reviewEligibilityQuery(id)`, `useSubmitReview` mutation; on success invalidates reviews, eligibility, and the product query (to refresh rating).
- **`keys.ts`** — exports `QUERY_KEYS = { orders: ['orders'] }` for bulk invalidation.

**Pinia stores** (`src/stores/`) handle state that doesn't fit the query model:

- **`useAuthStore`** — uses `useQuery` for session hydration (`['auth', 'me']`); exposes `initPromise` (resolves when first auth query settles — route guards await this before redirecting); exposes `user`, `login`, `logout`, `register` via mutations. `logout` invalidates wishlist, orders, and addresses queries.
- **`useCartStore`** — persists `cartId` in `localStorage`; uses `useQuery` to hydrate cart data (disabled when no `cartId`); `ensureCart()` creates a cart on first add. Exposes `cartItems`, `addToCart`, `updateQuantity`, `removeFromCart`, `clearCart` (optimistic `setQueryData`).
- **`usePromoStore`** — hybrid: `useQuery` for auto-promos (enabled by setting `autoPromosCartId`), `useMutation` for code validation. Exposes `appliedPromo`, `autoPromos`, `activeDiscount` (manual code takes priority over best auto promo), `loading` (from mutation `isLoading`), `error` (manual ref — must be clearable independently), `validateCode(code, cartId)`, `fetchAutoPromos(cartId)`, `clearPromo()`, `reset()`.

`ProfilePage` (`/profile/:tab`) is the user hub with four tabs: **info** (read-only email + join date), **password** (change password form using `api.changePassword()`), **orders** (query enabled only when `tab === 'orders'`), and **addresses** (query enabled only when `tab === 'addresses'`).

`src/constants.ts` exports `IMAGE` — a placeholder image URL used across product displays.

`src/utils/format.ts` — `formatPrice(amount: number)` (formats as `$X.XX`) and `getVariantLabel(variant)` (joins option values with ` / `).

`src/utils/promo.ts` — `getPromoForProduct(displayPromos, product)` and `getDiscountedPrice(price, promo)` pure helpers. Used by `ProductCard` and `ProductPage` to compute sale prices from `displayPromosQuery` data.

Font: **Titillium Web** (400 & 700 weights) via `@fontsource/titillium-web` in `App.vue`.

### API Types

Key types in `packages/api/src/index.ts`:

- **`ApiProduct`** — includes optional `variantTypes?`, `variants?`, `priceRange?: { min, max }`, `defaultVariantId?`, `averageRating?`, `reviewCount?`. Ratings computed server-side.
- **`ApiVariantType`** — `{ id, name, position, options: ApiVariantOption[] }`. Options ordered by `position`.
- **`ApiVariantOption`** — `{ id, value, position, variantTypeId }`
- **`ApiProductVariant`** — `{ id, productId, price, stock, image, isDefault, values: ApiProductVariantValue[] }`
- **`ApiCartItem`** — `{ cartId, variantId, quantity, variant: ApiProductVariant & { product: ApiProduct } }`. Access product via `cartItem.variant.product`, price via `cartItem.variant.price`.
- **`ApiOrderItem`** — `{ orderId, variantId, quantity, price, variant: ApiProductVariant & { product: ApiProduct } }`. `price` is a snapshot taken at order creation time.
- **`ApiOrder`** — includes `total`, `discountAmount`, `shippingCost`, `promoId`, `promo?: ApiPromo | null`, `orderItems`, `address`.
- **`ApiPromo`** — `{ id, code: string | null, description, discountType: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING', discountValue, scope: 'ORDER' | 'PRODUCT' | 'CATEGORY' }`
- **`ApiPromoValidation`** — `{ promo: ApiPromo, discountAmount: number }` — returned by the validate endpoint.
- **`ApiDisplayPromo`** — `{ id, description, discountType, discountValue, scope: 'PRODUCT' | 'CATEGORY', productId: string | null, categoryId: string | null }` — lightweight promo for showing sale prices on listings/product pages; no auth required.
- **`ProductFilters`** — `{ page?, search?, categoryId?, minPrice?, maxPrice?, minRating?, excludeOutOfStock? }`

### Product Variants

Every product has at least one `ProductVariant` (simple products get a single default variant). This means cart/order operations always reference a `variantId`, never a `productId` directly.

**ProductPage variant selector** — for products with `variantTypes`, renders pill buttons per type. Selection is stored in URL query params (key = slugified type name, e.g. `pot-size`, value = optionId). On mount, auto-initialises params from the default variant. `selectedVariant` is computed by matching selected option IDs against `product.variants`. If a selected combination has no matching variant, the Add to Cart button is disabled.

Variant label helper — use `getVariantLabel(variant)` from `src/utils/format.ts` (used in cart, checkout, orders). Returns `"Medium (6\") / Terracotta"` style strings.

**Stock display patterns** — `ProductPage` computes `selectedStock`, `isOutOfStock` (stock ≤ 0), `isLowStock` (stock 1–5) from `selectedVariant.stock`; shows inline status and disables Add to Cart when OOS; passes `disableMinus`/`disablePlus` to `QuantityStepper` based on quantity bounds, OOS state, and variant availability. `CartPage` and `CheckoutPage` both compute `hasStockIssue` (any item where `quantity > variant.stock` or stock = 0) to disable the proceed/place-order button and surface per-item warnings.

**Wishlists are product-level**, not variant-level — the `WishlistButton` takes `productId`. The wishlist "Add to Cart" uses `item.product.defaultVariantId`.

**Reviews are product-level** — one review per user per product regardless of variant.

### Shared Components

**Base primitives live in `packages/ui`** — import via `import { X } from 'ui'`:
- **`BaseButton`** — props: `variant` (`primary` | `dark` | `ghost` | `text`), `size` (`sm` | `md` | `lg`), `type`, `disabled`, `loading`, `fullWidth`. `loading` shows a spinner and disables the button.
- **`BaseInput`** — props: `modelValue`, `type`, `placeholder`, `id`, `disabled`, `error`, `variant` (`default` | `ghost`). Uses `inheritAttrs: false` with `v-bind="$attrs"` on the `<input>` so arbitrary HTML attributes (e.g. `autocomplete`, `required`) pass through directly.
- **`EmptyState`** — props: `heading`, `message`; named slot `#action` for the link/button. The `.empty-link` CSS class is provided as a non-scoped style for use in slot content. Example: `<template #action><router-link to="/" class="empty-link">Go →</router-link></template>`
- **`QuantityStepper`** — props: `quantity`, `disableMinus?`, `disablePlus?`; emits `change` with new quantity. Purely presentational — all disable logic is computed by the parent.
- **`StarRating`** — presentational; props: `rating: number | null`, `count?: number`, `size?: 'sm' | 'md'`.
- **`PaginationControls`** — props: `page`, `total`, `pageSize`; emits `prev`/`next`.

Feature components in `packages/web/src/components/`:
- **`ProductReviews.vue`** — props: `productId`. Uses `productReviewsQuery` and `reviewEligibilityQuery` (eligibility only enabled when authenticated). `useSubmitReview` mutation invalidates reviews, eligibility, and product on success.
- **`ReviewForm.vue`** — extracted form used inside `ProductReviews.vue`.
- **`WishlistButton.vue`** — props: `productId`; self-contained heart toggle. Calls `useQuery(wishlistQuery)` (disabled for guests). Always calls `preventDefault` + `stopPropagation` (safe to nest inside `<router-link>`). Redirects guests to `/login?redirectTo=<current path>`.
- **`AddressForm.vue`** — self-contained address creation form; calls `useCreateAddress` mutation internally; emits `saved(ApiAddress)` and `cancel`. Used in CheckoutPage and ProfilePage.
- **`FilterPanel.vue`** — sidebar filter UI; props: `categories`, `categoryId`, `minPrice`, `maxPrice`, `minRating`, `excludeOutOfStock`; emits `category-change`, `price-change`, `rating-change`, `stock-change`, `clear`.
- **`ProductCard.vue`** — shows "From $X.XX" when `product.priceRange.min !== product.priceRange.max`, otherwise flat price.

### Pagination, Search & Filtering

`GET /api/products` supports `?page=N&search=query&categoryId=X&minPrice=N&maxPrice=N&minRating=N&excludeOutOfStock=true` — returns `{ items: ApiProduct[], total: number }` (9/page, `createdAt asc`). `HomePage` reads all filter params from the URL query, builds a `filters` computed, and passes it to `useQuery(() => productsQuery(filters.value))` — Pinia Colada re-fetches automatically when the key changes. Search and price inputs are debounced (300ms) via `src/composables/useDebounce.ts` before pushing to the URL; category, rating, and stock-toggle changes are immediate. `PaginationControls.vue` is presentational (props: `page`, `total`, `pageSize`; emits `prev`/`next`). `ProductPage` fetches via `useQuery(() => productQuery(productId.value))` — the reactive key handles navigation between products without remounting. ProductPage also prefetches `displayPromosQuery` and (for authenticated users) `wishlistQuery` to warm the cache for child components. Recommendations use `recommendationsQuery(productId)` and render non-blocking below the product.

### Linting & Formatting

Two linters run in sequence via `npm run lint`:
1. **oxlint** — configured in `.oxlintrc.json`
2. **eslint** — Vue-specific rules, configured in `eslint.config.ts`

Formatting uses **oxfmt** (not Prettier) scoped to `src/`. ESLint uses `eslint-config-prettier` to avoid conflicts.

## API Package (`packages/api/`)

No build step — Vite in consuming packages compiles source directly via the `api` path alias. To wire up a new consuming package (e.g. `packages/admin`):
1. Add `"api": "*"` to `dependencies` in its `package.json`
2. Add `{ find: 'api', replacement: fileURLToPath(new URL('../api/src/index.ts', import.meta.url)) }` to the `alias` array in `vite.config.ts`
3. Add `"api": ["../api/src/index.ts"]` to `paths` in `tsconfig.app.json`

## UI Package (`packages/ui/`)

No build step — Vite in consuming packages compiles source directly via path aliases. To wire up a new consuming package (e.g. `packages/admin`):
1. Add `"ui": "*"` to `dependencies` in its `package.json`
2. Add aliases to its `vite.config.ts` as an **array** (order matters — CSS-specific aliases must come before `ui`):
   ```ts
   alias: [
     { find: 'ui/theme.css', replacement: fileURLToPath(new URL('../ui/src/theme.css', import.meta.url)) },
     { find: 'ui/reset.css', replacement: fileURLToPath(new URL('../ui/src/reset.css', import.meta.url)) },
     { find: 'ui', replacement: fileURLToPath(new URL('../ui/src/index.ts', import.meta.url)) },
   ]
   ```
3. Add matching `paths` entries to `tsconfig.app.json`
4. In the app's global CSS: `@import 'ui/theme.css'; @import 'ui/reset.css';`

New base/presentational components go in `packages/ui/src/components/` and must be re-exported from `packages/ui/src/index.ts`.

## Server Architecture (`packages/server/`)

**Hono** on `@hono/node-server`, port 3000. CORS restricted to `http://localhost:5173` with `credentials: true`.

### Shared Schemas (`packages/schemas/`)

Zod schemas shared between web and server. No build step — same source-import-via-alias pattern as `packages/ui`. Server imports via `schemas` path alias (configured in `packages/server/tsconfig.json`). Exports: `RegisterSchema`, `LoginSchema`, `ChangePasswordSchema`, `ProductQuerySchema`, `CreateOrderSchema`, `AddCartItemSchema`, `UpdateCartItemSchema`, `CreateReviewSchema`, `AddWishlistItemSchema`, `CreateAddressSchema`, `ValidatePromoSchema`.

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
- `product.service.ts` — listProducts (filter/enrichment pipeline), getProductById, getRecommendations (same-category first, fills remainder from other categories). Shared `enrichProducts()` helper adds `averageRating`, `reviewCount`, `priceRange`, `defaultVariantId`, `totalStock` to any product array.
- `promo.service.ts` — validatePromoCode, getAutoPromos, validatePromoInTransaction
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
- `GET /api/products?page=N&search=query&categoryId=X&minPrice=N&maxPrice=N&minRating=N&excludeOutOfStock=true` — returns `{ items, total }` with `priceRange`, `defaultVariantId`, `averageRating`, `reviewCount`, `totalStock` per product; `GET /api/products/:id` — includes full `variantTypes` (with nested `options`) and `variants` (with nested `values.option`; each variant includes `stock`); `GET /api/products/:id/recommendations?limit=N` — returns up to N (max 10, default 5) enriched `ApiProduct[]`, same-category first
- `GET /api/categories`
- `POST /api/carts`; `GET /api/carts/:id` — includes `cartItems → variant → product` and `variant → values → option`
- `POST /api/carts/:id/items` — body `{ variantId, quantity }`, upserts (increments qty); rejects with 400 if `currentQtyInCart + quantity > variant.stock`
- `PATCH /api/carts/:id/items/:variantId` — set quantity; rejects with 400 if `quantity > variant.stock`; `DELETE /api/carts/:id/items/:variantId`
- `POST /api/orders` — body `{ cartId, addressId?, promoCode?, shippingCost? }`; resolves promo before transaction, re-validates inside transaction; calculates `total = subtotal - discountAmount + shippingCost`; snapshots price into each `OrderItem.price`; atomically decrements stock; clears cart; returns order with `promo` included
- `GET /api/orders`; `GET /api/orders/:id` — includes `orderItems → variant → product`, `variant → values → option`, and `promo`
- `GET /api/addresses`; `POST /api/addresses` — body `{ label?, line1, line2?, city, state, zip, country? }`; `DELETE /api/addresses/:id` — ownership-checked
- `GET /api/reviews/product/:productId`; `GET /api/reviews/eligibility/:productId` — checks `orderItem.variant.productId` (purchase required); `POST /api/reviews` — body `{ productId, rating (1–5), body? }`; upserts
- `GET /api/wishlist` — returns items with product (includes `defaultVariantId`); `POST /api/wishlist` — body `{ productId }`; `DELETE /api/wishlist/:productId`
- `POST /api/promos/validate` (requires auth) — body `{ code, cartId }`; returns `{ promo, discountAmount }` or 400 with reason
- `GET /api/promos/auto?cartId=X` (requires auth) — returns array of `{ promo, discountAmount }` for applicable automatic promos, sorted by discount descending
- `GET /api/promos/display` (no auth) — returns `ApiDisplayPromo[]` for active PRODUCT/CATEGORY scoped promos; used to show sale prices on product listings and product pages

### Database

Prisma with **better-sqlite3** adapter. Schema in `packages/server/prisma/schema.prisma`. Generated client outputs to `prisma/generated/`.

SQLite does not have native enum support. Prisma enums (`PromoScope`, `DiscountType`) are stored as TEXT but enforced at the application layer. After adding/changing enums, run `npx prisma generate` — a migration may not be required but the client must be regenerated.

**Models:**

- `Category` — `name @unique`
- `Product` — has optional `categoryId` FK; `price` field serves as base/display price for listings
- `VariantType` — belongs to Product (`onDelete: Cascade`); fields: `name`, `position`
- `VariantOption` — belongs to VariantType (`onDelete: Cascade`); fields: `value`, `position`
- `ProductVariant` — belongs to Product (`onDelete: Cascade`); fields: `price`, `stock` (default 0), `image?`, `isDefault`. Every product has ≥1 variant; simple products have exactly one with `isDefault: true`
- `ProductVariantValue` — join table (composite PK: `[variantId, optionId]`) linking ProductVariant to VariantOption
- `CartItem` — composite PK `[cartId, variantId]`; quantity only
- `OrderItem` — composite PK `[orderId, variantId]`; stores `quantity` and `price` snapshot
- `Order` — has `userId` FK, optional `addressId` FK, `total`, `discountAmount` (default 0), `shippingCost` (default 0), optional `promoId` FK
- `Promo` — `code` (unique, nullable for automatic promos), `discountType` (`DiscountType`), `discountValue`, `scope` (`PromoScope`), optional `productId`/`categoryId` for scoped promos, `minOrderAmount?`, `maxUses?`, `maxUsesPerUser?`, `expiresAt?`, `isActive`, `isAutomatic`
- `PromoUsage` — `@@unique([promoId, orderId])`; `@@index([promoId, userId])` for per-user count queries
- `User`, `Session` (7-day expiry), `Review` (`@@unique([userId, productId])`), `WishlistItem` (composite PK `[userId, productId]`), `Address`

`DATABASE_URL` is set in `packages/server/.env` (default: `file:./dev.db`).

After schema changes: `npx prisma migrate dev --name <migration-name>` from `packages/server/`. The seed (`prisma/seed.ts`) creates 3 products with Pot Size + Pot Color variants (sparse combinations), 9 simple products with single default variants, and 5 promos: `SAVE10` (10% off), `FLAT5` ($5 off $25+), `FREESHIP` (free shipping $50+), `SUCCULENTS20` (20% off Succulents & Cacti category), and an automatic 5% discount on orders over $75.
