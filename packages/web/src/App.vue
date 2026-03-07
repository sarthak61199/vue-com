<script setup lang="ts">
import '@fontsource/titillium-web/400.css'
import '@fontsource/titillium-web/700.css'

import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
</script>

<template>
  <AppHeader />
  <router-view />
  <AppFooter />
</template>
