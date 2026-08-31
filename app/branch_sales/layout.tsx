"use client"

import BranchLayout from "@/components/branch-layout"

export default function branch_salesLayout({ children }: { children: React.ReactNode }) {
  return (
    <BranchLayout role="branch_sales" title="Branch Sales" subtitle="Sales">
      {children}
    </BranchLayout>
  )
}
