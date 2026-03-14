<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
import { useOrderStore } from '@/stores/order'
import { useAddressStore } from '@/stores/address'
import { usePromoStore } from '@/stores/promo'
import { computed, onMounted, ref, watch } from 'vue'
import type { ApiAddress } from '@/services/api'
import { useRouter } from 'vue-router'
import { IMAGE } from '@/constants'
import { formatPrice, getVariantLabel } from '@/utils/format'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'
import AddressForm from '@/components/AddressForm.vue'

const orderStore = useOrderStore()
const cartStore = useCartStore()
const addressStore = useAddressStore()
const promoStore = usePromoStore()
const router = useRouter()

onMounted(async () => {
  if (cartStore.cartItems.length === 0) {
    router.push('/')
    return
  }
  await addressStore.fetchAddresses()
  if (addressStore.items.length > 0) {
    selectedAddressId.value = addressStore.items[0]!.id
  } else {
    showNewAddressForm.value = true
  }
  if (cartStore.cartId) {
    await promoStore.fetchAutoPromos(cartStore.cartId)
  }
})

// --- Shipping ---
const selectedShipping = ref('standard')

const shippingOptions = [
  { id: 'standard', label: 'Standard Shipping', detail: '5–7 business days', price: 0 },
  { id: 'express', label: 'Express Shipping', detail: '2–3 business days', price: 9.99 },
  { id: 'overnight', label: 'Overnight', detail: 'Next business day', price: 24.99 },
]

const isFreeShipping = computed(
  () => promoStore.activeDiscount?.promo.discountType === 'FREE_SHIPPING',
)

const shippingCost = computed(() => {
  if (isFreeShipping.value) return 0
  return shippingOptions.find((o) => o.id === selectedShipping.value)?.price ?? 0
})

// --- Address ---
const selectedAddressId = ref<string | null>(null)
const showNewAddressForm = ref(false)

const selectAddress = (id: string) => {
  selectedAddressId.value = id
  showNewAddressForm.value = false
}

const selectNewAddress = () => {
  selectedAddressId.value = null
  showNewAddressForm.value = true
}

// when AddressForm saves a new address, auto-select it and close the form
const onAddressSaved = (address: ApiAddress) => {
  selectedAddressId.value = address.id
  showNewAddressForm.value = false
}

// auto-select first when addresses load
watch(
  () => addressStore.items,
  (items) => {
    if (items.length > 0 && selectedAddressId.value === null && !showNewAddressForm.value) {
      selectedAddressId.value = items[0]!.id
    }
  },
)

// --- Promo ---
const promoCodeInput = ref('')

const applyPromo = async () => {
  if (!promoCodeInput.value.trim() || !cartStore.cartId) return
  await promoStore.validateCode(promoCodeInput.value.trim(), cartStore.cartId)
  if (promoStore.appliedPromo) promoCodeInput.value = ''
}

const removePromo = () => {
  promoStore.clearPromo()
  promoCodeInput.value = ''
}

// --- Order ---
const cartSubtotal = computed(() =>
  cartStore.cartItems.reduce((total, item) => total + item.variant.price * item.quantity, 0),
)

const hasStockIssue = computed(() =>
  cartStore.cartItems.some(
    (item) => item.variant.stock <= 0 || item.quantity > item.variant.stock,
  ),
)

const discountAmount = computed(() => promoStore.activeDiscount?.discountAmount ?? 0)

const orderTotal = computed(
  () => Math.max(0, cartSubtotal.value - discountAmount.value) + shippingCost.value,
)

const createOrder = async () => {
  const promoCode = promoStore.activeDiscount?.promo.code ?? undefined
  const orderId = await orderStore.createOrder(
    cartStore.cartId!,
    selectedAddressId.value ?? undefined,
    promoCode,
  )
  if (!orderId) return

  promoStore.reset()
  cartStore.clearCart()
  router.push(`/success?orderId=${orderId}`)
}
</script>

