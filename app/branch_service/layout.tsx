"use client"

import BranchLayout from "@/components/branch-layout"

export default function branch_serviceLayout({ children }: { children: React.ReactNode }) {
  return (
    <BranchLayout role="branch_service" title="Branch Service" subtitle="Service">
      {children}
    </BranchLayout>
  )
}
