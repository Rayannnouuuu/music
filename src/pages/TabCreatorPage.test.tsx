import { describe, test, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useParams } from 'react-router-dom'
import TabCreatorPage from './TabCreatorPage'
import { ProgressionProvider } from '../lib/progression/ProgressionContext'

function PlayerStub() {
  const { id } = useParams()
  return <p>PLAYER:{id}</p>
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/tabs/new']}>
      <ProgressionProvider>
        <Routes>
          <Route path="/tabs/new" element={<TabCreatorPage />} />
          <Route path="/tabs/:id" element={<PlayerStub />} />
        </Routes>
      </ProgressionProvider>
    </MemoryRouter>,
  )
}

describe('TabCreatorPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('adding a note shows it in the measure and the live preview', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /ajouter la note/i }))

    expect(screen.getByText(/case 0/i)).toBeInTheDocument()
    expect(screen.getAllByTestId('note-6-0').length).toBeGreaterThan(0)
  })

  test('removing a note takes it out of the measure', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /ajouter la note/i }))
    fireEvent.click(screen.getByRole('button', { name: /supprimer cette note/i }))

    expect(screen.queryByText(/case 0/i)).not.toBeInTheDocument()
  })

  test('adding a measure renders a second measure card', () => {
    renderPage()
    expect(screen.getByText('Mesure 1')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /ajouter une mesure/i }))
    expect(screen.getByText('Mesure 2')).toBeInTheDocument()
  })

  test('saving navigates to the player and the tab is readable from storage', () => {
    renderPage()

    fireEvent.change(screen.getByPlaceholderText('Titre'), { target: { value: 'Mon riff' } })
    fireEvent.click(screen.getByRole('button', { name: /ajouter la note/i }))
    fireEvent.click(screen.getByRole('button', { name: /enregistrer ma tab/i }))

    expect(screen.getByText(/^PLAYER:custom-/)).toBeInTheDocument()

    const saved = JSON.parse(localStorage.getItem('guitar-progress')!)
    expect(saved.importedTabs).toHaveLength(1)
    expect(saved.importedTabs[0].title).toBe('Mon riff')
    expect(saved.importedTabs[0].measures[0].events).toHaveLength(1)
  })
})
