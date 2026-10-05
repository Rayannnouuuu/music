import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import NavBar from './NavBar'

export default function Layout() {
  const location = useLocation()

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
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
