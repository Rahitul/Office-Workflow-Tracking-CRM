"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Shield, Users as UsersIcon } from "lucide-react"

interface UserData {
  _id: string
  name: string
  email: string
  role: "admin" | "user"
  createdAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchUsers()
  }, [])
  
  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/users", { withCredentials: true })
      setUsers(response.data.users || [])
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleRoleChange = async (userId: string, newRole: "admin" | "user") => {
    try {
      await axios.patch(`/api/users/${userId}/role`, { role: newRole }, { withCredentials: true })
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u))
    } catch (error) {
      console.error("Failed to update role:", error)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }
  
  const adminCount = users.filter(u => u.role === "admin").length
  const userCount = users.filter(u => u.role === "user").length
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <p className="text-slate-500">Manage system users and roles</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <UsersIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{users.length}</p>
                <p className="text-sm text-slate-500">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{adminCount}</p>
                <p className="text-sm text-slate-500">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{userCount}</p>
                <p className="text-sm text-slate-500">Regular Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UsersIcon className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-500">No users found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                      <span className="text-lg font-semibold text-slate-600">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{user.name}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={user.role === "admin" 
                      ? "bg-indigo-100 text-indigo-700 border-indigo-200" 
                      : "bg-slate-100 text-slate-700 border-slate-200"
                    }>
                      <Shield className="h-3 w-3 mr-1" />
                      {user.role}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                      onClick={() => handleRoleChange(user._id, user.role === "admin" ? "user" : "admin")}
                    >
                      {user.role === "admin" ? "Remove Admin" : "Make Admin"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}