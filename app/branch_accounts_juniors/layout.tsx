"use client"

import BranchLayout from "@/components/branch-layout"

export default function branch_accounts_juniorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <BranchLayout role="branch_accounts_juniors" title="Branch Acct Jr" subtitle="Accounts">
      {children}
    </BranchLayout>
  )
}
