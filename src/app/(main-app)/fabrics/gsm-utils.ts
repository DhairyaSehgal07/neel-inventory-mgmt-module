/** Fields needed for GSM display / derivation (matches fabric list row shape). */
export type FabricGsmFields = {
  fabricWidthCurrent: number
  fabricWidthInitial: number
  fabricLengthCurrent: number
  netWeight: number
  gsmCalculated: number
  fabricWidth: { id: number; value: number }
}

/**
 * Width in meters for GSM area: prefer measured current width (stored in cm),
 * else initial width (cm), else nominal catalog width (stored in meters).
 */
export function fabricWidthMetersForGsm(f: FabricGsmFields): number | null {
  const cur = f.fabricWidthCurrent
  if (Number.isFinite(cur) && cur > 0) return cur / 100

  const init = f.fabricWidthInitial
  if (Number.isFinite(init) && init > 0) return init / 100

  const nominal = f.fabricWidth?.value
  if (nominal != null && Number.isFinite(nominal) && nominal > 0) return nominal

  return null
}

/**
 * GSM (g/m²) from mass and area: net weight (kg) × 1000 / (width (m) × length (m)).
 * Same as net weight (kg) / area (m²), expressed in grams per m² for textile GSM.
 */
export function deriveGsmFromFabric(f: FabricGsmFields): number | null {
  const wM = fabricWidthMetersForGsm(f)
  const lenM = f.fabricLengthCurrent
  const kg = f.netWeight
  if (wM == null || !Number.isFinite(lenM) || lenM <= 0) return null
  if (!Number.isFinite(kg) || kg <= 0) return null
  const area = wM * lenM
  if (area <= 0) return null
  return (kg * 1000) / area
}

function hasStoredCalculatedGsm(v: number | null | undefined): boolean {
  return v != null && Number.isFinite(v) && v > 0
}

export type GsmCalculatedDisplay = {
  value: number
  source: "stored" | "derived"
}

/** Prefer stored gsmCalculated when present; otherwise derive from net weight and dimensions. */
export function getGsmCalculatedDisplay(f: FabricGsmFields): GsmCalculatedDisplay | null {
  if (hasStoredCalculatedGsm(f.gsmCalculated)) {
    return { value: f.gsmCalculated, source: "stored" }
  }
  const derived = deriveGsmFromFabric(f)
  if (derived == null) return null
  return { value: derived, source: "derived" }
}

export function formatGsm(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}
