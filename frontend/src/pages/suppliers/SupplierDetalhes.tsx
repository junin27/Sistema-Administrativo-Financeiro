/**
 * Página de detalhes do fornecedor.
 * Exibe informações completas do fornecedor e histórico de movimentos.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  ArrowLeft, 
  Building2, 
  Edit, 
  Trash2, 
  RotateCcw,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
  Eye,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

import { supplierService } from '../../services/supplierService';
import { movimentosService } from '../../services/movimentosService';
import type { Supplier } from '../../types/entities';
import type { MovimentoConta } from '../../services/movimentosService';

interface ResumoFinanceiro {
  totalMovimentos: number;
  totalDespesas: number;
  valorMedio: number;
  ultimoMovimento?: string;
}

export default function SupplierDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movimentos, setMovimentos] = useState<MovimentoConta[]>([]);
  const [loadingMovimentos, setLoadingMovimentos] = useState(false);
  const [resumo, setResumo] = useState<ResumoFinanceiro>({
    totalMovimentos: 0,
    totalDespesas: 0,
    valorMedio: 0
  });

  // Query para buscar dados do fornecedor
  const { 
    data: supplier, 
    isLoading, 
    error,
    refetch 
  } = useQuery(
    ['supplier', id],
    () => supplierService.getById(id!),
    {
      enabled: Boolean(id),
      onError: (error: any) => {
        console.error('Erro ao carregar fornecedor:', error);
        toast.error('Erro ao carregar dados do fornecedor');
      }
    }
  );

  // Carregar movimentos do fornecedor
  const loadMovimentos = async (supplierId: string) => {
    try {
      setLoadingMovimentos(true);
      
      // Buscar movimentos onde o fornecedor está envolvido
      const response = await movimentosService.getAll({
        page: 1,
        size: 100,
        filters: { fornecedor_cliente_id: parseInt(supplierId) }
      });

      const movimentosData = response.items || [];
      
      // Ordenar por data de emissão (mais recente primeiro)
      movimentosData.sort((a, b) => 
        new Date(b.data_emissao).getTime() - new Date(a.data_emissao).getTime()
      );

      setMovimentos(movimentosData);

      // Calcular resumo financeiro
      const totalDespesas = movimentosData
        .filter(m => m.tipo === 'despesa')
        .reduce((sum, m) => sum + (m.valor || 0), 0);

      const valorMedio = movimentosData.length > 0 
        ? totalDespesas / movimentosData.length 
        : 0;

      const ultimoMovimento = movimentosData.length > 0 
        ? movimentosData[0].data_emissao 
        : undefined;

      setResumo({
        totalMovimentos: movimentosData.length,
        totalDespesas,
        valorMedio,
        ultimoMovimento
      });

    } catch (err: any) {
      console.error('Erro ao carregar movimentos:', err);
      toast.error('Erro ao carregar histórico de movimentos');
    } finally {
      setLoadingMovimentos(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadMovimentos(id);
    }
  }, [id]);

  const handleEdit = () => {
    navigate(`/fornecedores/${id}/editar`);
  };

  const handleDelete = async () => {
    if (!supplier) return;
    
    if (window.confirm(`Tem certeza que deseja inativar o fornecedor ${supplier.company_name}?`)) {
      try {
        await supplierService.remove(supplier.id);
        toast.success('Fornecedor inativado com sucesso!');
        navigate('/fornecedores');
      } catch (error) {
        console.error('Erro ao inativar fornecedor:', error);
        toast.error('Erro ao inativar fornecedor');
      }
    }
  };

  const handleReactivate = async () => {
    if (!supplier) return;
    
    try {
      await supplierService.reactivate(supplier.id);
      toast.success('Fornecedor reativado com sucesso!');
      refetch();
    } catch (error) {
      console.error('Erro ao reativar fornecedor:', error);
      toast.error('Erro ao reativar fornecedor');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Erro ao carregar fornecedor
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Não foi possível carregar os dados do fornecedor.
        </p>
        <div className="mt-6">
          <button onClick={() => navigate('/fornecedores')} className="btn-primary">
            Voltar para Fornecedores
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/fornecedores')}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Building2 className="h-8 w-8 mr-3 text-blue-600" />
              {supplier.company_name}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Detalhes do fornecedor e histórico de movimentos
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleEdit}
            className="btn-outline"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </button>
          {supplier.active ? (
            <button
              onClick={handleDelete}
              className="btn-outline text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Inativar
            </button>
          ) : (
            <button
              onClick={handleReactivate}
              className="btn-outline text-green-600 border-green-300 hover:bg-green-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reativar
            </button>
          )}
        </div>
      </div>

      {/* Informações do Fornecedor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dados Cadastrais */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium">Dados Cadastrais</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Razão Social
                  </label>
                  <p className="text-gray-900 font-medium">{supplier.company_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Fantasia
                  </label>
                  <p className="text-gray-900">{supplier.trade_name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CNPJ
                  </label>
                  <p className="text-gray-900 font-mono">{supplier.tax_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <span className={`badge ${supplier.active ? 'badge-success' : 'badge-error'}`}>
                    {supplier.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Criado em
                  </label>
                  <p className="text-gray-900">{formatDate(supplier.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Atualizado em
                  </label>
                  <p className="text-gray-900">{formatDate(supplier.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium">Resumo Financeiro</h3>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-sm text-gray-600">Total de Movimentos</span>
                </div>
                <span className="font-semibold">{resumo.totalMovimentos}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingDown className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-sm text-gray-600">Total Despesas</span>
                </div>
                <span className="font-semibold text-red-600">
                  {formatCurrency(resumo.totalDespesas)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm text-gray-600">Valor Médio</span>
                </div>
                <span className="font-semibold">
                  {formatCurrency(resumo.valorMedio)}
                </span>
              </div>
              {resumo.ultimoMovimento && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-600">Último Movimento</span>
                  </div>
                  <span className="font-semibold">
                    {formatDate(resumo.ultimoMovimento)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Histórico de Movimentos */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium">Histórico de Movimentos</h3>
        </div>
        <div className="card-body">
          {loadingMovimentos ? (
            <div className="flex items-center justify-center h-32">
              <div className="loading-spinner"></div>
            </div>
          ) : movimentos.length > 0 ? (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nota Fiscal</th>
                    <th>Tipo</th>
                    <th>Valor</th>
                    <th>Data Emissão</th>
                    <th>Data Vencimento</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {movimentos.map((movimento) => (
                    <tr key={movimento.id}>
                      <td className="font-mono text-sm">
                        {movimento.numero_nota_fiscal || '-'}
                      </td>
                      <td>
                        <span className={`badge ${
                          movimento.tipo === 'receita' 
                            ? 'badge-success' 
                            : 'badge-error'
                        }`}>
                          {movimento.tipo === 'receita' ? 'Receita' : 'Despesa'}
                        </span>
                      </td>
                      <td className={`font-semibold ${
                        movimento.tipo === 'receita' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {formatCurrency(movimento.valor || 0)}
                      </td>
                      <td>{formatDate(movimento.data_emissao)}</td>
                      <td>{formatDate(movimento.data_vencimento)}</td>
                      <td>
                        <span className={`badge ${
                          movimento.status === 'pago' 
                            ? 'badge-success' 
                            : movimento.status === 'cancelado'
                            ? 'badge-error'
                            : 'badge-warning'
                        }`}>
                          {movimento.status === 'pago' ? 'Pago' : 
                           movimento.status === 'cancelado' ? 'Cancelado' : 'Pendente'}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/movimentos/${movimento.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Nenhum movimento encontrado
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Este fornecedor ainda não possui movimentos registrados.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}