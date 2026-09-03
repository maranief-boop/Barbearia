import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

/** Protege as rotas do painel: sem sessão → login. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}