<template>
  <main class="page">
    <div class="page-inner">
      <div class="page-header">
        <p class="page-label">Almost There</p>
        <h1 class="page-title">Checkout</h1>
      </div>

      <div class="checkout-layout">
        <!-- Left: Address + Shipping -->
        <div class="checkout-left">
          <!-- Delivery Address -->
          <section class="section">
            <h2 class="section-title">Delivery Address</h2>

            <div v-if="addressStore.loading" class="address-loading">Loading addresses…</div>

            <div v-else class="address-options">
              <!-- Saved addresses -->
              <label
                v-for="addr in addressStore.items"
                :key="addr.id"
                class="address-option"
                :class="{ 'is-selected': selectedAddressId === addr.id && !showNewAddressForm }"
                @click="selectAddress(addr.id)"
              >
                <input
                  type="radio"
                  name="address"
                  :value="addr.id"
                  :checked="selectedAddressId === addr.id && !showNewAddressForm"
                  class="address-radio"
                />
                <div class="address-option-body">
                  <span class="shipping-dot"></span>
                  <div class="address-text">
                    <p v-if="addr.label" class="address-label">{{ addr.label }}</p>
                    <p class="address-line">
                      {{ addr.line1 }}<span v-if="addr.line2">, {{ addr.line2 }}</span>
                    </p>
                    <p class="address-line">{{ addr.city }}, {{ addr.state }} {{ addr.zip }}</p>
                  </div>
                </div>
              </label>

              <!-- Add new address option -->
              <label
                class="address-option address-option--new"
                :class="{ 'is-selected': showNewAddressForm }"
                @click="selectNewAddress"
              >
                <input
                  type="radio"
                  name="address"
                  value="new"
                  :checked="showNewAddressForm"
                  class="address-radio"
                />
                <div class="address-option-body">
                  <span class="shipping-dot"></span>
                  <span class="address-new-label">+ Add new address</span>
                </div>
              </label>
            </div>

            <!-- New address form -->
            <div v-if="showNewAddressForm" class="new-address-form">
              <AddressForm
                @saved="onAddressSaved"
                @cancel="selectedAddressId && (showNewAddressForm = false)"
              />
            </div>
          </section>

          <!-- Shipping Method -->
          <section class="section">
            <h2 class="section-title">Shipping Method</h2>
            <div class="shipping-options">
              <label
                v-for="option in shippingOptions"
                :key="option.id"
                class="shipping-option"
                :class="{ 'is-selected': selectedShipping === option.id }"
              >
                <input
                  type="radio"
                  name="shipping"
                  :id="option.id"
                  :value="option.id"
                  v-model="selectedShipping"
                  class="shipping-radio"
                />
                <div class="shipping-option-body">
                  <div class="shipping-option-left">
                    <span class="shipping-dot"></span>
                    <div>
                      <p class="shipping-label">{{ option.label }}</p>
                      <p class="shipping-detail">{{ option.detail }}</p>
                    </div>
                  </div>
                  <span class="shipping-price">
                    {{ option.price === 0 ? 'Free' : formatPrice(option.price) }}
                  </span>
                </div>
              </label>
            </div>
          </section>
        </div>

        <!-- Right: Order Summary -->
        <div class="checkout-right">
          <section class="section summary-section">
            <h2 class="section-title">Order Summary</h2>

            <ul class="summary-list">
              <li
                v-for="cartItem in cartStore.cartItems"
                :key="cartItem.variantId"
                class="summary-item"
              >
                <div class="summary-item-image-wrap">
                  <img
                    :src="cartItem.variant.image ?? cartItem.variant.product.image ?? IMAGE"
                    :alt="cartItem.variant.product.name"
                    class="summary-item-image"
                  />
                  <span class="summary-item-qty">{{ cartItem.quantity }}</span>
                </div>
                <div class="summary-item-info">
                  <p class="summary-item-name">{{ cartItem.variant.product.name }}</p>
                  <p v-if="cartItem.variant.values.length" class="summary-item-variant">
                    {{ getVariantLabel(cartItem.variant) }}
                  </p>
                  <p v-if="cartItem.variant.stock <= 0" class="summary-item-stock-warn summary-item-stock-warn--oos">
                    Out of stock
                  </p>
                  <p v-else-if="cartItem.quantity > cartItem.variant.stock" class="summary-item-stock-warn">
                    Only {{ cartItem.variant.stock }} available
                  </p>
                </div>
                <p class="summary-item-price">
                  {{ formatPrice(cartItem.variant.price * cartItem.quantity) }}
                </p>
              </li>
            </ul>

            <!-- Promo Code -->
            <div class="promo-section">
              <!-- Auto-promo banner -->
              <div
                v-if="promoStore.autoPromos.length > 0 && !promoStore.appliedPromo"
                class="promo-auto-banner"
              >
                <span class="promo-auto-icon">✦</span>
                <span>{{ promoStore.autoPromos[0]!.promo.description }} — auto-applied</span>
              </div>

              <!-- Applied manual code badge -->
              <div v-if="promoStore.appliedPromo" class="promo-applied">
                <div class="promo-applied-info">
                  <span class="promo-applied-code">{{ promoStore.appliedPromo.promo.code }}</span>
                  <span class="promo-applied-desc">{{ promoStore.appliedPromo.promo.description }}</span>
                </div>
                <button class="promo-remove" @click="removePromo">Remove</button>
              </div>

              <!-- Code input (hidden when manual code already applied) -->
              <div v-else class="promo-input-row">
                <BaseInput
                  v-model="promoCodeInput"
                  placeholder="Promo code"
                  variant="ghost"
                  class="promo-input"
                  @keydown.enter="applyPromo"
                />
                <BaseButton
                  variant="dark"
                  size="sm"
                  :loading="promoStore.loading"
                  :disabled="!promoCodeInput.trim()"
                  @click="applyPromo"
                >
                  Apply
                </BaseButton>
              </div>
              <p v-if="promoStore.error" class="promo-error">{{ promoStore.error }}</p>
            </div>

            <div class="totals">
              <div class="totals-row">
                <span class="totals-label">Subtotal</span>
                <span class="totals-value">{{ formatPrice(cartSubtotal) }}</span>
              </div>
              <div v-if="discountAmount > 0" class="totals-row totals-row--discount">
                <span class="totals-label">Discount</span>
                <span class="totals-value totals-value--discount">−{{ formatPrice(discountAmount) }}</span>
              </div>
              <div class="totals-row">
                <span class="totals-label">Shipping</span>
                <span class="totals-value">
                  {{ shippingCost === 0 ? 'Free' : formatPrice(shippingCost) }}
                </span>
              </div>
              <div class="totals-row totals-row--total">
                <span class="totals-total-label">Total</span>
                <span class="totals-total-value">{{ formatPrice(orderTotal) }}</span>
              </div>
            </div>

            <p v-if="hasStockIssue" class="order-error">
              Some items in your cart are out of stock. Please update your cart before placing an order.
            </p>
            <p v-else-if="orderStore.error" class="order-error">{{ orderStore.error }}</p>
            <BaseButton size="lg" full-width :loading="orderStore.loading" :disabled="hasStockIssue" @click="createOrder">
              {{ orderStore.loading ? 'Placing order…' : 'Place Order' }}
            </BaseButton>
          </section>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.page {
  flex: 1;
}

