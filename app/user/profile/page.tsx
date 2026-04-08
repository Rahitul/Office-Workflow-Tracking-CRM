"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, User, Mail, Save, Loader2, Upload } from "lucide-react"
import { useAuthStore } from "@/store/authStore"

export default function UserProfilePage() {
  const router = useRouter()
  const { user, checkAuth } = useAuthStore()
  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
    }
  }, [user])
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
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
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/user/dashboard")} className="hover:bg-slate-100">
          <ArrowLeft size={20} className="text-slate-600" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
          <p className="text-slate-500">Manage your account</p>
        </div>
      </div>
      
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-6 mb-8">
            <div className="relative">
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-slate-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-slate-100">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white hover:bg-emerald-700 transition-colors"
              >
                <Upload size={14} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{name}</h2>
              <Badge className="mt-1 bg-emerald-100 text-emerald-700 border-emerald-200">
                User
              </Badge>
            </div>
          </div>
          
          <div className="space-y-5">
            <div>
              <Label htmlFor="name" className="text-slate-700 font-medium">Full Name</Label>
              <div className="relative mt-1.5">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="pl-10 h-11 border-slate-200 focus:border-emerald-500"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-slate-700 font-medium">Email Address</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={email}
                  disabled
                  className="pl-10 h-11 border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
            </div>
            
            <Button 
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700"
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
            
            {success && (
              <div className="p-3 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                Profile updated successfully!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}