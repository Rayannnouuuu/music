import { describe, test, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ExerciseDetailPage from './ExerciseDetailPage'
import { ProgressionProvider } from '../lib/progression/ProgressionContext'
import { loadAllExercises } from '../lib/content/loadExercises'

function renderPage(exerciseId: string) {
  return render(
    <MemoryRouter initialEntries={[`/exercises/${exerciseId}`]}>
      <ProgressionProvider>
        <Routes>
          <Route path="/exercises/:id" element={<ExerciseDetailPage />} />
        </Routes>
      </ProgressionProvider>
    </MemoryRouter>,
  )
}

describe('ExerciseDetailPage completion', () => {
  const exercise = loadAllExercises()[0]

  beforeEach(() => {
    localStorage.clear()
  })

  test('completing once grants XP and disables further completion', () => {
    renderPage(exercise.id)

    const button = screen.getByRole('button', { name: /marquer comme fait/i })
    fireEvent.click(button)

    expect(screen.getByText(`+${exercise.xpReward} XP`)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /fait aujourd.hui/i })).toBeDisabled()
  })

  test('re-rendering the page after completion keeps it locked for the day (no XP farming)', () => {
    const { unmount } = renderPage(exercise.id)
    fireEvent.click(screen.getByRole('button', { name: /marquer comme fait/i }))
    unmount()

    renderPage(exercise.id)
    expect(screen.getByRole('button', { name: /fait aujourd.hui/i })).toBeDisabled()
  })

  test('clicking a disabled "already done" button does not grant XP again', () => {
    renderPage(exercise.id)
    const button = screen.getByRole('button', { name: /marquer comme fait/i })
    fireEvent.click(button)

    const doneButton = screen.getByRole('button', { name: /fait aujourd.hui/i })
    fireEvent.click(doneButton)
    fireEvent.click(doneButton)

    // Still only ever shows the single xpReward grant, never a multiple of it.
    expect(screen.getAllByText(`+${exercise.xpReward} XP`)).toHaveLength(1)
  })
})
