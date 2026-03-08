<script lang="ts" setup>
import { useOrderStore } from '@/stores/order'
import { onMounted } from 'vue'
import EmptyState from '@/components/EmptyState.vue'

const orderStore = useOrderStore()

onMounted(async () => {
    await orderStore.getOrders()
})
</script>

<template>
    <main class="page">
        <div class="page-inner">
            <div class="page-header">
                <p class="page-label">Purchase History</p>
                <h1 class="page-title">My Orders</h1>
            </div>

            <div v-if="orderStore.loading" class="loading-msg">Loading orders...</div>

            <EmptyState
                v-else-if="orderStore.orders.length === 0"
                heading="No orders yet"
                message="Your completed orders will appear here."
                link-to="/"
                link-text="Start shopping →"
            />

            <ul v-else class="orders-list">
                <li v-for="order in orderStore.orders" :key="order.id" class="order-card">
                    <div class="order-card-header">
                        <div>
                            <p class="order-id">Order #{{ order.id.slice(0, 8).toUpperCase() }}</p>
                            <p class="order-date">
                                {{ new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}
                            </p>
                        </div>
                        <p class="order-total">${{ order.total.toFixed(2) }}</p>
                    </div>

                    <ul class="order-items">
                        <li v-for="item in order.orderItems" :key="item.productId" class="order-item">
                            <span class="order-item-name">{{ item.product.name }}</span>
                            <span class="order-item-qty">× {{ item.quantity }}</span>
                            <span class="order-item-price">${{ (item.product.price * item.quantity).toFixed(2) }}</span>
                        </li>
                    </ul>
                </li>
            </ul>
        </div>
    </main>
</template>

<style scoped>
.page {
    flex: 1;
}

.page-inner {
    max-width: 800px;
    margin-inline: auto;
    padding-inline: 1.5rem;
    padding-block: 3rem 5rem;
}

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

.loading-msg {
    padding: 5rem 0;
    text-align: center;
    font-size: 1rem;
    color: var(--color-stone);
}

.orders-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.order-card {
    background: white;
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 1.75rem;
    box-shadow: var(--shadow-card);
}

.order-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.25rem;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid var(--color-border);
}

.order-id {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-stone);
    margin-bottom: 0.25rem;
}

.order-date {
    font-size: 0.875rem;
    color: var(--color-stone);
}

.order-total {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-charcoal);
    letter-spacing: -0.02em;
}

.order-items {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
}

.order-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.order-item-name {
    flex: 1;
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--color-charcoal);
}

.order-item-qty {
    font-size: 0.875rem;
    color: var(--color-stone);
}

.order-item-price {
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--color-charcoal);
}
</style>
