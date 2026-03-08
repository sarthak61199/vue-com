import { api, type ApiUser } from '@/services/api'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<ApiUser | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchMe = async () => {
    loading.value = true
    error.value = null
    try {
      user.value = await api.getMe()
    } catch {
      user.value = null
    } finally {
      loading.value = false
    }
  }

  const register = async (email: string, password: string) => {
    loading.value = true
    error.value = null
    try {
      await api.register(email, password)
      await login(email, password)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  const login = async (email: string, password: string) => {
    loading.value = true
    error.value = null
    try {
      user.value = await api.login(email, password)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    loading.value = true
    error.value = null
    try {
      await api.logout()
      user.value = null
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  // Restore session on store creation — callers can await initPromise to know when ready
  const initPromise = fetchMe()

  return { user, loading, error, initPromise, fetchMe, register, login, logout }
})
