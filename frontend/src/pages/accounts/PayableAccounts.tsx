/**
 * Página de contas a pagar com listagem completa e funcionalidades CRUD.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  TrendingDown, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  DollarSign,
  Building,
  AlertCircle
} from 'lucide-react';
import { 
  payableAccountService, 
  PayableAccountResponse, 
  PayableAccountListResponse,
  PayableAccountFilters 
} from '../../services/payableAccountService';

export function PayableAccounts() {
  const [accounts, setAccounts] = useState<PayableAccountResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<PayableAccountFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const itemsPerPage = 20;

  // Carregar contas a pagar
  const loadAccounts = async (page: number = 1, currentFilters: PayableAccountFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const skip = (page - 1) * itemsPerPage;
      const response: PayableAccountListResponse = await payableAccountService.listPayableAccounts(
        skip,
        itemsPerPage,
        currentFilters
      );
      
      setAccounts(response.payable_accounts);
      setTotalPages(Math.ceil(response.total / itemsPerPage));
      setCurrentPage(page);
    } catch (err) {
      setError('Erro ao carregar contas a pagar. Tente novamente.');
      console.error('Erro ao carregar contas:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadAccounts();
  }, []);

  // Aplicar filtros
  const handleApplyFilters = () => {
    const newFilters = { ...filters };
    if (searchTerm) {
      newFilters.description = searchTerm;
    }
    loadAccounts(1, newFilters);
  };

  // Limpar filtros
  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm('');
    loadAccounts(1, {});
  };

  // Excluir conta
  const handleDelete = async (accountId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta a pagar?')) {
      return;
    }

    try {
      await payableAccountService.deletePayableAccount(accountId);
      loadAccounts(currentPage, filters);
    } catch (err) {
      alert('Erro ao excluir conta a pagar. Tente novamente.');
      console.error('Erro ao excluir conta:', err);
    }
  };

  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Obter status da conta
  const getAccountStatus = (account: PayableAccountResponse) => {
    const hasOverdueInstallments = account.installments?.some(
      installment => !installment.payment_date && new Date(installment.due_date) < new Date()
    );
    
    const allPaid = account.installments?.every(installment => installment.payment_date);
    
    if (allPaid) return { label: 'Pago', color: 'text-green-600 bg-green-100' };
    if (hasOverdueInstallments) return { label: 'Vencido', color: 'text-red-600 bg-red-100' };
    return { label: 'Pendente', color: 'text-yellow-600 bg-yellow-100' };
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <TrendingDown className="h-8 w-8 mr-3 text-red-600" />
            Contas a Pagar
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie suas obrigações financeiras
          </p>
        </div>
        <Link to="/contas-pagar/nova" className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Nova Conta
        </Link>
      </div>

      {/* Barra de busca e filtros */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar por descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                  onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </button>
              <button onClick={handleApplyFilters} className="btn-primary">
                Buscar
              </button>
            </div>
          </div>

          {/* Filtros avançados */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data inicial
                  </label>
                  <input
                    type="date"
                    value={filters.issue_date_start || ''}
                    onChange={(e) => setFilters({ ...filters, issue_date_start: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data final
                  </label>
                  <input
                    type="date"
                    value={filters.issue_date_end || ''}
                    onChange={(e) => setFilters({ ...filters, issue_date_end: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status do pagamento
                  </label>
                  <select
                    value={filters.payment_status || ''}
                    onChange={(e) => setFilters({ ...filters, payment_status: e.target.value })}
                    className="input"
                  >
                    <option value="">Todos</option>
                    <option value="PENDING">Pendente</option>
                    <option value="PAID">Pago</option>
                    <option value="OVERDUE">Vencido</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={handleApplyFilters} className="btn-primary">
                  Aplicar Filtros
                </button>
                <button onClick={handleClearFilters} className="btn-secondary">
                  Limpar Filtros
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lista de contas */}
      <div className="card">
        <div className="card-body">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Carregando contas a pagar...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-12">
              <TrendingDown className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Nenhuma conta a pagar encontrada
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Comece criando uma nova conta a pagar.
              </p>
              <div className="mt-6">
                <Link to="/contas-pagar/nova" className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Conta
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Tabela */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fornecedor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nota Fiscal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data Emissão
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {accounts.map((account) => {
                      const status = getAccountStatus(account);
                      return (
                        <tr key={account.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Building className="h-4 w-4 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {account.supplier?.company_name || 'N/A'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {account.supplier?.tax_id || ''}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {account.invoice_number || 'Sem número'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                              {formatDate(account.issue_date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm font-medium text-gray-900">
                              <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                              {formatCurrency(account.total_amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Link
                                to={`/contas-pagar/${account.id}`}
                                className="text-blue-600 hover:text-blue-900"
                                title="Visualizar"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              <Link
                                to={`/contas-pagar/${account.id}/editar`}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                              <button
                                onClick={() => handleDelete(account.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => loadAccounts(currentPage - 1, filters)}
                      disabled={currentPage === 1}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => loadAccounts(currentPage + 1, filters)}
                      disabled={currentPage === totalPages}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
