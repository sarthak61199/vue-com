<script setup lang="ts">
import '@fontsource/titillium-web/400.css'
import '@fontsource/titillium-web/700.css'

import AdminSidebar from './components/AdminSidebar.vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isLoginPage = () => route.name === 'login'
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar v-if="!isLoginPage()" />
    <div class="admin-main">
      <div class="admin-content">
        <router-view />
      </div>
    </div>
  </div>
</template>
