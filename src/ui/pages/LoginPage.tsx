import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../core/auth'
import { MOCK_USERS } from '../../core/mockUsers'

export function LoginPage() {
  const { loginWithPassword, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const presets = useMemo(
    () =>
      MOCK_USERS.map((u) => ({
        label: `${u.name} (${u.email}) · ${u.tier}`,
        email: u.email,
        password: u.password,
      })),
    [],
  )

  const [email, setEmail] = useState(presets[0]?.email ?? '')
  const [password, setPassword] = useState(presets[0]?.password ?? '')
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Log in</h2>
        <p className="text-sm text-zinc-200">Demo accounts included. Google sign-in is available.</p>
      </div>

      <div className="card space-y-4 p-5">
        <label className="block space-y-2">
          <div className="text-xs font-medium text-zinc-100">Quick fill</div>
          <select
            className="w-full rounded-xl border border-orange-500/30 bg-[#0a0c10] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/50"
            onChange={(e) => {
              const idx = Number(e.target.value)
              const p = presets[idx]
              if (!p) return
              setEmail(p.email)
              setPassword(p.password)
              setError(null)
            }}
            defaultValue={0}
          >
            {presets.map((p, idx) => (
              <option value={idx} key={p.email}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block space-y-2">
            <div className="text-xs font-medium text-zinc-100">Email</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-orange-500/30 bg-[#0a0c10] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/50"
              placeholder="you@ember.demo"
              autoComplete="username"
            />
          </label>
          <label className="block space-y-2">
            <div className="text-xs font-medium text-zinc-100">Password</div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-orange-500/30 bg-[#0a0c10] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/50"
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
            />
          </label>
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              const res = loginWithPassword(email, password)
              if (!res.ok) {
                setError(res.error)
                return
              }
              navigate('/talk')
            }}
          >
            Continue
          </button>
          <button
            className="btn"
            type="button"
            onClick={() => {
              loginWithGoogle()
              navigate('/talk')
            }}
          >
            Continue with Google
          </button>
        </div>
      </div>

      <div className="text-sm text-zinc-200">
        Default password for demo accounts: <span className="font-mono">Ember@123</span>
      </div>

      <p className="text-center text-sm text-zinc-400">
        <Link to="/dashboard" className="text-orange-400 hover:text-orange-300 font-medium">
          Open the discipline dashboard
        </Link>{' '}
        (wallet + on-chain stats)
      </p>
    </div>
  )
}

