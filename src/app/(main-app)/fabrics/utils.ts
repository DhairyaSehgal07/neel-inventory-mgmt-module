type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "ghost" | "link"

export function getStatusBadgeVariant(
  status: string | null | undefined
): BadgeVariant {
  if (status == null || status === "" || status === "—") return "outline"
  const s = status.toLowerCase().trim()
  if (s === "ready to use") return "success"
  if (s === "in use") return "default"
  if (s === "issued") return "destructive"
  if (s === "inventory" || s === "available" || s === "in stock") return "default"
  return "secondary"
}
