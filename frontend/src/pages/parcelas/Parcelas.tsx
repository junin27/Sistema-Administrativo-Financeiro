/**
 * Página dedicada para gestão de parcelas do sistema.
 * Permite visualizar, filtrar, criar e editar parcelas de forma centralizada.
 */

import { useState, useEffect } from 'react';
import {
  Plus,
  Filter,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Edit,
  Trash2,
  Search,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import parcelasService from '../../services/parcelasService';
import { ParcelaForm } from '../../components/parcelas/ParcelaForm';
import type { Parcela, ParcelaCreate, ParcelaUpdate, ParcelaStatus } from '../../types/entities';
import { SortableTableHeader, SortOrder } from '../../components/table/SortableTableHeader';

// Valor especial para filtro invisível (não aparece para o usuário)
const HIDDEN_FILTER_VALUE = '__HIDDEN__';

export function Parcelas() {
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingParcela, setEditingParcela] = useState<Parcela | undefined>();

  // Filtros - inicializa com filtro invisível ativo
  const [filters, setFilters] = useState({
    status: HIDDEN_FILTER_VALUE as any,
    movimentoId: '',
    tipo: '' as '' | 'vencidas' | 'a-vencer',
  });
  const [sortConfig, setSortConfig] = useState<{ field: string; order: SortOrder } | undefined>();

  // Paginação
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  // Carregar parcelas
  const loadParcelas = async () => {
    setLoading(true);
    try {
      let data: Parcela[];
      let totalItems = 0;

      // Aplicar filtros especiais
      if (filters.tipo === 'vencidas') {
        data = await parcelasService.getVencidas();
        totalItems = data.length;
      } else if (filters.tipo === 'a-vencer') {
        data = await parcelasService.getAVencer();
        totalItems = data.length;
      } else {
        // Usa o método list que suporta paginação e filtros no backend
        // Remove filtro invisível - não envia para API
        const statusFilter = filters.status && filters.status !== HIDDEN_FILTER_VALUE 
          ? filters.status 
          : undefined;
        
        const response = await parcelasService.list({
          page,
          per_page: limit,
          status: statusFilter,
          movimento_id: filters.movimentoId ? parseInt(filters.movimentoId) : undefined,
          // Só enviar order_by e order_dir se não for 'default'
          order_by: sortConfig && sortConfig.order !== 'default' ? sortConfig.field : undefined,
          order_dir: sortConfig && sortConfig.order !== 'default' ? (sortConfig.order === 'asc' ? 'asc' : 'desc') : undefined
        });
        data = response.items;
        totalItems = response.total; // Nota: pode não ser o total real devido a limitações do backend
      }

      setParcelas(data);
      setTotal(totalItems);
    } catch {
      toast.error('Erro ao carregar parcelas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Verifica se há filtro invisível ativo E não há outros filtros
    const hasHiddenFilter = filters.status === HIDDEN_FILTER_VALUE;
    const hasOtherFilters = !!(filters.tipo || filters.movimentoId);
    
    // Só bloqueia se o filtro estiver invisível E não houver outros filtros
    if (hasHiddenFilter && !hasOtherFilters) {
      setParcelas([]);
      setTotal(0);
      setPage(1);
      return;
    }
    
    // Carrega parcelas se houver algum filtro ativo
    loadParcelas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters.tipo, filters.movimentoId, filters.status, sortConfig]);

  // Aplicar filtros
  const applyFilters = () => {
    setPage(1);
    loadParcelas();
  };

  // Limpar filtros
  const clearFilters = () => {
    // Volta para o estado inicial com filtro invisível ativo
    setFilters({
      status: HIDDEN_FILTER_VALUE as any,
      movimentoId: '',
      tipo: '',
    });
    setPage(1);
    setSortConfig(undefined);
  };

  const handleSortChange = (field: string, order: SortOrder) => {
    // Sempre manter o sortConfig para que o ícone correto seja exibido
    // Quando order é 'default', ainda passamos para o backend como undefined
    if (order === 'default') {
      setSortConfig({ field, order: 'default' });
    } else {
      setSortConfig({ field, order });
    }
  };

  // Criar parcela
  const handleCreate = async (data: ParcelaCreate) => {
    await parcelasService.create(data);
    setShowForm(false);
    loadParcelas();
  };

  // Editar parcela
  const handleEdit = (parcela: Parcela) => {
    setEditingParcela(parcela);
    setShowForm(true);
  };

  const handleUpdate = async (data: ParcelaUpdate) => {
    if (!editingParcela) return;
    await parcelasService.update(editingParcela.idParcelasContas, data);
    setShowForm(false);
    setEditingParcela(undefined);
    loadParcelas();
  };

  // Marcar como paga
  const handleMarcarPaga = async (parcela: Parcela) => {
    try {
      await parcelasService.marcarComoPaga(parcela.idParcelasContas);
      toast.success('Parcela marcada como paga!');
      loadParcelas();
    } catch {
      toast.error('Erro ao marcar como paga');
    }
  };

  // Excluir parcela
  const handleDelete = async (parcela: Parcela) => {
    if (!window.confirm(`Tem certeza que deseja excluir a parcela ${parcela.identificacao}?`)) {
      return;
    }

    try {
      await parcelasService.delete(parcela.idParcelasContas);
      toast.success('Parcela excluída com sucesso!');
      loadParcelas();
    } catch {
      toast.error('Erro ao excluir parcela');
    }
  };

  // Cancelar formulário
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingParcela(undefined);
  };

  // Verificar se está vencida
  const isVencida = (parcela: Parcela): boolean => {
    if (parcela.status === 'PAGA' || parcela.status === 'CANCELADA') return false;
    const hoje = new Date().toISOString().split('T')[0];
    return parcela.datavencimento < hoje;
  };

  // Badge de status
  const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
      PENDENTE: 'bg-yellow-100 text-yellow-800',
      PAGA: 'bg-green-100 text-green-800',
      VENCIDA: 'bg-red-100 text-red-800',
      CANCELADA: 'bg-gray-100 text-gray-800',
    };

    const icons = {
      PENDENTE: <Clock className="h-4 w-4" />,
      PAGA: <CheckCircle className="h-4 w-4" />,
      VENCIDA: <AlertCircle className="h-4 w-4" />,
      CANCELADA: <XCircle className="h-4 w-4" />,
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {status}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Calendar className="h-8 w-8 mr-3 text-blue-600" />
            Gestão de Parcelas
          </h1>
          <p className="text-gray-600 mt-1">Total: {total} parcela(s)</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Parcela
        </button>
      </div>

      {/* Formulário Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <ParcelaForm
              parcela={editingParcela}
              onSubmit={handleCreate}
              onUpdate={handleUpdate}
              onCancel={handleCancelForm}
              isEdit={!!editingParcela}
            />
          </div>
        </div>
      )}

      {/* Filtros Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => setFilters({ ...filters, tipo: '' })}
          className={`p-4 rounded-lg border-2 transition ${
            filters.tipo === ''
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">Todas</span>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
        </button>

        <button
          onClick={() => setFilters({ ...filters, tipo: 'vencidas' })}
          className={`p-4 rounded-lg border-2 transition ${
            filters.tipo === 'vencidas'
              ? 'border-red-500 bg-red-50'
              : 'border-gray-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">Vencidas</span>
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
        </button>

        <button
          onClick={() => setFilters({ ...filters, tipo: 'a-vencer' })}
          className={`p-4 rounded-lg border-2 transition ${
            filters.tipo === 'a-vencer'
              ? 'border-yellow-500 bg-yellow-50'
              : 'border-gray-200 hover:border-yellow-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">A Vencer</span>
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
        </button>

        <div className="p-4 rounded-lg border-2 border-gray-200">
          <div className="flex items-center justify-between">
            <span className="font-medium">Filtros</span>
            <Filter className="h-5 w-5 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Filtros Avançados */}
      {showFilters && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={
                  filters.status === HIDDEN_FILTER_VALUE 
                    ? '__empty' 
                    : (filters.status === undefined || filters.status === '' ? '' : filters.status)
                }
                onChange={(e) => {
                  const val = e.target.value;
                  const newFilters = { ...filters };
                  if (val === '__empty') {
                    newFilters.status = HIDDEN_FILTER_VALUE as any;
                  } else if (val === '') {
                    delete newFilters.status;
                  } else {
                    newFilters.status = val as ParcelaStatus;
                  }
                  setFilters(newFilters);
                }}
                className="input-field"
              >
                <option value="__empty" disabled hidden></option>
                <option value="">Todos</option>
                <option value="PENDENTE">Pendente</option>
                <option value="PAGA">Paga</option>
                <option value="VENCIDA">Vencida</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ID Movimento</label>
              <input
                type="number"
                value={filters.movimentoId}
                onChange={(e) => {
                  const newFilters = { ...filters };
                  if (e.target.value.trim()) {
                    newFilters.movimentoId = e.target.value;
                    // Remove filtro invisível quando há texto
                    if (newFilters.status === HIDDEN_FILTER_VALUE) {
                      delete newFilters.status;
                    }
                  } else {
                    newFilters.movimentoId = '';
                  }
                  setFilters(newFilters);
                }}
                className="input-field"
                placeholder="Filtrar por movimento"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-4">
            <button onClick={clearFilters} className="btn-outline">
              <X className="h-4 w-4 mr-2" />
              Limpar
            </button>
            <button onClick={applyFilters} className="btn-primary">
              <Search className="h-4 w-4 mr-2" />
              Aplicar
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Tabela de Parcelas */}
      {!loading && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <SortableTableHeader
                  label="ID"
                  field="idParcelasContas"
                  currentSort={sortConfig ? { field: sortConfig.field, order: sortConfig.order } : undefined}
                  onSortChange={(field, order) => handleSortChange(field, order)}
                />
                <SortableTableHeader
                  label="Identificação"
                  field="identificacao"
                  currentSort={sortConfig ? { field: sortConfig.field, order: sortConfig.order } : undefined}
                  onSortChange={(field, order) => handleSortChange(field, order)}
                />
                <SortableTableHeader
                  label="Parcela"
                  field="numero_parcela"
                  currentSort={sortConfig ? { field: sortConfig.field, order: sortConfig.order } : undefined}
                  onSortChange={(field, order) => handleSortChange(field, order)}
                />
                <SortableTableHeader
                  label="Valor"
                  field="valorparcela"
                  currentSort={sortConfig ? { field: sortConfig.field, order: sortConfig.order } : undefined}
                  onSortChange={(field, order) => handleSortChange(field, order)}
                />
                <SortableTableHeader
                  label="Vencimento"
                  field="datavencimento"
                  currentSort={sortConfig ? { field: sortConfig.field, order: sortConfig.order } : undefined}
                  onSortChange={(field, order) => handleSortChange(field, order)}
                />
                <SortableTableHeader
                  label="Status"
                  field="statusparcela"
                  currentSort={sortConfig ? { field: sortConfig.field, order: sortConfig.order } : undefined}
                  onSortChange={(field, order) => handleSortChange(field, order)}
                />
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {parcelas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 bg-white">
                    Nenhuma parcela encontrada
                  </td>
                </tr>
              ) : (
                parcelas.map((parcela, index) => {
                  const vencida = isVencida(parcela);
                  const rowClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
                  return (
                    <tr
                      key={parcela.idParcelasContas}
                      className={`${rowClass} ${vencida ? 'border-l-4 border-red-500' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        #{parcela.idParcelasContas}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex flex-col">
                          <span className="font-medium">{parcela.identificacao}</span>
                          <span className="text-xs text-gray-500">
                            Movimento: #{parcela.MovimentoContas_idMovimentoContas}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {parcela.numero_parcela}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {parcela.valorparcela.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(parcela.datavencimento).toLocaleDateString('pt-BR')}
                        {parcela.datapagamento && (
                          <div className="text-xs text-green-600">
                            Pago: {new Date(parcela.datapagamento).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={parcela.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          {parcela.status === 'PENDENTE' && (
                            <button
                              onClick={() => handleMarcarPaga(parcela)}
                              className="text-green-600 hover:text-green-900"
                              title="Marcar como Paga"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(parcela)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(parcela)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {total > limit && (
        <div className="flex justify-center mt-6 gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-outline disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="py-2 px-4">
            Página {page} de {Math.ceil(total / limit)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / limit)}
            className="btn-outline disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
