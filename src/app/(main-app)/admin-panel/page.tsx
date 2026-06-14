import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { AdminPanel } from "@/components/admin-panel"

export default async function AdminPanelPage() {
  const session = await auth()

  if (session?.user?.role !== "Admin") {
    redirect("/dashboard")
  }

  return <AdminPanel />
}