.page-inner {
  max-width: 1000px;
  margin-inline: auto;
  padding-inline: 1.5rem;
  padding-block: 3rem 5rem;
}

/* Header */
.page-header {
  margin-bottom: 2.5rem;
}

.page-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-mint-dark);
  margin-bottom: 0.5rem;
}

.page-title {
  font-size: 2.75rem;
  font-weight: 700;
  color: var(--color-charcoal);
  letter-spacing: -0.04em;
  line-height: 1;
}

/* Layout */
.checkout-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  align-items: start;
}

@media (min-width: 720px) {
  .checkout-layout {
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
}

.checkout-left {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Sections */
.section {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.75rem;
  box-shadow: var(--shadow-card);
}

.section-title {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-stone);
  margin-bottom: 1.25rem;
}

/* Address options */
.address-loading {
  font-size: 0.875rem;
  color: var(--color-stone);
  padding: 0.5rem 0;
}

.address-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.address-option {
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}

.address-option.is-selected {
  border-color: var(--color-mint);
  background: var(--color-mint-50);
}

.address-radio {
  display: none;
}

.address-option-body {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem 1.125rem;
}

.address-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.address-label {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-charcoal);
}

.address-line {
  font-size: 0.8125rem;
  color: var(--color-stone);
}

.address-new-label {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-charcoal);
}

