import { describe, expect, it } from 'vitest'

import { wallCells, wallPages } from './wall-pages'

const games = (n: number) => Array.from({ length: n }, (_, i) => i)
const sizes = (n: number) => wallPages(games(n)).map((page) => page.length)

describe('wallPages', () => {
  it('keeps one page up to six games', () => {
    expect(sizes(0)).toEqual([0])
    expect(sizes(3)).toEqual([3])
    expect(sizes(6)).toEqual([6])
  })

  it('shares the games evenly between pages', () => {
    expect(sizes(7)).toEqual([4, 3])
    expect(sizes(8)).toEqual([4, 4])
    expect(sizes(11)).toEqual([6, 5])
    expect(sizes(13)).toEqual([5, 4, 4])
  })

  it('keeps the display order', () => {
    expect(wallPages(games(7))).toEqual([
      [0, 1, 2, 3],
      [4, 5, 6],
    ])
  })
})

describe('wallCells', () => {
  const cells = (n: number) =>
    wallCells(n).map(({ column, row }) => `${row}:${column}`)

  it('fills a full page as 3 + 3', () => {
    expect(cells(6)).toEqual(['1:1', '1:3', '1:5', '3:1', '3:3', '3:5'])
  })

  it('centres each row of a partial page', () => {
    expect(cells(4)).toEqual(['1:2', '1:4', '3:2', '3:4'])
    expect(cells(5)).toEqual(['1:1', '1:3', '1:5', '3:2', '3:4'])
  })

  it('centres a single row vertically', () => {
    expect(cells(3)).toEqual(['2:1', '2:3', '2:5'])
    expect(cells(1)).toEqual(['2:3'])
  })
})
