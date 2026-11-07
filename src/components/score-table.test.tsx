/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ScoreTable } from './score-table'

describe('ScoreTable', () => {
  it('renders the game title, ranks and formatted scores', () => {
    render(
      <ScoreTable
        game="Tetris"
        machine="Game Boy"
        rows={[
          {
            id: 'a',
            rank: 1,
            player: 'Ada',
            score: 128_400,
            photoSrc: null,
            anonymous: false,
          },
          {
            id: 'b',
            rank: 2,
            player: 'Bob',
            score: 99_000,
            photoSrc: null,
            anonymous: true,
          },
        ]}
      />,
    )

    expect(screen.getByRole('heading', { name: /tetris/i })).toBeInTheDocument()
    expect(screen.getByText(/game boy/i)).toBeInTheDocument()
    expect(screen.getByText('Ada')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(
      screen.getByText((text) => text.replace(/\s/g, ' ') === '128 400'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('1re place')).toBeInTheDocument()
    expect(screen.getByLabelText('Incognito')).toBeInTheDocument()
  })

  it('shows the empty copy when there is no row', () => {
    render(<ScoreTable game="Pong" rows={[]} />)
    expect(
      screen.getByText(/Aucun score pour l'instant/i),
    ).toBeInTheDocument()
  })
})
