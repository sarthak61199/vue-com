# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm run dev          # start dev server
npm run build        # type-check + build for production
npm run lint         # run oxlint then eslint (both with --fix)
npm run format       # format src/ with oxfmt
npm run type-check   # vue-tsc type checking only
```

No test suite is configured yet.

## Architecture

Vue 3 + TypeScript SPA scaffolded with Vite. Stack:
- **Vue Router 5** — file-based page components in `src/pages/`, registered manually in `src/router/index.ts`
- **Pinia** — stores in `src/stores/`
- **`@` alias** resolves to `src/`

`src/App.vue` renders `<AppHeader>`, `<router-view />`, and `<AppFooter>` (layout components in `src/components/`). All page-level components live in `src/pages/`. Current routes: `/` (HomePage), `/product/:id` (ProductPage), `/cart` (CartPage), `/checkout` (CheckoutPage), `/success` (SuccessPage).

### Data layer

- **Types** — `src/types/index.ts` defines `Product`, `CartItem`, `Order`, and `OrderItem` interfaces
- **Mock data** — `src/mock/product.ts` exports `MOCK_PRODUCTS` (seeded into `useProductStore` at init)
- **`useProductStore`** — holds `products` ref, exposes `getProductById(id)`
- **`useCartStore`** — holds `cartItems` ref, exposes `addToCart({ productId, quantity })` and `removeFromCart(productId)`
- **`useOrderStore`** — holds `order` ref (array), exposes `createOrder(orderItems)` (returns new order id) and `getOrderById(id)`

Font: **Titillium Web** (400 & 700 weights) loaded via `@fontsource/titillium-web` in `App.vue`.

## Linting & Formatting

Two linters run in sequence via `npm run lint`:
1. **oxlint** — fast Rust-based linter, configured in `.oxlintrc.json`
2. **eslint** — handles Vue-specific rules, configured in `eslint.config.ts`

Formatting uses **oxfmt** (not Prettier) scoped to `src/`. ESLint is configured with `eslint-config-prettier` to avoid conflicts.
