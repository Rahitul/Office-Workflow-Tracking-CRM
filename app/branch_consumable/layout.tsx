"use client"

import BranchLayout from "@/components/branch-layout"

export default function branch_consumableLayout({ children }: { children: React.ReactNode }) {
  return (
    <BranchLayout role="branch_consumable" title="Branch Consumable" subtitle="Consumable">
      {children}
    </BranchLayout>
  )
}
