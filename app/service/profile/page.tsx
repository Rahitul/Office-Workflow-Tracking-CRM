"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/store/authStore"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User } from "lucide-react"

export default function ServiceProfilePage() {
  const { user } = useAuthStore()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setEmail(user.email || "")
    }
  }, [user])

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-slate-500">View your account information</p>
      </div>

      <Card className="border-slate-200 shadow-lg bg-white">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-teal-600" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Name</Label>
              <Input value={name} disabled className="bg-slate-50 border-slate-200 h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Email</Label>
              <Input value={email} disabled className="bg-slate-50 border-slate-200 h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Role</Label>
              <Input value="Service" disabled className="bg-slate-50 border-slate-200 h-10" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}