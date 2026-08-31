"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Save, Loader2, LogOut } from "lucide-react"
import { useAuthStore } from "@/store/authStore"

export default function FrontdeskProfilePage() {
  const router = useRouter()
  const { user, checkAuth, logout } = useAuthStore()
  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  
  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
    }
  }, [user])
  
  const handleSave = async () => {
    if (!name.trim()) return
    
    setSaving(true)
    setSuccess(false)
    try {
      await axios.put("/api/users/profile", { name }, { withCredentials: true })
      
      await checkAuth()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error("Failed to update profile:", error)
    } finally {
      setSaving(false)
    }
  }
  
  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16 px-4 md:px-0">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <User className="h-8 w-8 text-blue-600" />
          Profile
        </h1>
        <p className="text-slate-500 mt-1">Manage your account information.</p>
      </div>
      
      {success && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <Card className="border-emerald-200 bg-emerald-50 shadow-sm">
            <CardContent className="py-4 flex items-center gap-3 text-emerald-800">
              <div className="bg-emerald-100 p-2 rounded-full">
                <Save className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold">Profile Updated</p>
                <p className="text-sm text-emerald-700 opacity-90">Your changes have been saved.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">Front Desk</Badge>
              <p className="text-sm text-slate-500 mt-1">Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-11 border-slate-200 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="pl-10 h-11 border-slate-200 bg-slate-50 text-slate-500"
                />
              </div>
              <p className="text-xs text-slate-400">Email cannot be changed</p>
            </div>
          </div>
          
          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}