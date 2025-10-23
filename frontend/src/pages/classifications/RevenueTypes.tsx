/**
 * Página de listagem de tipos de receita.
 * Exibe tabela com tipos de receita, filtros e ações.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  RotateCcw,
  Receipt
} from 'lucide-react';
import toast from 'react-hot-toast';

import { revenueTypeService } from '../../services/revenueTypeService';
import type { RevenueType, RevenueTypeFilter } from '../../types/entities';

interface RevenueTypesTableProps {
  revenueTypes: RevenueType[];
  onEdit: (revenueType: RevenueType) => void;
  onDelete: (revenueType: RevenueType) => void;
  onReactivate: (revenueType: RevenueType) => void;
}

function RevenueTypesTable({ revenueTypes, onEdit, onDelete, onReactivate }: RevenueTypesTableProps) {
  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="table">
        <thead>
          <tr>
            <th>Descrição</th>
            <th>Observações</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {revenueTypes.map((revenueType) => (
            <tr key={revenueType.id}>
              <td className="font-medium">{revenueType.description}</td>
              <td className="max-w-xs truncate">
                {revenueType.notes ? (
                  <span title={revenueType.notes}>{revenueType.notes}</span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td>
                <span className={`badge ${revenueType.active ? 'badge-success' : 'badge-error'}`}>
                  {revenueType.active ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onEdit(revenueType)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  {revenueType.active ? (
                    <button
                      onClick={() => onDelete(revenueType)}
                      className="text-red-600 hover:text-red-900"
                      title="Inativar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onReactivate(revenueType)}
                      className="text-green-600 hover:text-green-900"
                      title="Reativar"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RevenueTypes() {
  const [filters, setFilters] = useState<RevenueTypeFilter>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Query para buscar tipos de receita
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery(
    ['revenueTypes', filters], 
    () => revenueTypeService.list(filters),
    {
      keepPreviousData: true,
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, description: searchTerm });
  };

  const handleEdit = (revenueType: RevenueType) => {
    // Navegar para página de edição
    window.location.href = `/tipos-receita/${revenueType.id}/editar`;
  };

  const handleDelete = async (revenueType: RevenueType) => {
    if (window.confirm(`Tem certeza que deseja inativar o tipo de receita "${revenueType.description}"?`)) {
      try {
        await revenueTypeService.delete(revenueType.id);
        toast.success('Tipo de receita inativado com sucesso!');
        refetch();
      } catch (error) {
        console.error('Erro ao inativar tipo de receita:', error);
        toast.error('Erro ao inativar tipo de receita');
      }
    }
  };

  const handleReactivate = async (revenueType: RevenueType) => {
    try {
      await revenueTypeService.reactivate(revenueType.id);
      toast.success('Tipo de receita reativado com sucesso!');
      refetch();
    } catch (error) {
      console.error('Erro ao reativar tipo de receita:', error);
      toast.error('Erro ao reativar tipo de receita');
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          Erro ao carregar tipos de receita
        </div>
        <button
          onClick={() => refetch()}
          className="btn-primary"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Receipt className="h-8 w-8 mr-3 text-green-600" />
            Tipos de Receita
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie as categorias de receitas do seu negócio
          </p>
        </div>
        <Link to="/tipos-receita/novo" className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Novo Tipo
        </Link>
      </div>

      {/* Filtros e Busca */}
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn-primary"
            >
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="btn-outline"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </button>
          </form>

          {/* Filtros Avançados */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.include_inactive ? 'all' : 'active'}
                    onChange={(e) => setFilters({
                      ...filters,
                      include_inactive: e.target.value === 'all'
                    })}
                    className="input-field"
                  >
                    <option value="active">Apenas Ativos</option>
                    <option value="all">Todos</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="btn-outline"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="card">
        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando tipos de receita...</p>
            </div>
          ) : data && data.length > 0 ? (
            <RevenueTypesTable
              revenueTypes={data}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReactivate={handleReactivate}
            />
          ) : (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum tipo de receita encontrado
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || Object.keys(filters).length > 0
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando seu primeiro tipo de receita'
                }
              </p>
              {!searchTerm && Object.keys(filters).length === 0 && (
                <Link to="/tipos-receita/novo" className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Tipo
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
