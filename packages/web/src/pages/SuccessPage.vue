<script setup lang="ts">
import { useOrderStore } from '@/stores/order'
import { useRoute, useRouter } from 'vue-router'
import { onMounted } from 'vue'
import { IMAGE } from '@/constants'
import { formatPrice } from '@/utils/format'

const route = useRoute()
const router = useRouter()

const orderStore = useOrderStore()

const orderId = route.query.orderId as string

onMounted(async () => {
    if (!orderId) {
        router.push('/')
        return
    }
    await orderStore.getOrderById(orderId)
})
</script>

<template>
    <main class="page">
        <div class="page-inner">
            <!-- Success mark -->
            <div class="success-header">
                <div class="check-circle">
                    <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                        stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>
                <p class="page-label">Order Confirmed</p>
                <h1 class="page-title">You're all set!</h1>
                <p class="success-message">
                    Your order has been placed and is being prepared for shipment.
                </p>
            </div>

            <!-- Order summary -->
            <div class="summary-card">
                <h2 class="section-title">Order Summary</h2>

                <ul class="order-list">
                    <li v-for="orderItem in orderStore.currentOrder?.orderItems" :key="orderItem.variantId"
                        class="order-item">
                        <div class="order-item-image-wrap">
                            <img
                                :src="orderItem.variant.image ?? orderItem.variant.product.image ?? IMAGE"
                                :alt="orderItem.variant.product.name"
                                class="order-item-image"
                            />
                            <span class="order-item-qty">{{ orderItem.quantity }}</span>
                        </div>

                        <div class="order-item-info">
                            <p class="order-item-name">{{ orderItem.variant.product.name }}</p>
                            <p class="order-item-unit">{{ formatPrice(orderItem.price) }} each</p>
                        </div>

                        <p class="order-item-price">
                            {{ formatPrice(orderItem.price * orderItem.quantity) }}
                        </p>
                    </li>
                </ul>

                <div class="order-total">
                    <span class="order-total-label">Total</span>
                    <span class="order-total-value">{{ orderStore.currentOrder ? formatPrice(orderStore.currentOrder.total) : '' }}</span>
                </div>
            </div>

            <!-- Actions -->
            <div class="actions">
                <router-link to="/" class="continue-btn">Continue Shopping</router-link>
            </div>
        </div>
    </main>
</template>

<style scoped>
.page {
    flex: 1;
}

.page-inner {
    max-width: 640px;
    margin-inline: auto;
    padding-inline: 1.5rem;
    padding-block: 3rem 5rem;
}

/* Success header */
.success-header {
    text-align: center;
    margin-bottom: 2.5rem;
}

.check-circle {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: var(--color-mint);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-inline: auto;
    margin-bottom: 1.5rem;
    color: white;
    animation: pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes pop {
    from {
        opacity: 0;
        transform: scale(0.5);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

.check-icon {
    width: 32px;
    height: 32px;
    stroke-dasharray: 30;
    stroke-dashoffset: 30;
    animation: draw 0.35s ease 0.3s forwards;
}

@keyframes draw {
    to {
        stroke-dashoffset: 0;
    }
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
    margin-bottom: 0.75rem;
}

.success-message {
    font-size: 0.9375rem;
    color: var(--color-stone);
    line-height: 1.55;
}

/* Summary card */
.summary-card {
    background: white;
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 1.75rem;
    box-shadow: var(--shadow-card);
    margin-bottom: 2rem;
}

.section-title {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-stone);
    margin-bottom: 1.25rem;
}

/* Order list */
.order-list {
    list-style: none;
    border-top: 1px solid var(--color-border);
}

.order-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding-block: 1.125rem;
    border-bottom: 1px solid var(--color-border);
}

.order-item-image-wrap {
    position: relative;
    width: 60px;
    height: 60px;
    flex-shrink: 0;
}

.order-item-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
    background: var(--color-mint-50);
    border: 1px solid var(--color-mint-100);
}

.order-item-qty {
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

.order-item-info {
    flex: 1;
}

.order-item-name {
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--color-charcoal);
    margin-bottom: 0.2rem;
}

.order-item-unit {
    font-size: 0.8125rem;
    color: var(--color-stone);
}

.order-item-price {
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--color-charcoal);
}

/* Total row */
.order-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1.25rem;
    margin-top: 0.25rem;
}

.order-total-label {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-stone);
}

.order-total-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-charcoal);
    letter-spacing: -0.03em;
}

/* Actions */
.actions {
    text-align: center;
}

.continue-btn {
    display: inline-block;
    padding: 0.875rem 2rem;
    background: var(--color-mint);
    color: var(--color-charcoal);
    font-size: 0.875rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border-radius: 8px;
    transition:
        background 0.2s ease,
        transform 0.15s ease;
}

.continue-btn:hover {
    background: var(--color-mint-dark);
    color: white;
    transform: translateY(-1px);
}

.continue-btn:active {
    transform: translateY(0);
}
</style>
