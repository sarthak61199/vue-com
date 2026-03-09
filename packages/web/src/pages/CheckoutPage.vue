<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
import { useOrderStore } from '@/stores/order'
import { useAddressStore } from '@/stores/address'
import { computed, onMounted, ref, watch } from 'vue'
import type { ApiAddress } from '@/services/api'
import { useRouter } from 'vue-router'
import { IMAGE } from '@/constants'
import BaseButton from '@/components/BaseButton.vue'
import AddressForm from '@/components/AddressForm.vue'

const orderStore = useOrderStore()
const cartStore = useCartStore()
const addressStore = useAddressStore()
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
})

// --- Shipping ---
const selectedShipping = ref('standard')

const shippingOptions = [
    { id: 'standard', label: 'Standard Shipping', detail: '5–7 business days', price: 0 },
    { id: 'express', label: 'Express Shipping', detail: '2–3 business days', price: 9.99 },
    { id: 'overnight', label: 'Overnight', detail: 'Next business day', price: 24.99 },
]

const shippingCost = computed(
    () => shippingOptions.find((o) => o.id === selectedShipping.value)?.price ?? 0,
)

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
watch(() => addressStore.items, (items) => {
    if (items.length > 0 && selectedAddressId.value === null && !showNewAddressForm.value) {
        selectedAddressId.value = items[0]!.id
    }
})

// --- Order ---
const cartSubtotal = computed(() =>
    cartStore.cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0),
)

const orderTotal = computed(() => cartSubtotal.value + shippingCost.value)

const createOrder = async () => {
    const orderId = await orderStore.createOrder(cartStore.cartId!, selectedAddressId.value ?? undefined)
    if (!orderId) return

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
                                        <p class="address-line">{{ addr.line1 }}<span v-if="addr.line2">, {{ addr.line2 }}</span></p>
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
                            <label v-for="option in shippingOptions" :key="option.id" class="shipping-option"
                                :class="{ 'is-selected': selectedShipping === option.id }">
                                <input type="radio" name="shipping" :id="option.id" :value="option.id"
                                    v-model="selectedShipping" class="shipping-radio" />
                                <div class="shipping-option-body">
                                    <div class="shipping-option-left">
                                        <span class="shipping-dot"></span>
                                        <div>
                                            <p class="shipping-label">{{ option.label }}</p>
                                            <p class="shipping-detail">{{ option.detail }}</p>
                                        </div>
                                    </div>
                                    <span class="shipping-price">
                                        {{ option.price === 0 ? 'Free' : `$${option.price.toFixed(2)}` }}
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
                            <li v-for="cartItem in cartStore.cartItems" :key="cartItem.productId" class="summary-item">
                                <div class="summary-item-image-wrap">
                                    <img :src="cartItem.product.image || IMAGE" :alt="cartItem.product.name"
                                        class="summary-item-image" />
                                    <span class="summary-item-qty">{{ cartItem.quantity }}</span>
                                </div>
                                <p class="summary-item-name">{{ cartItem.product.name }}</p>
                                <p class="summary-item-price">
                                    ${{ (cartItem.product.price * cartItem.quantity).toFixed(2) }}
                                </p>
                            </li>
                        </ul>

                        <div class="totals">
                            <div class="totals-row">
                                <span class="totals-label">Subtotal</span>
                                <span class="totals-value">${{ cartSubtotal.toFixed(2) }}</span>
                            </div>
                            <div class="totals-row">
                                <span class="totals-label">Shipping</span>
                                <span class="totals-value">
                                    {{ shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}` }}
                                </span>
                            </div>
                            <div class="totals-row totals-row--total">
                                <span class="totals-total-label">Total</span>
                                <span class="totals-total-value">${{ orderTotal.toFixed(2) }}</span>
                            </div>
                        </div>

                        <p v-if="orderStore.error" class="order-error">{{ orderStore.error }}</p>
                        <BaseButton size="lg" full-width :loading="orderStore.loading" @click="createOrder">
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

.summary-item-name {
    flex: 1;
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--color-charcoal);
}

.summary-item-price {
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--color-charcoal);
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
</style>
