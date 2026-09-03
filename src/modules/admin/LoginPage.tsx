import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Loader2, LogIn, Scissors } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { BRAND } from '@/config/brand'
import { useAuth } from '@/hooks/useAuth'

/** Login do painel administrativo (Supabase Auth e-mail/senha). */
export function LoginPage() {
  const navigate = useNavigate()
  const { session, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!loading && session) {
    return <Navigate to="/admin" replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos.'
          : err.message,
      )
      setSubmitting(false)
      return
    }
    navigate('/admin', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/15 text-brand-primary">
            <Scissors className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-bold">{BRAND.name}</h1>
          <p className="text-sm text-brand-light/60">
            Painel administrativo — acesso restrito
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-white/10 bg-brand-secondary/50 p-6"
        >
          <div>
            <label htmlFor="admin-email" className="mb-1 block text-sm text-brand-light/70">
              E-mail
            </label>
            <input
              id="admin-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full rounded-xl border border-white/10 bg-brand-dark px-4 py-3 outline-none transition focus:border-brand-primary"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-1 block text-sm text-brand-light/70">
              Senha
            </label>
            <input
              id="admin-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-xl border border-white/10 bg-brand-dark px-4 py-3 outline-none transition focus:border-brand-primary"
            />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3 font-semibold text-brand-dark transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <LogIn className="h-5 w-5" />
            )}
            Entrar
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-brand-light/40">
          Use o e-mail e a senha criados em Authentication &gt; Users no Supabase.
        </p>
      </div>
    </div>
  )
}
