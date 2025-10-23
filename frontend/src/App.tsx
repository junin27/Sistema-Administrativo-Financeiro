/**
 * Componente principal da aplicação React.
 * Configura roteamento, contextos e layout principal.
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Layout
import { Layout } from './components/layout/Layout';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Suppliers } from './pages/suppliers/Suppliers';
import { SupplierForm } from './pages/suppliers/SupplierForm';
import { Customers } from './pages/customers/Customers';
import { CustomerForm } from './pages/customers/CustomerForm';
import { PayableAccounts } from './pages/accounts/PayableAccounts';
import { PayableAccountForm } from './pages/accounts/PayableAccountForm';
import { ReceivableAccounts } from './pages/accounts/ReceivableAccounts';
import { ReceivableAccountForm } from './pages/accounts/ReceivableAccountForm';
import { ExpenseTypes } from './pages/classifications/ExpenseTypes';
import { ExpenseTypeForm } from './pages/classifications/ExpenseTypeForm';
import { RevenueTypes } from './pages/classifications/RevenueTypes';
import { RevenueTypeForm } from './pages/classifications/RevenueTypeForm';
import { PdfProcessing } from './pages/pdf/PdfProcessing';
import Pessoas from './pages/pessoas/Pessoas';
import PessoaForm from './pages/pessoas/PessoaForm';
import PessoaDetalhes from './pages/pessoas/PessoaDetalhes';
import SupplierDetalhes from './pages/suppliers/SupplierDetalhes';
import MovimentoDetalhes from './pages/movimentos/MovimentoDetalhes';
import Movimentos from './pages/movimentos/Movimentos';
import MovimentoForm from './pages/movimentos/MovimentoForm';

// Configuração do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <div className="min-h-screen bg-gray-50">
          <Layout>
            <Routes>
              {/* Dashboard */}
              <Route path="/" element={<Dashboard />} />
              
              {/* Fornecedores */}
            <Route path="/fornecedores" element={<Suppliers />} />
            <Route path="/fornecedores/:id" element={<SupplierDetalhes />} />
            <Route path="/fornecedores/novo" element={<SupplierForm />} />
            <Route path="/fornecedores/:id/editar" element={<SupplierForm />} />
              
              {/* Clientes */}
              <Route path="/clientes" element={<Customers />} />
              <Route path="/clientes/novo" element={<CustomerForm />} />
              <Route path="/clientes/:id/editar" element={<CustomerForm />} />
              
              {/* Contas a Pagar */}
              <Route path="/contas-pagar" element={<PayableAccounts />} />
              <Route path="/contas-pagar/nova" element={<PayableAccountForm />} />
              <Route path="/contas-pagar/:id/editar" element={<PayableAccountForm />} />
              
              {/* Contas a Receber */}
              <Route path="/contas-receber" element={<ReceivableAccounts />} />
              <Route path="/contas-receber/nova" element={<ReceivableAccountForm />} />
              <Route path="/contas-receber/:id/editar" element={<ReceivableAccountForm />} />
              
              {/* Tipos de Despesa */}
              <Route path="/tipos-despesa" element={<ExpenseTypes />} />
              <Route path="/tipos-despesa/novo" element={<ExpenseTypeForm />} />
              <Route path="/tipos-despesa/:id/editar" element={<ExpenseTypeForm />} />
              
              {/* Tipos de Receita */}
              <Route path="/tipos-receita" element={<RevenueTypes />} />
              <Route path="/tipos-receita/novo" element={<RevenueTypeForm />} />
              <Route path="/tipos-receita/:id/editar" element={<RevenueTypeForm />} />
              
              {/* Processamento de PDF */}
              <Route path="/processar-pdf" element={<PdfProcessing />} />
              
              {/* Pessoas (Fornecedores/Clientes) */}
              <Route path="/pessoas" element={<Pessoas />} />
              <Route path="/pessoas/novo" element={<PessoaForm />} />
              <Route path="/pessoas/:id" element={<PessoaDetalhes />} />
              <Route path="/pessoas/:id/editar" element={<PessoaForm />} />
              
              {/* Movimentos de Contas */}
              <Route path="/movimentos" element={<Movimentos />} />
            <Route path="/movimentos/:id" element={<MovimentoDetalhes />} />
            <Route path="/movimentos/novo" element={<MovimentoForm />} />
            <Route path="/movimentos/:id/editar" element={<MovimentoForm />} />
            </Routes>
          </Layout>
          
          {/* Notificações */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}
