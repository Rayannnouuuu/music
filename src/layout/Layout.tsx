import { Outlet } from 'react-router-dom'
import NavBar from './NavBar'

export default function Layout() {
  return (
    <div className="relative min-h-screen bg-bg text-text">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{
          background:
            'radial-gradient(60rem 30rem at 15% -10%, var(--color-accent-soft), transparent), radial-gradient(40rem 24rem at 100% 10%, var(--color-accent-soft), transparent)',
        }}
      />
      <div className="relative">
        <NavBar />
        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
