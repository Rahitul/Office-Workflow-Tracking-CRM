"use client"

import BranchLayout from "@/components/branch-layout"

export default function branch_accountsLayout({ children }: { children: React.ReactNode }) {
  return (
    <BranchLayout role="branch_accounts" title="Branch Accounts" subtitle="Accounts">
      {children}
    </BranchLayout>
  )
}
