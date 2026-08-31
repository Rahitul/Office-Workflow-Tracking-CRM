"use client"

import BranchLayout from "@/components/branch-layout"

export default function branch_manager_juniorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <BranchLayout role="branch_manager_juniors" title="Branch Mgr Jr" subtitle="Management">
      {children}
    </BranchLayout>
  )
}
