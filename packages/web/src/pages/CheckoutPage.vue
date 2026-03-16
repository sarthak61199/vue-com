<script setup lang="ts">
import AddressForm from '@/components/AddressForm.vue'
import { BaseButton } from 'ui'
import CheckoutItemList from '@/components/CheckoutItemList.vue'
import CheckoutPromo from '@/components/CheckoutPromo.vue'
import OrderTotals from '@/components/OrderTotals.vue'
import ShippingSelector from '@/components/ShippingSelector.vue'
import { addressesQuery } from '@/queries/useAddresses'
import { useCreateOrder } from '@/queries/useOrders'
import type { ApiAddress } from 'api'
import { useCartStore } from '@/stores/cart'
import { usePromoStore } from '@/stores/promo'
import { useQuery } from '@pinia/colada'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const cartStore = useCartStore()
const promoStore = usePromoStore()
const router = useRouter()

// --- Addresses ---
const { data: addressesData, isPending: addressesLoading } = useQuery(addressesQuery)
const addresses = computed(() => addressesData.value ?? [])

// --- Order creation ---
const { mutateAsync: createOrderMutate, isLoading: orderLoading, error: orderError } = useCreateOrder()

if (cartStore.cartItems.length === 0) {
  router.push('/')
}

// Fetch auto promos once we have a cartId
if (cartStore.cartId) {
  promoStore.fetchAutoPromos(cartStore.cartId)
}

// --- Shipping ---
const isFreeShipping = computed(
  () => promoStore.activeDiscount?.promo.discountType === 'FREE_SHIPPING',
)
const shippingCost = ref(0)

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
watch(addresses, (items) => {
  if (items.length > 0 && selectedAddressId.value === null && !showNewAddressForm.value) {
    selectedAddressId.value = items[0]!.id
  }
  if (items.length === 0 && !showNewAddressForm.value) {
    showNewAddressForm.value = true
  }
}, { immediate: true })

// --- Order ---
const hasStockIssue = computed(() =>
  cartStore.cartItems.some(
    (item) => item.variant.stock <= 0 || item.quantity > item.variant.stock,
  ),
)

const createOrder = async () => {
  const promoCode = promoStore.activeDiscount?.promo.code ?? undefined
  const order = await createOrderMutate({
    cartId: cartStore.cartId!,
    addressId: selectedAddressId.value ?? undefined,
    promoCode,
    shippingCost: shippingCost.value,
  })
  promoStore.reset()
  cartStore.clearCart()
  router.push(`/success?orderId=${order.id}`)
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

            <div v-if="addressesLoading" class="address-loading">Loading addresses…</div>

            <div v-else class="address-options">
              <!-- Saved addresses -->
              <label v-for="addr in addresses" :key="addr.id" class="address-option"
                :class="{ 'is-selected': selectedAddressId === addr.id && !showNewAddressForm }"
                @click="selectAddress(addr.id)">
                <input type="radio" name="address" :value="addr.id"
                  :checked="selectedAddressId === addr.id && !showNewAddressForm" class="address-radio" />
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
              <label class="address-option address-option--new" :class="{ 'is-selected': showNewAddressForm }"
                @click="selectNewAddress">
                <input type="radio" name="address" value="new" :checked="showNewAddressForm" class="address-radio" />
                <div class="address-option-body">
                  <span class="shipping-dot"></span>
                  <span class="address-new-label">+ Add new address</span>
                </div>
              </label>
            </div>

            <!-- New address form -->
            <div v-if="showNewAddressForm" class="new-address-form">
              <AddressForm @saved="onAddressSaved" @cancel="selectedAddressId && (showNewAddressForm = false)" />
            </div>
          </section>

          <!-- Shipping Method -->
          <section class="section">
            <h2 class="section-title">Shipping Method</h2>
            <ShippingSelector :is-free-shipping="isFreeShipping" @change="shippingCost = $event" />
          </section>
        </div>

        <!-- Right: Order Summary -->
        <div class="checkout-right">
          <section class="section summary-section">
            <h2 class="section-title">Order Summary</h2>

            <CheckoutItemList />
            <CheckoutPromo />
            <OrderTotals :shipping-cost="shippingCost" />

            <p v-if="hasStockIssue" class="order-error">
              Some items in your cart are out of stock. Please update your cart before placing an order.
            </p>
            <p v-else-if="orderError" class="order-error">{{ (orderError as Error).message }}</p>
            <BaseButton size="lg" full-width :loading="orderLoading" :disabled="hasStockIssue" @click="createOrder">
              {{ orderLoading ? 'Placing order…' : 'Place Order' }}
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

.shipping-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  flex-shrink: 0;
  position: relative;
  transition: border-color 0.2s ease;
}

.address-option.is-selected .shipping-dot {
  border-color: var(--color-mint-dark);
}

.address-option.is-selected .shipping-dot::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: var(--color-mint-dark);
}

.order-error {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-error);
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
