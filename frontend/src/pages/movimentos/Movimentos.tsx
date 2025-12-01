import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { 
  Plus, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  FileText,
  Eye
} from 'lucide-react';
import movimentosService, { MovimentoConta, MovimentoContaFilter } from '../../services/movimentosService';
import pessoasService, { Pessoa } from '../../services/pessoasService';
import { SortableTableHeader, SortOrder } from '../../components/table/SortableTableHeader';

// Valor especial para filtro invisível (não aparece para o usuário)
const HIDDEN_FILTER_VALUE = '__HIDDEN__';

const Movimentos: React.FC = () => {
  const [movimentos, setMovimentos] = useState<MovimentoConta[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  // const [resumo, setResumo] = useState<MovimentoResumo[]>([]); // TODO: Implementar resumo de movimentos
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  // Inicializa com filtro invisível ativo
  const [filters, setFilters] = useState<MovimentoContaFilter>({
    tipo: HIDDEN_FILTER_VALUE as any,
    status: HIDDEN_FILTER_VALUE as any
  });
  const [showFilters] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ field: string; order: SortOrder } | undefined>();

  const pageSize = 10;

  const loadMovimentos = useCallback(async (page: number = 1, currentFilters: MovimentoContaFilter = {}, includeInactive: boolean = false) => {
    try {
      setLoading(true);
      const [movimentosResponse, _resumoResponse, pessoasResponse] = await Promise.all([
        movimentosService.getAll({
          page,
          size: pageSize,
          filters: { ...currentFilters, include_deleted: includeInactive }
        }),
        movimentosService.getResumo(),
        pessoasService.getAll({ page: 1, size: 100 })
      ]);
      
      setMovimentos(movimentosResponse.items);
      setTotalPages(movimentosResponse.pages);
      setTotal(movimentosResponse.total);
      setCurrentPage(page);
      // setResumo(resumoResponse); // TODO: Implementar exibição de resumo
      setPessoas(pessoasResponse.items);
    } catch (err) {
      const error = err as AxiosError<{ detail: string }>;
      setError(error.response?.data?.detail || 'Erro ao carregar movimentos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Verifica se AMBOS os filtros principais estão invisíveis E não há outros filtros
    const bothHidden = filters.tipo === HIDDEN_FILTER_VALUE && filters.status === HIDDEN_FILTER_VALUE;
    const hasOtherFilters = !!(
      filters.numeronotafiscal ||
      filters.fornecedor_id ||
      filters.data_emissao_inicio ||
      filters.data_emissao_fim ||
      filters.data_vencimento_inicio ||
      filters.data_vencimento_fim
    );
    
    // Só bloqueia se AMBOS estiverem invisíveis E não houver outros filtros
    if (bothHidden && !hasOtherFilters) {
      setMovimentos([]);
      setTotalPages(1);
      setTotal(0);
      setCurrentPage(1);
      return;
    }
    
    // Limpa filtros e remove filtro invisível antes de enviar para API
    const cleanFilters: MovimentoContaFilter = {};
    if (filters.numeronotafiscal && filters.numeronotafiscal.trim()) cleanFilters.numeronotafiscal = filters.numeronotafiscal.trim();
    if (filters.fornecedor_id) cleanFilters.fornecedor_id = filters.fornecedor_id;
    // Remove filtro invisível - não envia para API
    if (filters.tipo !== undefined && filters.tipo !== HIDDEN_FILTER_VALUE) {
      if (filters.tipo !== '') {
        cleanFilters.tipo = filters.tipo as 'RECEITA' | 'DESPESA';
      }
    }
    if (filters.status !== undefined && filters.status !== HIDDEN_FILTER_VALUE) {
      if (filters.status !== '') {
        cleanFilters.status = filters.status as 'PENDENTE' | 'PAGO' | 'CANCELADO';
      }
    }
    if (filters.data_emissao_inicio) cleanFilters.data_emissao_inicio = filters.data_emissao_inicio;
    if (filters.data_emissao_fim) cleanFilters.data_emissao_fim = filters.data_emissao_fim;
    if (filters.data_vencimento_inicio) cleanFilters.data_vencimento_inicio = filters.data_vencimento_inicio;
    if (filters.data_vencimento_fim) cleanFilters.data_vencimento_fim = filters.data_vencimento_fim;
    if (filters.order_by) cleanFilters.order_by = filters.order_by;
    if (filters.order_dir) cleanFilters.order_dir = filters.order_dir;
    
    // Debounce para campos de texto (numeronotafiscal)
    const isTextFilter = !!filters.numeronotafiscal;
    const timeoutId = isTextFilter 
      ? setTimeout(() => {
          loadMovimentos(1, cleanFilters, showInactive);
        }, 500) // 500ms de debounce para campos de texto
      : null;
    
    if (!isTextFilter) {
      // Para filtros de select e data, busca imediatamente
      loadMovimentos(1, cleanFilters, showInactive);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [showInactive, loadMovimentos, filters]);

  const handleFilterChange = (field: keyof MovimentoContaFilter, value: string | number) => {
    const newFilters = { ...filters };
    if (value === '' || value === null || value === undefined) {
      delete newFilters[field];
    } else {
      (newFilters as any)[field] = value;
    }
    setFilters(newFilters);
  };

  const handleSortChange = (field: string, order: SortOrder) => {
    if (order === 'default') {
      setSortConfig(undefined);
      const newFilters = { ...filters };
      delete newFilters.order_by;
      delete newFilters.order_dir;
      setFilters(newFilters);
    } else {
      setSortConfig({ field, order });
      setFilters({
        ...filters,
        order_by: field,
        order_dir: order === 'asc' ? 'asc' : 'desc'
      });
    }
  };

  

  const clearFilters = () => {
    // Volta para o estado inicial com filtros invisíveis
    setFilters({
      tipo: HIDDEN_FILTER_VALUE as any,
      status: HIDDEN_FILTER_VALUE as any
    });
    setMovimentos([]);
    setTotalPages(1);
    setTotal(0);
    setCurrentPage(1);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este movimento?')) {
      try {
        await movimentosService.delete(id);
        loadMovimentos(currentPage, filters, showInactive);
      } catch (err) {
        const error = err as AxiosError<{ detail: string }>;
        setError(error.response?.data?.detail || 'Erro ao excluir movimento');
      }
    }
  };

  const handleMarcarComoPago = async (id: number) => {
    try {
      await movimentosService.marcarComoPago(id);
      loadMovimentos(currentPage, filters, showInactive);
    } catch (err) {
      const error = err as AxiosError<{ detail: string }>;
      setError(error.response?.data?.detail || 'Erro ao marcar como pago');
    }
  };

  const handleCancelar = async (id: number) => {
    if (window.confirm('Tem certeza que deseja cancelar este movimento?')) {
      try {
        await movimentosService.cancelar(id);
        loadMovimentos(currentPage, filters, showInactive);
      } catch (err) {
        const error = err as AxiosError<{ detail: string }>;
        setError(error.response?.data?.detail || 'Erro ao cancelar movimento');
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const calcularTotais = () => {
    const receitas = movimentos
      .filter(m => m.tipo === 'RECEITA')
      .reduce((sum, m) => sum + m.valortotal, 0);
    
    const despesas = movimentos
      .filter(m => m.tipo === 'DESPESA')
      .reduce((sum, m) => sum + m.valortotal, 0);
    
    return { receitas, despesas, saldo: receitas - despesas };
  };

  const totais = calcularTotais();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Movimentos de Contas</h1>
          <p className="text-gray-600 mt-1">Total: {total} movimento(s)</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Toggle para Inativos */}
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Mostrar Inativos
            </span>
          </label>
          
          <Link
            to="/movimentos/novo"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Movimento
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Receitas</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totais.receitas)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <TrendingDown className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Despesas</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totais.despesas)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <DollarSign className={`h-8 w-8 ${totais.saldo >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Saldo</p>
              <p className={`text-2xl font-bold ${totais.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totais.saldo)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total de Movimentos</p>
              <p className="text-2xl font-bold text-blue-600">{total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow-md rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center text-gray-700">
            <Filter className="w-4 h-4 mr-2" />
            <span>Filtros</span>
          </div>
        </div>
        
        {showFilters && (
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nota Fiscal
                </label>
                <input
                  type="text"
                  value={filters.numeronotafiscal || ''}
                  onChange={(e) => {
                    const newFilters: MovimentoContaFilter = { ...filters };
                    if (e.target.value.trim()) {
                      newFilters.numeronotafiscal = e.target.value;
                      // Remove filtros invisíveis quando há texto
                      if (newFilters.tipo === HIDDEN_FILTER_VALUE) delete newFilters.tipo;
                      if (newFilters.status === HIDDEN_FILTER_VALUE) delete newFilters.status;
                    } else {
                      delete newFilters.numeronotafiscal;
                    }
                    setFilters(newFilters);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Número da nota fiscal"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fornecedor
                </label>
                <select
                  value={filters.fornecedor_id || ''}
                  onChange={(e) => {
                    const newFilters: MovimentoContaFilter = { ...filters };
                    const val = e.target.value;
                    if (val && val !== '') {
                      newFilters.fornecedor_id = parseInt(val);
                      // Remove filtros invisíveis quando selecionar fornecedor
                      if (newFilters.tipo === HIDDEN_FILTER_VALUE) delete newFilters.tipo;
                      if (newFilters.status === HIDDEN_FILTER_VALUE) delete newFilters.status;
                    } else {
                      delete newFilters.fornecedor_id;
                    }
                    setFilters(newFilters);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione</option>
                  {pessoas.filter(p => p.tipo === 'FORNECEDOR' || p.tipo === 'AMBOS').map((pessoa) => (
                    <option key={pessoa.idPessoas} value={pessoa.idPessoas}>
                      {pessoa.razaosocial || pessoa.fantasia}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={
                    filters.tipo === HIDDEN_FILTER_VALUE 
                      ? '__empty' 
                      : (filters.tipo === undefined || filters.tipo === '' ? '' : filters.tipo)
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    const newFilters: MovimentoContaFilter = { ...filters };
                    if (val === '__empty') {
                      newFilters.tipo = HIDDEN_FILTER_VALUE as any;
                    } else if (val === '') {
                      delete newFilters.tipo;
                    } else {
                      newFilters.tipo = val as 'RECEITA' | 'DESPESA';
                    }
                    setFilters(newFilters);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="__empty" disabled hidden></option>
                  <option value="">TODOS</option>
                  <option value="RECEITA">Receita</option>
                  <option value="DESPESA">Despesa</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={
                    filters.status === HIDDEN_FILTER_VALUE 
                      ? '__empty' 
                      : (filters.status === undefined || filters.status === '' ? '' : filters.status)
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    const newFilters: MovimentoContaFilter = { ...filters };
                    if (val === '__empty') {
                      newFilters.status = HIDDEN_FILTER_VALUE as any;
                    } else if (val === '') {
                      delete newFilters.status;
                    } else {
                      newFilters.status = val as 'PENDENTE' | 'PAGO' | 'CANCELADO';
                    }
                    setFilters(newFilters);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="__empty" disabled hidden></option>
                  <option value="">TODOS</option>
                  <option value="PENDENTE">Pendente</option>
                  <option value="PAGO">Pago</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Data Emissão (Início)
                </label>
                <input
                  type="date"
                  value={filters.data_emissao_inicio || ''}
                  onChange={(e) => {
                    const newFilters: MovimentoContaFilter = { ...filters };
                    if (e.target.value) {
                      newFilters.data_emissao_inicio = e.target.value;
                      // Remove filtros invisíveis quando há data
                      if (newFilters.tipo === HIDDEN_FILTER_VALUE) delete newFilters.tipo;
                      if (newFilters.status === HIDDEN_FILTER_VALUE) delete newFilters.status;
                    } else {
                      delete newFilters.data_emissao_inicio;
                    }
                    setFilters(newFilters);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Data Emissão (Fim)
                </label>
                <input
                  type="date"
                  value={filters.data_emissao_fim || ''}
                  onChange={(e) => {
                    const newFilters: MovimentoContaFilter = { ...filters };
                    if (e.target.value) {
                      newFilters.data_emissao_fim = e.target.value;
                      // Remove filtros invisíveis quando há data
                      if (newFilters.tipo === HIDDEN_FILTER_VALUE) delete newFilters.tipo;
                      if (newFilters.status === HIDDEN_FILTER_VALUE) delete newFilters.status;
                    } else {
                      delete newFilters.data_emissao_fim;
                    }
                    setFilters(newFilters);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Vencimento (Início)
                </label>
                <input
                  type="date"
                  value={filters.data_vencimento_inicio || ''}
                  onChange={(e) => {
                    const newFilters: MovimentoContaFilter = { ...filters };
                    if (e.target.value) {
                      newFilters.data_vencimento_inicio = e.target.value;
                      // Remove filtros invisíveis quando há data
                      if (newFilters.tipo === HIDDEN_FILTER_VALUE) delete newFilters.tipo;
                      if (newFilters.status === HIDDEN_FILTER_VALUE) delete newFilters.status;
                    } else {
                      delete newFilters.data_vencimento_inicio;
                    }
                    setFilters(newFilters);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Vencimento (Fim)
                </label>
                <input
                  type="date"
                  value={filters.data_vencimento_fim || ''}
                  onChange={(e) => {
                    const newFilters: MovimentoContaFilter = { ...filters };
                    if (e.target.value) {
                      newFilters.data_vencimento_fim = e.target.value;
                      // Remove filtros invisíveis quando há data
                      if (newFilters.tipo === HIDDEN_FILTER_VALUE) delete newFilters.tipo;
                      if (newFilters.status === HIDDEN_FILTER_VALUE) delete newFilters.status;
                    } else {
                      delete newFilters.data_vencimento_fim;
                    }
                    setFilters(newFilters);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={clearFilters}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <SortableTableHeader
                  label="Nota Fiscal"
                  field="numeronotafiscal"
                  currentSort={sortConfig ? { field: sortConfig.field, order: sortConfig.order } : undefined}
                  onSortChange={(field, order) => handleSortChange(field, order)}
                />
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fornecedor/Cliente
                </th>
                <SortableTableHeader
                  label="Tipo"
                  field="tipo"
                  currentSort={sortConfig ? { field: sortConfig.field, order: sortConfig.order } : undefined}
                  onSortChange={(field, order) => handleSortChange(field, order)}
                />
                <SortableTableHeader
                  label="Valor"
                  field="valortotal"
                  currentSort={sortConfig ? { field: sortConfig.field, order: sortConfig.order } : undefined}
                  onSortChange={(field, order) => handleSortChange(field, order)}
                />
                <SortableTableHeader
                  label="Data Emissão"
                  field="dataemissao"
                  currentSort={sortConfig ? { field: sortConfig.field, order: sortConfig.order } : undefined}
                  onSortChange={(field, order) => handleSortChange(field, order)}
                />
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Vencimento
                </th>
                <SortableTableHeader
                  label="Status"
                  field="status"
                  currentSort={sortConfig ? { field: sortConfig.field, order: sortConfig.order } : undefined}
                  onSortChange={(field, order) => handleSortChange(field, order)}
                />
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movimentos.map((movimento) => (
                <tr key={movimento.idMovimentoContas} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {movimento.numeronotafiscal}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {movimento.fornecedor_cliente?.razaosocial || 
                     movimento.fornecedor_cliente?.fantasia || 
                     'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      movimento.tipo === 'RECEITA' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {movimento.tipo === 'RECEITA' ? 'Receita' : 'Despesa'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(movimento.valortotal)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(movimento.dataemissao)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(movimento.datavencimento || '')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      movimento.status === 'PAGO' 
                        ? 'bg-green-100 text-green-800' 
                        : movimento.status === 'PENDENTE'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {movimento.status === 'PAGO' ? 'Pago' : 
                       movimento.status === 'PENDENTE' ? 'Pendente' : 'Cancelado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link
                        to={`/movimentos/${movimento.idMovimentoContas}`}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Link>
                      <Link
                        to={`/movimentos/${movimento.idMovimentoContas}/editar`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Editar
                      </Link>
                      {movimento.status === 'PENDENTE' && (
                        <button
                          onClick={() => handleMarcarComoPago(movimento.idMovimentoContas!)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Pagar
                        </button>
                      )}
                      {movimento.status === 'PENDENTE' && (
                        <button
                          onClick={() => handleCancelar(movimento.idMovimentoContas!)}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          Cancelar
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(movimento.idMovimentoContas!)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Paginação */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => loadMovimentos(currentPage - 1, filters, showInactive)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => loadMovimentos(currentPage + 1, filters, showInactive)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando página <span className="font-medium">{currentPage}</span> de{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => loadMovimentos(currentPage - 1, filters, showInactive)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  {/* Simplificação da paginação - mostrar números */}
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => loadMovimentos(i + 1, filters, showInactive)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === i + 1
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => loadMovimentos(currentPage + 1, filters, showInactive)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Próxima
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Movimentos;
