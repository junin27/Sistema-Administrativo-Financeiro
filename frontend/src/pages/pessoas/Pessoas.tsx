import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import pessoasService, { Pessoa, PessoaFilter } from '../../services/pessoasService';
import { SortableTableHeader, SortOrder } from '../../components/table/SortableTableHeader';

const Pessoas: React.FC = () => {
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<PessoaFilter>({});
  const [showFilters] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ field: string; order: SortOrder } | undefined>();

  const pageSize = 10;

  const loadPessoas = useCallback(async (page: number = 1, currentFilters: PessoaFilter = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await pessoasService.getAll({
        page,
        size: pageSize,
        filters: currentFilters
      });
      
      // Garantir que items seja sempre um array
      setPessoas(response?.items || []);
      setTotalPages(response?.pages || 1);
      setTotal(response?.total || 0);
      setCurrentPage(page);
    } catch (error) {
      const err = error as AxiosError<{ detail: string }>;
      setError(err.response?.data?.detail || 'Erro ao carregar pessoas');
      // Em caso de erro, garantir que pessoas seja um array vazio
      setPessoas([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Limpa filtros vazios antes de verificar
    const cleanFilters: PessoaFilter = {};
    if (filters.documento && filters.documento.trim()) cleanFilters.documento = filters.documento.trim();
    if (filters.tipo && filters.tipo.trim() && filters.tipo !== 'none') cleanFilters.tipo = filters.tipo.trim();
    if (filters.status && filters.status.trim() && filters.status !== 'none') cleanFilters.status = filters.status.trim();
    if (filters.razaosocial && filters.razaosocial.trim()) cleanFilters.razaosocial = filters.razaosocial.trim();
    if (filters.fantasia && filters.fantasia.trim()) cleanFilters.fantasia = filters.fantasia.trim();
    if (filters.order_by) cleanFilters.order_by = filters.order_by;
    if (filters.order_dir) cleanFilters.order_dir = filters.order_dir;
    
    const hasFilters = Object.keys(cleanFilters).length > 0;
    
    // Debounce para campos de texto (documento, razaosocial, fantasia)
    const isTextFilter = !!(filters.documento || filters.razaosocial || filters.fantasia);
    const timeoutId = isTextFilter 
      ? setTimeout(() => {
          // Sempre carrega pessoas, mesmo sem filtros (mostra todas)
          loadPessoas(1, cleanFilters);
        }, 500) // 500ms de debounce para campos de texto
      : null;
    
    if (!isTextFilter) {
      // Para filtros de select, busca imediatamente
      // Sempre carrega pessoas, mesmo sem filtros (mostra todas)
      loadPessoas(1, cleanFilters);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loadPessoas, filters]);

  const handleFilterChange = (field: keyof PessoaFilter, value: string) => {
    // Se o valor for vazio, remove o filtro (undefined)
    // Se tiver valor, usa o valor normalmente
    const newFilters = { ...filters };
    if (value === '' || value === 'none') {
      delete newFilters[field];
    } else {
      newFilters[field] = value;
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
    setFilters({});
    setPessoas([]);
    setTotalPages(1);
    setTotal(0);
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta pessoa?')) {
      try {
        await pessoasService.delete(id);
        loadPessoas(currentPage, filters);
      } catch (err) {
        const error = err as AxiosError<{ detail: string }>;
        setError(error.response?.data?.detail || 'Erro ao excluir pessoa');
      }
    }
  };

  const formatDocument = (documento: string) => {
    if (documento.length === 11) {
      // CPF
      return documento.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (documento.length === 14) {
      // CNPJ
      return documento.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return documento;
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Pessoas</h1>
          <p className="text-gray-600 mt-1">Total: {total} pessoa(s)</p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/pessoas/novo"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Nova Pessoa
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white shadow-md rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <span className="text-gray-700">Filtros</span>
        </div>
        
        {showFilters && (
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Documento
                </label>
                <input
                  type="text"
                  value={filters.documento || ''}
                  onChange={(e) => handleFilterChange('documento', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="CPF ou CNPJ"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={filters.tipo || 'none'}
                  onChange={(e) => handleFilterChange('tipo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">Selecione</option>
                  <option value="FORNECEDOR">Fornecedor</option>
                  <option value="CLIENTE">Cliente</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Razão Social
                </label>
                <input
                  type="text"
                  value={filters.razaosocial || ''}
                  onChange={(e) => handleFilterChange('razaosocial', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome da empresa"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status || 'none'}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">Selecione</option>
                  <option value="ATIVO">Ativo</option>
                  <option value="INATIVO">Inativo</option>
                </select>
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
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableTableHeader
                label="Documento"
                field="documento"
                currentSort={sortConfig ? { field: sortConfig.field, order: sortConfig.order } : undefined}
                onSortChange={(field, order) => handleSortChange(field, order)}
              />
              <SortableTableHeader
                label="Razão Social"
                field="razaosocial"
                currentSort={sortConfig ? { field: sortConfig.field, order: sortConfig.order } : undefined}
                onSortChange={(field, order) => handleSortChange(field, order)}
              />
              <SortableTableHeader
                label="Nome Fantasia"
                field="fantasia"
                currentSort={sortConfig ? { field: sortConfig.field, order: sortConfig.order } : undefined}
                onSortChange={(field, order) => handleSortChange(field, order)}
              />
              <SortableTableHeader
                label="Tipo"
                field="tipo"
                currentSort={sortConfig ? { field: sortConfig.field, order: sortConfig.order } : undefined}
                onSortChange={(field, order) => handleSortChange(field, order)}
              />
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
            {(pessoas || []).map((pessoa) => (
              <tr key={pessoa.idPessoas} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDocument(pessoa.documento)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {pessoa.razaosocial}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {pessoa.fantasia || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    pessoa.tipo === 'FORNECEDOR' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {pessoa.tipo}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    pessoa.status === 'ATIVO' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {pessoa.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link
                    to={`/pessoas/${pessoa.idPessoas}`}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Ver Detalhes
                  </Link>
                  <Link
                    to={`/pessoas/${pessoa.idPessoas}/editar`}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(pessoa.idPessoas!)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {(!pessoas || pessoas.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            Nenhuma pessoa encontrada
          </div>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-700">
            Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, total)} de {total} resultados
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => loadPessoas(currentPage - 1, filters)}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="px-3 py-2 text-sm text-gray-700">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => loadPessoas(currentPage + 1, filters)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pessoas;
