"use client"

import BranchLayout from "@/components/branch-layout"

export default function branch_consumable_juniorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <BranchLayout role="branch_consumable_juniors" title="Branch Cons Jr" subtitle="Consumable">
      {children}
    </BranchLayout>
  )
}
