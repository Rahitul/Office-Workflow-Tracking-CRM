"use client"

import BranchLayout from "@/components/branch-layout"

export default function branch_sales_juniorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <BranchLayout role="branch_sales_juniors" title="Branch Sales Jr" subtitle="Sales">
      {children}
    </BranchLayout>
  )
}
