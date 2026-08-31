"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Dialog } from "@/components/ui/dialog"
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  MapPin,
  UserPlus,
  X,
} from "lucide-react"

interface BranchUserInfo {
  _id: string
  name: string
  email: string
  role: string
}

interface BranchData {
  _id: string
  name: string
  code: string
  address: string
  createdAt: string
  users: BranchUserInfo[]
}

const BRANCH_ROLES = [
  { value: "branch_manager", label: "Branch Manager" },
  { value: "branch_manager_juniors", label: "Branch Manager Juniors" },
  { value: "branch_service", label: "Branch Service" },
  { value: "branch_service_juniors", label: "Branch Service Juniors" },
  { value: "branch_sales", label: "Branch Sales" },
  { value: "branch_sales_juniors", label: "Branch Sales Juniors" },
  { value: "branch_consumable", label: "Branch Consumable" },
  { value: "branch_consumable_juniors", label: "Branch Consumable Juniors" },
  { value: "branch_accounts", label: "Branch Accounts" },
  { value: "branch_accounts_juniors", label: "Branch Accounts Juniors" },
]

interface BranchUser {
  name: string
  email: string
  password: string
  role: string
}

const emptyUser = (): BranchUser => ({ name: "", email: "", password: "", role: "branch_manager" })

export default function BranchesPage() {
  const [branches, setBranches] = useState<BranchData[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<BranchData | null>(null)
  const [form, setForm] = useState({ name: "", code: "", address: "" })
  const [users, setUsers] = useState<BranchUser[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    try {
      const res = await axios.get("/api/branches", { withCredentials: true })
      setBranches(res.data.branches || [])
    } catch (err) {
      console.error("Failed to fetch branches:", err)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ name: "", code: "", address: "" })
    setUsers([])
    setError("")
    setShowDialog(true)
  }

  const openEdit = (branch: BranchData) => {
    setEditing(branch)
    setForm({ name: branch.name, code: branch.code, address: branch.address })
    setError("")
    setShowDialog(true)
  }

  const addUser = () => {
    setUsers([...users, emptyUser()])
  }

  const removeUser = (index: number) => {
    setUsers(users.filter((_, i) => i !== index))
  }

  const updateUser = (index: number, field: keyof BranchUser, value: string) => {
    const updated = users.map((u, i) => (i === index ? { ...u, [field]: value } : u))
    setUsers(updated)
  }

  const handleSave = async () => {
    setSaving(true)
    setError("")
    try {
      if (editing) {
        await axios.put(`/api/branches/${editing._id}`, form, { withCredentials: true })
      } else {
        await axios.post("/api/branches", { ...form, users }, { withCredentials: true })
      }
      setShowDialog(false)
      fetchBranches()
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save branch")
    } finally {
      setSaving(false)
    }
  }

  const [showUserDialog, setShowUserDialog] = useState(false)
  const [userBranchId, setUserBranchId] = useState<string | null>(null)
  const [newUserForm, setNewUserForm] = useState({ name: "", email: "", password: "", role: "branch_manager" })
  const [savingUser, setSavingUser] = useState(false)
  const [userError, setUserError] = useState("")

  const handleRemoveUser = async (branchId: string, userId: string) => {
    if (!confirm("Remove this user from the branch?")) return
    try {
      await axios.delete(`/api/branches/${branchId}/users/${userId}`, { withCredentials: true })
      fetchBranches()
    } catch (err) {
      console.error("Failed to remove user:", err)
    }
  }

  const handleAddUserClick = (branchId: string) => {
    setUserBranchId(branchId)
    setNewUserForm({ name: "", email: "", password: "", role: "branch_manager" })
    setUserError("")
    setShowUserDialog(true)
  }

  const handleSaveUser = async () => {
    if (!userBranchId || !newUserForm.name || !newUserForm.email || !newUserForm.password) return
    setSavingUser(true)
    setUserError("")
    try {
      await axios.post(`/api/branches/${userBranchId}/users`, newUserForm, { withCredentials: true })
      setShowUserDialog(false)
      fetchBranches()
    } catch (err: any) {
      setUserError(err.response?.data?.error || "Failed to create user")
    } finally {
      setSavingUser(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this branch?")) return
    try {
      await axios.delete(`/api/branches/${id}`, { withCredentials: true })
      fetchBranches()
    } catch (err) {
      console.error("Failed to delete branch:", err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Branches
          </h1>
          <p className="text-slate-500">Manage branch offices</p>
        </div>
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Branch
        </Button>
      </div>

      {branches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-1">No branches yet</h3>
            <p className="text-sm text-slate-500 mb-4">Create your first branch to get started</p>
            <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Branch
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <Card key={branch._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{branch.name}</h3>
                      <p className="text-xs text-slate-500 font-mono">{branch.code}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(branch)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(branch._id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {branch.address && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin className="w-3.5 h-3.5" />
                    {branch.address}
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-slate-500">Users ({branch.users?.length || 0})</p>
                    <button
                      onClick={() => handleAddUserClick(branch._id)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Add User
                    </button>
                  </div>
                  {branch.users && branch.users.length > 0 && (
                    <div className="space-y-1.5">
                      {branch.users.map((u) => (
                        <div key={u._id} className="flex items-center justify-between text-sm group">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-slate-700 truncate">{u.name}</span>
                            <span className="text-xs text-slate-400 capitalize whitespace-nowrap">{u.role.replace(/_/g, " ")}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveUser(branch._id, u._id)}
                            className="p-0.5 text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {branch.users && branch.users.length === 0 && (
                    <p className="text-xs text-slate-400">No users assigned.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onClose={() => setShowDialog(false)} title={editing ? "Edit Branch" : "Add Branch"}>
        <p className="text-sm text-slate-500 mb-4">{editing ? "Update branch details" : "Enter the details for the new branch"}</p>
        <div className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Branch Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Dhaka Main Branch"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Branch Code</Label>
            <Input
              id="code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="e.g. DHK-01"
              disabled={!!editing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Branch address (optional)"
            />
          </div>

          {!editing && (
            <>
              <hr className="border-slate-200" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Branch Users</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addUser}>
                    <UserPlus className="w-4 h-4 mr-1" />
                    Add User
                  </Button>
                </div>
                {users.length === 0 && (
                  <p className="text-sm text-slate-400">No users added yet.</p>
                )}
                {users.map((user, i) => (
                  <div key={i} className="p-3 border border-slate-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">User {i + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeUser(i)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={user.name}
                          onChange={(e) => updateUser(i, "name", e.target.value)}
                          placeholder="Full name"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Email</Label>
                        <Input
                          value={user.email}
                          onChange={(e) => updateUser(i, "email", e.target.value)}
                          placeholder="Email address"
                          type="email"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Password</Label>
                        <Input
                          value={user.password}
                          onChange={(e) => updateUser(i, "password", e.target.value)}
                          placeholder="Password"
                          type="password"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Role</Label>
                        <Select
                          options={BRANCH_ROLES}
                          value={user.role}
                          onChange={(e) => updateUser(i, "role", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <Button
            onClick={handleSave}
            disabled={saving || !form.name || !form.code}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              editing ? "Update Branch" : "Create Branch"
            )}
          </Button>
        </div>
      </Dialog>

      <Dialog open={showUserDialog} onClose={() => setShowUserDialog(false)} title="Add User to Branch">
        <p className="text-sm text-slate-500 mb-4">Enter the details for the new branch user</p>
        <div className="space-y-4">
          {userError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
              {userError}
            </div>
          )}
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={newUserForm.name}
              onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
              placeholder="Full name"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={newUserForm.email}
              onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
              placeholder="Email address"
              type="email"
            />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              value={newUserForm.password}
              onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
              placeholder="Password"
              type="password"
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              options={BRANCH_ROLES}
              value={newUserForm.role}
              onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
            />
          </div>
          <Button
            onClick={handleSaveUser}
            disabled={savingUser || !newUserForm.name || !newUserForm.email || !newUserForm.password}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {savingUser ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Create User"
            )}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
