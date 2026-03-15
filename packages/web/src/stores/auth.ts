import { api, type ApiUser } from '@/services/api'
import { defineStore } from 'pinia'
import { computed, watch } from 'vue'
import { useQuery, useMutation, useQueryCache } from '@pinia/colada'

export const useAuthStore = defineStore('auth', () => {
  const queryCache = useQueryCache()

  const { data: userData, status } = useQuery({
    key: ['auth', 'me'],
    query: () => api.getMe().catch(() => null),
  })

  const user = computed<ApiUser | null>(() => userData.value ?? null)

  // Create a promise that resolves when the initial auth query settles
  const initPromise = new Promise<void>((resolve) => {
    const unwatch = watch(status, (s) => {
      if (s !== 'pending') {
        unwatch()
        resolve()
      }
    }, { immediate: true })
  })

  const {
    mutateAsync: loginMutate,
    status: loginStatus,
    error: loginError,
  } = useMutation({
    mutation: async ({ email, password }: { email: string; password: string }) => {
      return api.login(email, password)
    },
    onSuccess: (loginData) => {
      queryCache.setQueryData(['auth', 'me'], loginData)
    },
  })

  const {
    mutateAsync: registerMutate,
    status: registerStatus,
    error: registerError,
  } = useMutation({
    mutation: async ({ email, password }: { email: string; password: string }) => {
      await api.register(email, password)
      return api.login(email, password)
    },
    onSuccess: (loginData) => {
      queryCache.setQueryData(['auth', 'me'], loginData)
    },
  })

  const { mutateAsync: logoutMutate } = useMutation({
    mutation: () => api.logout(),
    onSuccess: () => {
      queryCache.setQueryData(['auth', 'me'], null)
      queryCache.invalidateQueries({ key: ['wishlist'] })
      queryCache.invalidateQueries({ key: ['orders'] })
      queryCache.invalidateQueries({ key: ['addresses'] })
    },
  })

  const mutationLoading = computed(
    () => loginStatus.value === 'pending' || registerStatus.value === 'pending',
  )
  const mutationError = computed<string | null>(() => {
    const err = loginError.value || registerError.value
    return err ? (err as Error).message : null
  })

  const login = async (email: string, password: string) => {
    try {
      await loginMutate({ email, password })
    } catch {
      // error exposed via mutationError
    }
  }

  const register = async (email: string, password: string) => {
    try {
      await registerMutate({ email, password })
    } catch {
      // error exposed via mutationError
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
    loading: mutationLoading,
    error: computed(() => mutationError.value),
    initPromise,
    login,
    register,
    logout,
  }
})
