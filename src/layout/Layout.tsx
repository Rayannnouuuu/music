import { Outlet } from 'react-router-dom'
import NavBar from './NavBar'

export default function Layout() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <NavBar />
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}
