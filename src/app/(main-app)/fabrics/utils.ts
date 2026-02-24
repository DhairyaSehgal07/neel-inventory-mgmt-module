type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "info"
  | "warning"
  | "purple"
  | "muted"
  | "ghost"
  | "link"

/** Maps FabricStatus (and legacy labels) to badge variant for consistent status colors. */
export function getStatusBadgeVariant(
  status: string | null | undefined
): BadgeVariant {
  if (status == null || status === "" || status === "—") return "outline"
  const s = status.toUpperCase().trim()
  switch (s) {
    case "PACKED":
      return "success" // Green
    case "IN_USE":
      return "info" // Blue
    case "CLOSED":
      return "muted" // Gray
    case "OPEN":
      return "warning" // Amber / Orange
    case "REJECTED":
      return "destructive" // Red
    case "TRADED":
      return "purple" // Purple
    default:
      // Legacy / display labels (e.g. "in use", "ready to use")
      const lower = status.toLowerCase().trim()
      if (lower === "ready to use") return "success"
      if (lower === "in use") return "info"
      if (lower === "issued") return "destructive"
      if (["inventory", "available", "in stock"].includes(lower)) return "default"
      return "secondary"
  }
}
