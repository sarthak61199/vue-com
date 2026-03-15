<script setup lang="ts">
import { ref } from 'vue'
import { useCartStore } from '@/stores/cart'
import { usePromoStore } from '@/stores/promo'
import BaseInput from '@/components/BaseInput.vue'
import BaseButton from '@/components/BaseButton.vue'

const cartStore = useCartStore()
const promoStore = usePromoStore()

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
</script>

<template>
  <div class="promo-section">
    <!-- Auto-promo banner -->
    <div v-if="promoStore.autoPromos.length > 0 && !promoStore.appliedPromo" class="promo-auto-banner">
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
</template>

<style scoped>
.promo-section {
  padding-block: 1rem;
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
  color: var(--color-error);
}
</style>
