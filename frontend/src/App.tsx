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
import { PdfProcessing } from './pages/pdf/PdfProcessing';
import Pessoas from './pages/pessoas/Pessoas';
import PessoaForm from './pages/pessoas/PessoaForm';
import PessoaDetalhes from './pages/pessoas/PessoaDetalhes';
import MovimentoDetalhes from './pages/movimentos/MovimentoDetalhes';
import Movimentos from './pages/movimentos/Movimentos';
import MovimentoForm from './pages/movimentos/MovimentoForm';
import { Parcelas } from './pages/parcelas/Parcelas';
import { RagConsulta } from './pages/rag/RagConsulta';

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
              
              {/* Processamento de PDF */}
              <Route path="/processar-pdf" element={<PdfProcessing />} />
              
              {/* Pessoas (Fornecedores/Clientes/Faturados) */}
              <Route path="/pessoas" element={<Pessoas />} />
              <Route path="/pessoas/novo" element={<PessoaForm />} />
              <Route path="/pessoas/:id" element={<PessoaDetalhes />} />
              <Route path="/pessoas/:id/editar" element={<PessoaForm />} />
              
              {/* Movimentos de Contas (Pagar/Receber) */}
              <Route path="/movimentos" element={<Movimentos />} />
              <Route path="/movimentos/:id" element={<MovimentoDetalhes />} />
              <Route path="/movimentos/novo" element={<MovimentoForm />} />
              <Route path="/movimentos/:id/editar" element={<MovimentoForm />} />
              
              {/* Parcelas */}
              <Route path="/parcelas" element={<Parcelas />} />

              {/* Consulta RAG */}
              <Route path="/rag" element={<RagConsulta />} />
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
