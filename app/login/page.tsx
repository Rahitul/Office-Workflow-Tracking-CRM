"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { loginSchema, LoginInput } from "@/lib/validations/auth"
import axios from "axios"
import { ClipboardList, Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })
  
  const onSubmit = async (data: LoginInput) => {
    setLoading(true)
    setError("")
    
    try {
      const response = await axios.post("/api/auth/login", data, { withCredentials: true })
      const { role } = response.data.user
      router.push(role === "admin" ? "/admin/dashboard" : role === "accounts" ? "/accounts/target-setting" : "/user/dashboard")
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ClipboardList className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Form Builder</h1>
          <p className="text-slate-500 mt-1">Sign in to your account</p>
        </div>
        
        <Card className="border-0 shadow-xl bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">Enter your credentials to continue</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-5">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-base font-medium"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
              <div className="flex items-center justify-between w-full text-sm">
                <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
                  Forgot password?
                </Link>
                <span className="text-slate-600">
                  Don't have an account?{" "}
                  <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                    Create account
                  </Link>
                </span>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}