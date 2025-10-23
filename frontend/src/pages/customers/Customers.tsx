/**
 * Página de listagem de clientes.
 * Exibe tabela com clientes, filtros e ações.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  RotateCcw,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

import { customerService } from '../../services/customerService';
import type { Customer, CustomerFilter } from '../../types/entities';

interface CustomersTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onReactivate: (customer: Customer) => void;
}

function CustomersTable({ customers, onEdit, onDelete, onReactivate }: CustomersTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nome Completo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              CPF
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {customers.map((customer) => (
            <tr key={customer.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {customer.full_name}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {customer.document_id}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  customer.active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {customer.active ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => onEdit(customer)}
                    className="text-indigo-600 hover:text-indigo-900"
                    title="Editar cliente"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  {customer.active ? (
                    <button
                      onClick={() => onDelete(customer)}
                      className="text-red-600 hover:text-red-900"
                      title="Inativar cliente"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onReactivate(customer)}
                      className="text-green-600 hover:text-green-900"
                      title="Reativar cliente"
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

export function Customers() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<CustomerFilter>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Query para buscar clientes
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery(
    ['customers', filters], 
    () => customerService.list(filters),
    {
      keepPreviousData: true,
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, full_name: searchTerm });
  };

  const handleEdit = (customer: Customer) => {
    // Navegar para página de edição usando navigate
    navigate(`/clientes/${customer.id}/editar`);
  };

  const handleDelete = async (customer: Customer) => {
    if (window.confirm(`Tem certeza que deseja inativar o cliente ${customer.full_name}?`)) {
      try {
        await customerService.remove(customer.id);
        toast.success('Cliente inativado com sucesso!');
        refetch();
      } catch (error) {
        console.error('Erro ao inativar cliente:', error);
        toast.error('Erro ao inativar cliente');
      }
    }
  };

  const handleReactivate = async (customer: Customer) => {
    try {
      await customerService.reactivate(customer.id);
      toast.success('Cliente reativado com sucesso!');
      refetch();
    } catch (error) {
      console.error('Erro ao reativar cliente:', error);
      toast.error('Erro ao reativar cliente');
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
          Erro ao carregar clientes
        </div>
        <button 
          onClick={() => refetch()}
          className="btn-primary"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const customers = data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="h-8 w-8 mr-3 text-green-600" />
            Clientes
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie seus clientes e consumidores
          </p>
        </div>
        <Link to="/clientes/novo" className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Link>
      </div>

      {/* Filtros e Busca */}
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSearch} className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 input-field"
                />
              </div>
            </div>
            <button type="submit" className="btn-primary">
              Buscar
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </button>
            {(filters.full_name || filters.document_id) && (
              <button
                type="button"
                onClick={clearFilters}
                className="btn-secondary"
              >
                Limpar
              </button>
            )}
          </form>

          {/* Filtros Avançados */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={filters.full_name || ''}
                    onChange={(e) => setFilters({ ...filters, full_name: e.target.value })}
                    className="input-field"
                    placeholder="Filtrar por nome..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={filters.document_id || ''}
                    onChange={(e) => setFilters({ ...filters, document_id: e.target.value })}
                    className="input-field"
                    placeholder="Filtrar por CPF..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Clientes */}
      <div className="card">
        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Carregando clientes...</p>
            </div>
          ) : customers.length > 0 ? (
            <CustomersTable
              customers={customers}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReactivate={handleReactivate}
            />
          ) : (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Nenhum cliente encontrado
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Comece criando um novo cliente.
              </p>
              <div className="mt-6">
                <Link to="/clientes/novo" className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Cliente
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
