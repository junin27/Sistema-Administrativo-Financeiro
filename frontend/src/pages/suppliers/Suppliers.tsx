/**
 * Página de listagem de fornecedores.
 * Exibe tabela com fornecedores, filtros e ações.
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
  Building2
} from 'lucide-react';
import toast from 'react-hot-toast';

import { supplierService } from '../../services/supplierService';
import type { Supplier, SupplierFilter } from '../../types/entities';

interface SuppliersTableProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
  onReactivate: (supplier: Supplier) => void;
}

function SuppliersTable({ suppliers, onEdit, onDelete, onReactivate }: SuppliersTableProps) {
  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="table">
        <thead>
          <tr>
            <th>Razão Social</th>
            <th>Nome Fantasia</th>
            <th>CNPJ</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {suppliers.map((supplier) => (
            <tr key={supplier.id}>
              <td className="font-medium">{supplier.company_name}</td>
              <td>{supplier.trade_name || '-'}</td>
              <td className="font-mono">{supplier.tax_id}</td>
              <td>
                <span className={`badge ${supplier.active ? 'badge-success' : 'badge-error'}`}>
                  {supplier.active ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onEdit(supplier)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  {supplier.active ? (
                    <button
                      onClick={() => onDelete(supplier)}
                      className="text-red-600 hover:text-red-900"
                      title="Inativar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onReactivate(supplier)}
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

export function Suppliers() {
  const [filters, setFilters] = useState<SupplierFilter>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Query para buscar fornecedores
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery(
    ['suppliers', filters], 
    () => supplierService.list(filters),
    {
      keepPreviousData: true,
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchTerm });
  };

  const handleEdit = (supplier: Supplier) => {
    // Navegar para página de edição
    window.location.href = `/fornecedores/${supplier.id}/editar`;
  };

  const handleDelete = async (supplier: Supplier) => {
    if (window.confirm(`Tem certeza que deseja inativar o fornecedor ${supplier.company_name}?`)) {
      try {
        await supplierService.remove(supplier.id);
        toast.success('Fornecedor inativado com sucesso!');
        refetch();
      } catch (error) {
        console.error('Erro ao inativar fornecedor:', error);
      }
    }
  };

  const handleReactivate = async (supplier: Supplier) => {
    try {
      await supplierService.reactivate(supplier.id);
      toast.success('Fornecedor reativado com sucesso!');
      refetch();
    } catch (error) {
      console.error('Erro ao reativar fornecedor:', error);
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
          Erro ao carregar fornecedores
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
            <Building2 className="h-8 w-8 mr-3 text-blue-600" />
            Fornecedores
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie seus fornecedores e empresas parceiras
          </p>
        </div>
        <Link to="/fornecedores/novo" className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Novo Fornecedor
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
                  placeholder="Buscar por razão social, nome fantasia ou CNPJ..."
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
                    value={filters.active === undefined ? '' : filters.active.toString()}
                    onChange={(e) => setFilters({
                      ...filters,
                      active: e.target.value === '' ? undefined : e.target.value === 'true'
                    })}
                    className="input-field"
                  >
                    <option value="">Todos</option>
                    <option value="true">Ativos</option>
                    <option value="false">Inativos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Razão Social
                  </label>
                  <input
                    type="text"
                    value={filters.company_name || ''}
                    onChange={(e) => setFilters({ ...filters, company_name: e.target.value })}
                    className="input-field"
                    placeholder="Filtrar por razão social"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={filters.tax_id || ''}
                    onChange={(e) => setFilters({ ...filters, tax_id: e.target.value })}
                    className="input-field"
                    placeholder="Filtrar por CNPJ"
                  />
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
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner"></div>
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="space-y-4">
          <SuppliersTable
            suppliers={data.items}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReactivate={handleReactivate}
          />
          
          {/* Paginação */}
          {data.pages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {data.items.length} de {data.total} fornecedores
              </div>
              <div className="flex space-x-2">
                {/* Aqui implementar componente de paginação */}
                <span className="text-sm text-gray-500">
                  Página {data.page} de {data.pages}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Nenhum fornecedor encontrado
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Comece criando seu primeiro fornecedor.
          </p>
          <div className="mt-6">
            <Link to="/fornecedores/novo" className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Novo Fornecedor
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
