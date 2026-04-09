"use client"

import { Suspense } from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { resetPasswordSchema, ResetPasswordInput } from "@/lib/validations/auth"
import axios from "axios"
import { ClipboardList, Loader2, ArrowLeft } from "lucide-react"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) {
      setError("Reset token is required")
      return
    }

    setLoading(true)
    setError("")
    setMessage("")

    try {
      const response = await axios.post("/api/auth/reset-password", {
        token,
        password: data.password,
      })
      setMessage(response.data.message)
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to reset password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-xl bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-center">Reset Password</CardTitle>
        <CardDescription className="text-center">
          Enter your new password below
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-5">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
              {error}
            </div>
          )}
          {message && (
            <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-100 rounded-lg">
              {message} Redirecting to login...
            </div>
          )}
          {!token && (
            <div className="p-3 text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-lg">
              No reset token provided. Please use the link from your email.
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter new password"
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
            disabled={loading || !token}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
          <p className="text-sm text-slate-600">
            Remember your password?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

function LoadingFallback() {
  return (
    <Card className="border-0 shadow-xl bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-center">Reset Password</CardTitle>
        <CardDescription className="text-center">
          Loading...
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ClipboardList className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Form Builder</h1>
          <p className="text-slate-500 mt-1">Set your new password</p>
        </div>
        <Suspense fallback={<LoadingFallback />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}