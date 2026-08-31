"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import SalesDashboardPage from "@/app/admin/sales-dashboard/page"
import CollectionDashboardPage from "@/app/admin/collection-dashboard/page"
import BudgetVsActualDashboardPage from "@/app/admin/budget-vs-actual-dashboard/page"
import PriceSupportDashboardPage from "@/app/admin/price-support-dashboard/page"

const tabs = [
  { id: "sales", label: "Sales Dashboard" },
  { id: "collection", label: "Collection Dashboard" },
  { id: "price-support", label: "Price Support Dashboard" },
  { id: "budget", label: "Budget VS Actual Dashboard" },
]

function AccountsAnalysisContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState(tabParam === "collection" ? "collection" : tabParam === "budget" ? "budget" : tabParam === "price-support" ? "price-support" : "sales")

  return (
    <div className="space-y-6 pb-12">
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === tab.id
                  ? "border-amber-500 text-amber-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "sales" && <SalesDashboardPage />}
      {activeTab === "collection" && <CollectionDashboardPage />}
      {activeTab === "price-support" && <PriceSupportDashboardPage />}
      {activeTab === "budget" && <BudgetVsActualDashboardPage />}
    </div>
  )
}

export default function AccountsAnalysisPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading...</div>}>
      <AccountsAnalysisContent />
    </Suspense>
  )
}