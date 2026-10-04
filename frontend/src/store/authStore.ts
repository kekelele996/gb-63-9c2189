import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, LoginResponse } from '@/types'
import api from '@/utils/api'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  refreshTokens: () => Promise<void>
  fetchCurrentUser: () => Promise<void>
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        const formData = new FormData()
        formData.append('username', username)
        formData.append('password', password)

        const response = await api.post<LoginResponse>('/api/auth/login', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })

        const { access_token, refresh_token } = response.data

        localStorage.setItem('accessToken', access_token)
        localStorage.setItem('refreshToken', refresh_token)

        set({
          accessToken: access_token,
          refreshToken: refresh_token,
          isAuthenticated: true,
        })

        await get().fetchCurrentUser()
      },

      fetchCurrentUser: async () => {
        const response = await api.get<User>('/api/auth/me')
        set({ user: response.data })
      },

      logout: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        })
      },

      refreshTokens: async () => {
        const refreshToken = get().refreshToken
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        const response = await api.post<LoginResponse>(
          '/api/auth/refresh',
          null,
          {
            params: { refresh_token: refreshToken },
          }
        )

        const { access_token, refresh_token } = response.data

        localStorage.setItem('accessToken', access_token)
        localStorage.setItem('refreshToken', refresh_token)

        set({
          accessToken: access_token,
          refreshToken: refresh_token,
        })
      },

      setUser: (user: User) => {
        set({ user })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
