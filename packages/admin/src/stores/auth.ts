import { api, type ApiUser } from 'api'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useQuery, useMutation, useQueryCache } from '@pinia/colada'

export const useAuthStore = defineStore('auth', () => {
  const queryCache = useQueryCache()
  const accessDenied = ref(false)

  const { data: userData, refresh } = useQuery({
    key: ['auth', 'me'],
    query: () => api.getMe().catch(() => null),
  })

  const user = computed<ApiUser | null>(() => {
    const u = userData.value ?? null
    if (u && u.role !== 'ADMIN') return null
    return u
  })

  const initPromise = refresh().then(() => {})

  const {
    mutateAsync: loginMutate,
    asyncStatus: loginAsyncStatus,
    error: loginError,
  } = useMutation({
    mutation: async ({ email, password }: { email: string; password: string }) => {
      const result = await api.login(email, password)
      if (result.role !== 'ADMIN') {
        await api.logout()
        throw new Error('Access denied — admin account required')
      }
      return result
    },
    onSuccess: (loginData) => {
      accessDenied.value = false
      queryCache.setQueryData(['auth', 'me'], loginData)
    },
  })

  const { mutateAsync: logoutMutate } = useMutation({
    mutation: () => api.logout(),
    onSuccess: () => {
      queryCache.setQueryData(['auth', 'me'], null)
    },
  })

  const loading = computed(() => loginAsyncStatus.value === 'loading')
  const error = computed<string | null>(() => {
    const err = loginError.value
    return err ? (err as Error).message : null
  })

  const login = async (email: string, password: string) => {
    try {
      await loginMutate({ email, password })
    } catch {
      // error exposed via error computed
    }
  }

  const logout = async () => {
    try {
      await logoutMutate()
    } catch {
      // silently fail
    }
  }

  return {
    user,
    loading,
    error,
    initPromise,
    login,
    logout,
  }
})
