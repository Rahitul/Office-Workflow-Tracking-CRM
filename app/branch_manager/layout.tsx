"use client"

import BranchLayout from "@/components/branch-layout"

export default function branch_managerLayout({ children }: { children: React.ReactNode }) {
  return (
    <BranchLayout role="branch_manager" title="Branch Manager" subtitle="Management">
      {children}
    </BranchLayout>
  )
}
