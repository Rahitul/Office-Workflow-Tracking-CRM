"use client"

import BranchLayout from "@/components/branch-layout"

export default function branch_service_juniorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <BranchLayout role="branch_service_juniors" title="Branch Svc Jr" subtitle="Service">
      {children}
    </BranchLayout>
  )
}