.address-option--new .address-option-body {
  padding-block: 1rem;
}

/* New address form */
.new-address-form {
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-border);
}

/* Shipping options */
.shipping-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.shipping-option {
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}

.shipping-option.is-selected {
  border-color: var(--color-mint);
  background: var(--color-mint-50);
}

.shipping-radio {
  display: none;
}

.shipping-option-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.125rem;
  gap: 0.75rem;
}

.shipping-option-left {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.shipping-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  flex-shrink: 0;
  position: relative;
  transition: border-color 0.2s ease;
}

.address-option.is-selected .shipping-dot,
.shipping-option.is-selected .shipping-dot {
  border-color: var(--color-mint-dark);
}

.address-option.is-selected .shipping-dot::after,
.shipping-option.is-selected .shipping-dot::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: var(--color-mint-dark);
}

.shipping-label {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-charcoal);
  margin-bottom: 0.125rem;
}

.shipping-detail {
  font-size: 0.8125rem;
  color: var(--color-stone);
}

.shipping-price {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-charcoal);
  white-space: nowrap;
}

/* Summary list */
.summary-list {
  list-style: none;
  border-top: 1px solid var(--color-border);
  margin-bottom: 0;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding-block: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.summary-item-image-wrap {
  position: relative;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
}

.summary-item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  background: var(--color-mint-50);
  border: 1px solid var(--color-mint-100);
}

.summary-item-qty {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-charcoal);
  color: white;
  font-size: 0.6875rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.summary-item-name {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-charcoal);
}

.summary-item-variant {
  font-size: 0.8rem;
  color: var(--color-stone);
}

.summary-item-stock-warn {
  font-size: 0.75rem;
  font-weight: 700;
  color: #b45309;
  margin-top: 0.125rem;
}

.summary-item-stock-warn--oos {
  color: #b91c1c;
}

.summary-item-price {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-charcoal);
}

/* Promo */
.promo-section {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.promo-auto-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-mint-50);
  border: 1px solid var(--color-mint-100);
  border-radius: 8px;
  padding: 0.625rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-mint-dark);
}

.promo-auto-icon {
  font-size: 0.75rem;
  flex-shrink: 0;
}

.promo-applied {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  background: var(--color-mint-50);
  border: 1.5px solid var(--color-mint);
  border-radius: 8px;
  padding: 0.625rem 0.875rem;
}

.promo-applied-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.promo-applied-code {
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--color-mint-dark);
  text-transform: uppercase;
}

.promo-applied-desc {
  font-size: 0.75rem;
  color: var(--color-stone);
}

.promo-remove {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-stone);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  flex-shrink: 0;
  transition: color 0.15s ease;
}

.promo-remove:hover {
  color: var(--color-charcoal);
}

.promo-input-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.promo-input {
  flex: 1;
}

.promo-error {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #d94f4f;
}

/* Totals */
.totals {
  padding-top: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  margin-bottom: 1.5rem;
}

.totals-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.totals-label {
  font-size: 0.875rem;
  color: var(--color-stone);
}

.totals-value {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-charcoal);
}

.totals-row--discount .totals-label {
  color: var(--color-mint-dark);
}

.totals-value--discount {
  color: var(--color-mint-dark);
}

.totals-row--total {
  padding-top: 0.75rem;
  border-top: 2px solid var(--color-charcoal);
  margin-top: 0.25rem;
}

.totals-total-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-stone);
}

.totals-total-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-charcoal);
  letter-spacing: -0.03em;
}

.order-error {
  font-size: 0.875rem;
  font-weight: 700;
  color: #d94f4f;
  margin-bottom: 0.75rem;
}

@media (max-width: 640px) {
  .page-title {
    font-size: 1.75rem;
  }

  .section {
    padding: 1.25rem;
  }

  .page-inner {
    padding-inline: 1rem;
  }
}
</style>
