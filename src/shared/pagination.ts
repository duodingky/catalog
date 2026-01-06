import { z } from "zod";

const intFromQuery = z.preprocess((v) => {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : v;
  }
  return v;
}, z.number().int());

/**
 * Common paging params:
 * - limit: page size (default handled by callers)
 * - start: starting record index (0-based)
 * - star: legacy/typo alias for start
 */
export const paginationQueryInputSchema = z.object({
  limit: intFromQuery.optional(),
  start: intFromQuery.optional(),
  star: intFromQuery.optional()
});

export type PagingMeta = {
  totalRecord: number;
  startRecord: number;
  endRecord: number;
};

export function buildPagingMeta(input: {
  totalRecord: number;
  startRecord: number;
  returnedCount: number;
}): PagingMeta {
  const totalRecord = Math.max(0, Math.trunc(input.totalRecord));
  const startRecord = Math.max(0, Math.trunc(input.startRecord));
  const returnedCount = Math.max(0, Math.trunc(input.returnedCount));
  const endRecord = returnedCount === 0 ? -1 : startRecord + returnedCount - 1;
  return { totalRecord, startRecord, endRecord };
}

