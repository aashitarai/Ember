import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../core/auth'
import { CustomCursor } from '../components/CustomCursor'
import { Magnetic } from '../components/Magnetic'
import clsx from 'clsx'
import { shortAddr, useWallet } from '../../web3/wallet'

const nav = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/talk', label: 'Talk' },
  { to: '/vault', label: 'Vault' },
  { to: '/build', label: 'Commitment' },
  { to: '/market', label: 'Drops' },
  { to: '/pools', label: 'Pools' },
]

export function Shell() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const wallet = useWallet()

  return (
    <div className="min-h-screen">
      <CustomCursor />
      <header className="fixed top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/70 backdrop-blur-xl">
        <div className="container-page flex h-20 items-center justify-between gap-4">
          <button
            className="inline-flex items-center gap-3 active:scale-95 transition"
            onClick={() => navigate('/')}
            type="button"
          >
            <img src="/logo.png" alt="Ember Logo" className="w-9 h-auto object-contain drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]" />
            <div className="text-left leading-tight hidden md:block">
              <div className="text-lg font-bold tracking-tight text-zinc-100">Ember</div>
            </div>
          </button>

          <nav className="flex flex-wrap items-center justify-center gap-2">
            {nav.map((item) => (
              <Magnetic key={item.to} strength={15}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      'rounded-full px-4 py-2 text-[15px] font-semibold transition inline-block',
                      isActive ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-200 hover:bg-[#0a0c10] hover:text-white',
                    )
                  }
                  aria-current={location.pathname === item.to ? 'page' : undefined}
                >
                  {item.label}
                </NavLink>
              </Magnetic>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Magnetic strength={20}>
              <button
                className="btn"
                type="button"
                onClick={async () => {
                  await wallet.connect()
                  await wallet.ensureHardhat()
                }}
                disabled={wallet.connecting}
                title={wallet.hasProvider ? 'Connect MetaMask' : 'Install MetaMask'}
              >
                {wallet.address ? shortAddr(wallet.address) : wallet.connecting ? 'Connecting…' : 'Connect'}
              </button>
            </Magnetic>

            {user ? (
              <>
                <span className="hidden text-sm font-medium text-zinc-200 lg:inline bg-[#0a0c10] px-3 py-1.5 rounded-full border border-orange-500/30">
                  {user.name} · {user.tier}
                </span>
                <Magnetic strength={20}>
                  <button className="btn" type="button" onClick={logout}>
                    Log out
                  </button>
                </Magnetic>
              </>
            ) : (
              <Magnetic strength={20}>
                <button className="btn btn-primary" type="button" onClick={() => navigate('/login')}>
                  Enter App
                </button>
              </Magnetic>
            )}
          </div>
        </div>
      </header>

      <main className="container-page pt-28 pb-10">
        <Outlet />
      </main>

      <footer className="border-t border-zinc-100 py-12 mt-20">
        <div className="container-page flex flex-col gap-4 text-sm font-medium text-zinc-500 md:flex-row md:items-center md:justify-between">
          <div>Ember — Built for discipline, not pressure.</div>
          <div className="flex items-center gap-3">
            <span className="pill relative overflow-hidden group">
              <span className="relative z-10 transition-colors group-hover:text-white">Write your own story.</span>
              <span className="absolute inset-0 bg-gradient-to-r from-orange-500 to-blue-500 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </span>
          </div>
        </div>
      </footer>

      {wallet.error ? (
        <div className="fixed bottom-5 left-1/2 z-50 w-[min(720px,calc(100vw-24px))] -translate-x-1/2 rounded-2xl border border-orange-500/30 bg-[#0a0c10] px-4 py-3 text-sm text-white shadow-xl">
          {wallet.error}
        </div>
      ) : null}
    </div>
  )
}

