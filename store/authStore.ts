import { create } from "zustand"
import axios from "axios"
import { User } from "@/types"

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,
  
  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const response = await axios.post(
        "/api/auth/login",
        { email, password },
        { withCredentials: true }
      )
      set({ user: response.data.user, isLoading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Login failed",
        isLoading: false
      })
      throw error
    }
  },
  
  register: async (name, email, password) => {
    set({ isLoading: true, error: null })
    try {
      await axios.post("/api/auth/register", { name, email, password })
      set({ isLoading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Registration failed",
        isLoading: false
      })
      throw error
    }
  },
  
  logout: async () => {
    try {
      await axios.post("/api/auth/logout", {}, { withCredentials: true })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      set({ user: null })
    }
  },
  
  checkAuth: async () => {
    set({ isLoading: true })
    try {
      const response = await axios.get("/api/auth/me", { withCredentials: true })
      set({ user: response.data.user, isLoading: false })
    } catch (error) {
      set({ user: null, isLoading: false })
    }
  },
}))