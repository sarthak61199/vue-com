<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
import { useOrderStore } from '@/stores/order'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IMAGE } from '@/constants'

const orderStore = useOrderStore()
const cartStore = useCartStore()
const router = useRouter()

onMounted(() => {
    if (cartStore.cartItems.length === 0) {
        router.push('/')
    }
})

const selectedShipping = ref('standard')

const shippingOptions = [
    { id: 'standard', label: 'Standard Shipping', detail: '5–7 business days', price: 0 },
    { id: 'express', label: 'Express Shipping', detail: '2–3 business days', price: 9.99 },
    { id: 'overnight', label: 'Overnight', detail: 'Next business day', price: 24.99 },
]

const shippingCost = computed(
    () => shippingOptions.find((o) => o.id === selectedShipping.value)?.price ?? 0,
)

const cartSubtotal = computed(() =>
    cartStore.cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0),
)

const orderTotal = computed(() => cartSubtotal.value + shippingCost.value)

const createOrder = async () => {
    const orderId = await orderStore.createOrder(cartStore.cartId!)
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
                <!-- Left: Shipping -->
                <div class="checkout-left">
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

                        <button class="place-order-btn" @click="createOrder">Place Order</button>
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

.shipping-option.is-selected .shipping-dot {
    border-color: var(--color-mint-dark);
}

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

/* CTA */
.place-order-btn {
    width: 100%;
    padding: 0.9375rem 2rem;
    background: var(--color-mint);
    color: var(--color-charcoal);
    font-size: 0.875rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition:
        background 0.2s ease,
        transform 0.15s ease;
}

.place-order-btn:hover {
    background: var(--color-mint-dark);
    color: white;
    transform: translateY(-1px);
}

.place-order-btn:active {
    transform: translateY(0);
}
</style>
