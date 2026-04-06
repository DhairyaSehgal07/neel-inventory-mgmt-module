-- Composite index for analytics GROUP BY on width × strength (and general lookups).
CREATE INDEX "fabrics_fabricWidthId_fabricStrengthId_idx" ON "fabrics"("fabricWidthId", "fabricStrengthId");
