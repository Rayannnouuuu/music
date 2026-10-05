import { describe, test, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ExerciseDetailPage from './ExerciseDetailPage'
import { ProgressionProvider } from '../lib/progression/ProgressionContext'
import { loadAllExercises } from '../lib/content/loadExercises'
import { buildPath, flattenPath } from '../lib/progression/path'

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
  // The first step of the path is always unlocked; any other exercise
  // would hit the lock guard instead of rendering the practice UI.
  const exercise = flattenPath(buildPath(loadAllExercises()))[0]

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

  test('"Annuler" undoes today\'s completion so the exercise can be redone', () => {
    renderPage(exercise.id)
    fireEvent.click(screen.getByRole('button', { name: /marquer comme fait/i }))
    expect(screen.getByRole('button', { name: /fait aujourd.hui/i })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: /annuler/i }))

    const button = screen.getByRole('button', { name: /marquer comme fait/i })
    expect(button).not.toBeDisabled()
    expect(screen.queryByRole('button', { name: /annuler/i })).not.toBeInTheDocument()

    // And it can be completed again for a fresh XP grant.
    fireEvent.click(button)
    expect(screen.getByText(`+${exercise.xpReward} XP`)).toBeInTheDocument()
  })
})
