import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './layout/Layout'
import DashboardPage from './pages/DashboardPage'
import ExercisesListPage from './pages/ExercisesListPage'
import ExerciseDetailPage from './pages/ExerciseDetailPage'
import TabLibraryPage from './pages/TabLibraryPage'
import TabPlayerPage from './pages/TabPlayerPage'
import TunerPage from './pages/TunerPage'
import ProgressionPage from './pages/ProgressionPage'
import ResourcesPage from './pages/ResourcesPage'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/exercises" element={<ExercisesListPage />} />
          <Route path="/exercises/:id" element={<ExerciseDetailPage />} />
          <Route path="/tabs" element={<TabLibraryPage />} />
          <Route path="/tabs/:id" element={<TabPlayerPage />} />
          <Route path="/tuner" element={<TunerPage />} />
          <Route path="/progression" element={<ProgressionPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
