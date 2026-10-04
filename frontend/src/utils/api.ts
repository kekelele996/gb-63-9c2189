import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { message } from 'antd'
import { useAuthStore } from '@/store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${API_BASE_URL}/api/auth/refresh`,
            null,
            {
              params: { refresh_token: refreshToken },
            }
          )

          const { access_token, refresh_token } = response.data

          localStorage.setItem('accessToken', access_token)
          localStorage.setItem('refreshToken', refresh_token)

          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        } catch (refreshError) {
          useAuthStore.getState().logout()
          message.error('登录已过期，请重新登录')
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      } else {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }

    if (error.response?.data?.detail) {
      message.error(error.response.data.detail)
    } else if (error.message) {
      message.error(error.message)
    }

    return Promise.reject(error)
  }
)

export default api
