/** The records wall shows 3×2 cards at most per page (mockup p.2). */
export const WALL_COLUMNS = 3
export const WALL_PAGE_SIZE = 6

/**
 * Splits the wall into as few pages as needed, with as many cards on each:
 * 7 games give 4 + 3, not 6 + 1. Earlier pages take the extra card.
 */
export function wallPages<T>(
  items: ReadonlyArray<T>,
  pageSize: number = WALL_PAGE_SIZE,
): Array<Array<T>> {
  const count = Math.max(1, Math.ceil(items.length / pageSize))
  const base = Math.floor(items.length / count)
  const extra = items.length % count
  const pages: Array<Array<T>> = []
  let start = 0
  for (let page = 0; page < count; page++) {
    const size = base + (page < extra ? 1 : 0)
    pages.push(items.slice(start, start + size))
    start += size
  }
  return pages
}

/** Grid cell of a card, 1-based: a row of `WALL_COLUMNS` cards spans 6 columns and 4 rows. */
export interface WallCell {
  /** First of the two grid columns the card spans (1, 2, 3, 4 or 5). */
  column: number
  /** First of the two grid rows the card spans (1, 2 or 3). */
  row: number
}

/**
 * Places the cards of one page: two balanced rows (4 → 2 + 2, 5 → 3 + 2),
 * each centred; a page of three cards or less is one row, centred vertically.
 * Each card spans two of six columns, so half a card's offset centres a row.
 */
export function wallCells(count: number): Array<WallCell> {
  const rows =
    count <= WALL_COLUMNS
      ? [count]
      : [Math.ceil(count / 2), Math.floor(count / 2)]
  const firstRow = rows.length === 1 ? 2 : 1
  return rows.flatMap((size, r) =>
    Array.from({ length: size }, (_, i) => ({
      column: WALL_COLUMNS - size + 1 + 2 * i,
      row: firstRow + 2 * r,
    })),
  )
}
