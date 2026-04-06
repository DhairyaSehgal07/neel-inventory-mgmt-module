import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbConnect from '@/lib/dbConnect';
import { liveFabricStockWhere } from '@/lib/fabricAnalytics';
import { withRBAC } from '@/lib/rbac';
import { Permission } from '@/lib/rbac/permissions';

/**
 * GET /api/fabrics/analytics/width-strength-matrix
 *
 * Aggregates live `fabricLengthCurrent` (sum) and roll count by fabric width × strength,
 * over the full Cartesian product of master widths and strengths so the client can
 * render a heatmap (including zeros for missing combinations).
 *
 * Requires FABRIC_VIEW.
 */
export async function GET(request: NextRequest) {
  return withRBAC(request, Permission.FABRIC_VIEW, async () => {
    try {
      await dbConnect();

      const stockWhere = liveFabricStockWhere();

      const [widths, strengths, grouped] = await Promise.all([
        prisma.fabricWidth.findMany({
          select: { id: true, value: true },
          orderBy: { value: 'asc' },
        }),
        prisma.fabricStrength.findMany({
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        }),
        prisma.fabric.groupBy({
          by: ['fabricWidthId', 'fabricStrengthId'],
          where: stockWhere,
          _sum: { fabricLengthCurrent: true },
          _count: { id: true },
        }),
      ]);

      const agg = new Map<
        string,
        { totalLengthM: number; fabricCount: number }
      >();
      for (const row of grouped) {
        const key = `${row.fabricWidthId}:${row.fabricStrengthId}`;
        agg.set(key, {
          totalLengthM: row._sum.fabricLengthCurrent ?? 0,
          fabricCount: row._count.id,
        });
      }

      const totalLengthMByWidthRow: number[][] = [];
      const fabricCountByWidthRow: number[][] = [];
      const cells: {
        widthId: number;
        widthValue: number;
        strengthId: number;
        strengthName: string;
        totalLengthM: number;
        fabricCount: number;
      }[] = [];

      let minLength = Number.POSITIVE_INFINITY;
      let maxLength = 0;
      let grandTotalLength = 0;

      for (const w of widths) {
        const lengthRow: number[] = [];
        const countRow: number[] = [];
        for (const s of strengths) {
          const cell = agg.get(`${w.id}:${s.id}`) ?? {
            totalLengthM: 0,
            fabricCount: 0,
          };
          lengthRow.push(cell.totalLengthM);
          countRow.push(cell.fabricCount);
          grandTotalLength += cell.totalLengthM;
          if (cell.totalLengthM > 0) {
            minLength = Math.min(minLength, cell.totalLengthM);
            maxLength = Math.max(maxLength, cell.totalLengthM);
          }
          cells.push({
            widthId: w.id,
            widthValue: w.value,
            strengthId: s.id,
            strengthName: s.name,
            totalLengthM: cell.totalLengthM,
            fabricCount: cell.fabricCount,
          });
        }
        totalLengthMByWidthRow.push(lengthRow);
        fabricCountByWidthRow.push(countRow);
      }

      if (minLength === Number.POSITIVE_INFINITY) {
        minLength = 0;
      }

      return NextResponse.json({
        success: true,
        data: {
          /** Rows follow `widths` order (by width value ascending). */
          widths,
          /** Columns follow `strengths` order (by strength name ascending). */
          strengths,
          /** `totalLengthMByWidthRow[row][col]` — live balance (m) for that width × strength. */
          totalLengthMByWidthRow,
          /** Roll counts per cell, same indexing as `totalLengthMByWidthRow`. */
          fabricCountByWidthRow,
          /** Flattened cell list (same numbers as the matrices). */
          cells,
          /** For heatmap color scaling (non-zero cells only; min is 0 if all zeros). */
          stats: {
            minTotalLengthM: minLength,
            maxTotalLengthM: maxLength,
            grandTotalLengthM: grandTotalLength,
          },
        },
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('GET /api/fabrics/analytics/width-strength-matrix error:', err);
      const isDev = process.env.NODE_ENV === 'development';
      const message =
        isDev && err.message
          ? `Failed to load width × strength matrix: ${err.message}`
          : 'Failed to load width × strength matrix';
      return NextResponse.json({ success: false, message }, { status: 500 });
    }
  });
}
