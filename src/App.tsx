import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { SitePage } from '@/modules/site/SitePage'
import { BookingPage } from '@/modules/booking/BookingPage'
import { LoginPage } from '@/modules/admin/LoginPage'
import { RequireAuth } from '@/modules/admin/RequireAuth'
import { AdminLayout } from '@/modules/admin/AdminLayout'
import { AgendamentosPage } from '@/modules/admin/AgendamentosPage'
import { FinanceiroPage } from '@/modules/admin/FinanceiroPage'
import { ClientesPage } from '@/modules/admin/ClientesPage'

/**
 * Roteamento principal do sistema white-label:
 *  - "/"        → Site institucional
 *  - "/agendar" → PWA de agendamento 24/7
 *  - "/admin"   → Painel administrativo (Kanban, Financeiro, CRM)
 * Os módulos de agendamento e admin serão implementados nas próximas etapas.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SitePage />} />
        <Route path="/agendar" element={<BookingPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="agendamentos" replace />} />
          <Route path="agendamentos" element={<AgendamentosPage />} />
          <Route path="financeiro" element={<FinanceiroPage />} />
          <Route path="clientes" element={<ClientesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

