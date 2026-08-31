"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { ListChecks, Plus, Trash2, Loader2, Wrench, ClipboardList, Building2, FileText, UserCog } from "lucide-react"

type Kind = "product_category" | "product_type" | "model_name" | "department" | "option" | "sla" | "customer_category" | "call_type" | "company_category" | "quotation_type" | "designation" | "problem"

interface DropdownOption {
  _id: string
  kind: Kind
  label: string
  parent: string
}

function SimpleSectionCard({
  title,
  accent,
  value,
  onChange,
  placeholder,
  items,
  emptyText,
  onAdd,
  onDelete,
  adding,
}: {
  title: string
  accent: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  items: DropdownOption[]
  emptyText: string
  onAdd: () => void
  onDelete: (id: string) => void
  adding: boolean
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ListChecks className={`w-5 h-5 ${accent}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
          <Button
            onClick={onAdd}
            disabled={adding || !value.trim()}
            className="bg-teal-600 hover:bg-teal-700 shrink-0"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">{emptyText}</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item._id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 h-7 w-7 p-0" onClick={() => onDelete(item._id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function ManageDropdownsPage() {
  const [categories, setCategories] = useState<DropdownOption[]>([])
  const [types, setTypes] = useState<DropdownOption[]>([])
  const [models, setModels] = useState<DropdownOption[]>([])
  const [departments, setDepartments] = useState<DropdownOption[]>([])
  const [options, setOptions] = useState<DropdownOption[]>([])
  const [slas, setSlas] = useState<DropdownOption[]>([])
  const [customerCategories, setCustomerCategories] = useState<DropdownOption[]>([])
  const [callTypes, setCallTypes] = useState<DropdownOption[]>([])
  const [companyCategories, setCompanyCategories] = useState<DropdownOption[]>([])
  const [quotationTypes, setQuotationTypes] = useState<DropdownOption[]>([])
  const [designations, setDesignations] = useState<DropdownOption[]>([])
  const [problems, setProblems] = useState<DropdownOption[]>([])
  const [loading, setLoading] = useState(true)

  const [newCategory, setNewCategory] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [newType, setNewType] = useState("")
  const [selectedType, setSelectedType] = useState("")
  const [newModel, setNewModel] = useState("")
  const [newDepartment, setNewDepartment] = useState("")
  const [newOption, setNewOption] = useState("")
  const [newSla, setNewSla] = useState("")
  const [newCustomerCategory, setNewCustomerCategory] = useState("")
  const [newCallType, setNewCallType] = useState("")
  const [newCompanyCategory, setNewCompanyCategory] = useState("")
  const [newQuotationType, setNewQuotationType] = useState("")
  const [newDesignation, setNewDesignation] = useState("")
  const [newProblem, setNewProblem] = useState("")

  const [adding, setAdding] = useState<Kind | null>(null)

  const fetchAll = async () => {
    try {
      const [catRes, typeRes, modelRes, depRes, optRes, slaRes, custCatRes, callRes, companyCatRes, quotationTypeRes, designationRes, problemRes] = await Promise.all([
        axios.get("/api/dropdowns?kind=product_category", { withCredentials: true }),
        axios.get("/api/dropdowns?kind=product_type", { withCredentials: true }),
        axios.get("/api/dropdowns?kind=model_name", { withCredentials: true }),
        axios.get("/api/dropdowns?kind=department", { withCredentials: true }),
        axios.get("/api/dropdowns?kind=option", { withCredentials: true }),
        axios.get("/api/dropdowns?kind=sla", { withCredentials: true }),
        axios.get("/api/dropdowns?kind=customer_category", { withCredentials: true }),
        axios.get("/api/dropdowns?kind=call_type", { withCredentials: true }),
        axios.get("/api/dropdowns?kind=company_category", { withCredentials: true }),
        axios.get("/api/dropdowns?kind=quotation_type", { withCredentials: true }),
        axios.get("/api/dropdowns?kind=designation", { withCredentials: true }),
        axios.get("/api/dropdowns?kind=problem", { withCredentials: true }),
      ])
      const cats: DropdownOption[] = catRes.data.options || []
      const tys: DropdownOption[] = typeRes.data.options || []
      const mods: DropdownOption[] = modelRes.data.options || []
      setCategories(cats)
      setTypes(tys)
      setModels(mods)
      setDepartments(depRes.data.options || [])
      setOptions(optRes.data.options || [])
      setSlas(slaRes.data.options || [])
      setCustomerCategories(custCatRes.data.options || [])
      setCallTypes(callRes.data.options || [])
      setCompanyCategories(companyCatRes.data.options || [])
      setQuotationTypes(quotationTypeRes.data.options || [])
      setDesignations(designationRes.data.options || [])
      setProblems(problemRes.data.options || [])
      setSelectedCategory((prev) =>
        prev && cats.some((c) => c.label === prev) ? prev : (cats[0]?.label || "")
      )
      setSelectedType((prev) =>
        prev && tys.some((t) => t.label === prev) ? prev : (tys[0]?.label || "")
      )
    } catch (error) {
      console.error("Failed to fetch dropdown options:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const handleAdd = async (kind: Kind, label: string, parent = "") => {
    if (!label.trim()) return
    setAdding(kind)
    try {
      await axios.post("/api/dropdowns", { kind, label: label.trim(), parent }, { withCredentials: true })
      await fetchAll()
    } catch (error: any) {
      alert(error.response?.data?.error || `Failed to add ${kind.replace("_", " ")}`)
    } finally {
      setAdding(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this dropdown option?")) return
    try {
      await axios.delete(`/api/dropdowns/${id}`, { withCredentials: true })
      await fetchAll()
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to delete dropdown option")
    }
  }

  const filteredTypes = selectedCategory ? types.filter((t) => t.parent === selectedCategory) : []

  const filteredModels = selectedType ? models.filter((m) => m.parent === selectedType) : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manage Dropdowns</h1>
        <p className="text-slate-500">Manage the dropdown option lists used across the application forms</p>
      </div>

      <div className="rounded-xl border-2 border-teal-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 bg-teal-600 px-5 py-3">
          <Wrench className="w-5 h-5 text-white shrink-0" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wide">
            Service Card Form Dropdowns
          </h2>
          <span className="ml-auto text-xs text-teal-100">
            Autocomplete sources for the Service Machine form
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SimpleSectionCard
          title="Product Categories"
          accent="text-teal-600"
          value={newCategory}
          onChange={setNewCategory}
          placeholder="Enter category name..."
          items={categories}
          emptyText="No product categories yet"
          adding={adding === "product_category"}
          onAdd={() => handleAdd("product_category", newCategory)}
          onDelete={handleDelete}
        />

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-blue-600" />
              Product Types
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Under Category</Label>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                options={[
                  { value: "", label: "Select a category..." },
                  ...categories.map((c) => ({ value: c.label, label: c.label })),
                ]}
              />
            </div>
            <div className="flex gap-2">
              <Input
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                placeholder="Enter type name..."
                disabled={!selectedCategory}
              />
              <Button
                onClick={() => handleAdd("product_type", newType, selectedCategory)}
                disabled={adding === "product_type" || !newType.trim() || !selectedCategory}
                className="bg-blue-600 hover:bg-blue-700 shrink-0"
              >
                {adding === "product_type" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>
            {!selectedCategory ? (
              <p className="text-sm text-slate-500 py-4 text-center">Select a product category first</p>
            ) : filteredTypes.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No product types under &quot;{selectedCategory}&quot;</p>
            ) : (
              <div className="space-y-2">
                {filteredTypes.map((t) => (
                  <div key={t._id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-sm font-medium text-slate-700">{t.label}</span>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 h-7 w-7 p-0" onClick={() => handleDelete(t._id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-indigo-600" />
              Model Names
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Under Product Type</Label>
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                options={[
                  { value: "", label: "Select a product type..." },
                  ...types.map((t) => ({ value: t.label, label: t.parent ? `${t.label} (${t.parent})` : t.label })),
                ]}
              />
            </div>
            <div className="flex gap-2">
              <Input
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder="Enter model name..."
                disabled={!selectedType}
              />
              <Button
                onClick={() => handleAdd("model_name", newModel, selectedType)}
                disabled={adding === "model_name" || !newModel.trim() || !selectedType}
                className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
              >
                {adding === "model_name" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>
            {!selectedType ? (
              <p className="text-sm text-slate-500 py-4 text-center">Select a product type first</p>
            ) : filteredModels.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No model names under &quot;{selectedType}&quot;</p>
            ) : (
              <div className="space-y-2">
                {filteredModels.map((m) => (
                  <div key={m._id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-sm font-medium text-slate-700">{m.label}</span>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 h-7 w-7 p-0" onClick={() => handleDelete(m._id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <SimpleSectionCard
          title="Departments"
          accent="text-amber-600"
          value={newDepartment}
          onChange={setNewDepartment}
          placeholder="Enter department..."
          items={departments}
          emptyText="No departments yet"
          adding={adding === "department"}
          onAdd={() => handleAdd("department", newDepartment)}
          onDelete={handleDelete}
        />

        <SimpleSectionCard
          title="Options"
          accent="text-rose-600"
          value={newOption}
          onChange={setNewOption}
          placeholder="Enter option..."
          items={options}
          emptyText="No options yet"
          adding={adding === "option"}
          onAdd={() => handleAdd("option", newOption)}
          onDelete={handleDelete}
        />

        <SimpleSectionCard
          title="SLA Values"
          accent="text-emerald-600"
          value={newSla}
          onChange={setNewSla}
          placeholder="Enter SLA value..."
          items={slas}
          emptyText="No SLA values yet"
          adding={adding === "sla"}
          onAdd={() => handleAdd("sla", newSla)}
          onDelete={handleDelete}
        />
        </div>
      </div>

      <div className="rounded-xl border-2 border-blue-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 bg-blue-600 px-5 py-3">
          <ClipboardList className="w-5 h-5 text-white shrink-0" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wide">
            Call/Case Assign Form Dropdowns
          </h2>
          <span className="ml-auto text-xs text-blue-100">
            Sources for the Call/Case Assign form
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SimpleSectionCard
          title="Customer Categories"
          accent="text-orange-600"
          value={newCustomerCategory}
          onChange={setNewCustomerCategory}
          placeholder="Enter customer category..."
          items={customerCategories}
          emptyText="No customer categories yet"
          adding={adding === "customer_category"}
          onAdd={() => handleAdd("customer_category", newCustomerCategory)}
          onDelete={handleDelete}
        />

        <SimpleSectionCard
          title="Call Types"
          accent="text-cyan-600"
          value={newCallType}
          onChange={setNewCallType}
          placeholder="Enter call type..."
          items={callTypes}
          emptyText="No call types yet"
          adding={adding === "call_type"}
          onAdd={() => handleAdd("call_type", newCallType)}
          onDelete={handleDelete}
        />

        <SimpleSectionCard
          title="Problems"
          accent="text-red-600"
          value={newProblem}
          onChange={setNewProblem}
          placeholder="Enter problem..."
          items={problems}
          emptyText="No problems yet"
          adding={adding === "problem"}
          onAdd={() => handleAdd("problem", newProblem)}
          onDelete={handleDelete}
        />
        </div>
      </div>

      <div className="rounded-xl border-2 border-emerald-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 bg-emerald-600 px-5 py-3">
          <Building2 className="w-5 h-5 text-white shrink-0" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wide">
            Company List Dropdowns
          </h2>
          <span className="ml-auto text-xs text-emerald-100">
            Sources for the Company List form
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SimpleSectionCard
          title="Company Categories"
          accent="text-emerald-600"
          value={newCompanyCategory}
          onChange={setNewCompanyCategory}
          placeholder="Enter company category..."
          items={companyCategories}
          emptyText="No company categories yet"
          adding={adding === "company_category"}
          onAdd={() => handleAdd("company_category", newCompanyCategory)}
          onDelete={handleDelete}
        />
        </div>
      </div>

      <div className="rounded-xl border-2 border-violet-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 bg-violet-600 px-5 py-3">
          <FileText className="w-5 h-5 text-white shrink-0" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wide">
            Quotation Section
          </h2>
          <span className="ml-auto text-xs text-violet-100">
            Sources for the Manage Quotation form
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SimpleSectionCard
          title="Quotation Types"
          accent="text-violet-600"
          value={newQuotationType}
          onChange={setNewQuotationType}
          placeholder="Enter quotation type..."
          items={quotationTypes}
          emptyText="No quotation types yet"
          adding={adding === "quotation_type"}
          onAdd={() => handleAdd("quotation_type", newQuotationType)}
          onDelete={handleDelete}
        />
        </div>
      </div>

      <div className="rounded-xl border-2 border-pink-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 bg-pink-600 px-5 py-3">
          <UserCog className="w-5 h-5 text-white shrink-0" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wide">
            Engineer&apos;s Info Dropdown Section
          </h2>
          <span className="ml-auto text-xs text-pink-100">
            Designation options for the Engineer&apos;s Info form
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SimpleSectionCard
          title="Designations"
          accent="text-pink-600"
          value={newDesignation}
          onChange={setNewDesignation}
          placeholder="Enter designation..."
          items={designations}
          emptyText="No designations yet"
          adding={adding === "designation"}
          onAdd={() => handleAdd("designation", newDesignation)}
          onDelete={handleDelete}
        />
        </div>
      </div>
    </div>
  )
}
