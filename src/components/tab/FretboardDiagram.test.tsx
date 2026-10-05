import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FretboardDiagram from './FretboardDiagram'

describe('FretboardDiagram', () => {
  test('highlights only the active string/fret cell', () => {
    render(<FretboardDiagram activeString={1} activeFret={5} />)

    expect(screen.getByTestId('fret-1-5')).toHaveClass('fret-active')
    expect(screen.getByTestId('fret-2-5')).not.toHaveClass('fret-active')
    expect(screen.getByTestId('fret-1-6')).not.toHaveClass('fret-active')
    expect(screen.getByTestId('fret-6-14')).not.toHaveClass('fret-active')
  })

  test('highlights nothing when no active string/fret is given', () => {
    render(<FretboardDiagram />)
    expect(screen.getByTestId('fret-1-0')).not.toHaveClass('fret-active')
  })
})
