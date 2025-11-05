/**
 * Service para gerenciar Parcelas via API.
 */
import { api } from './api';
import { Parcela, ParcelaCreate, ParcelaUpdate, ParcelaStatus } from '../types/entities';

const BASE_URL = '/parcelas';

// Interfaces adicionais
export interface ParcelaFilter {
  movimento_id?: number;
  status?: ParcelaStatus;
  data_vencimento_inicio?: string;
  data_vencimento_fim?: string;
  include_deleted?: boolean;
  page?: number;
  per_page?: number;
}

export interface PaginationResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

const parcelasService = {
  /**
   * Lista todas as parcelas com filtros e paginação
   */
  async list(filters?: ParcelaFilter): Promise<PaginationResponse<Parcela>> {
    const params = new URLSearchParams();
    
    if (filters?.movimento_id) params.append('movimento_id', filters.movimento_id.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.data_vencimento_inicio) params.append('data_vencimento_inicio', filters.data_vencimento_inicio);
    if (filters?.data_vencimento_fim) params.append('data_vencimento_fim', filters.data_vencimento_fim);
    if (filters?.include_deleted !== undefined) params.append('include_deleted', filters.include_deleted.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.per_page) params.append('per_page', filters.per_page.toString());

    const response = await api.get<PaginationResponse<Parcela>>(`${BASE_URL}?${params.toString()}`);
    return response.data;
  },

  /**
   * Lista todas as parcelas (paginado) - backward compatibility
   */
  async getAll(skip: number = 0, limit: number = 100): Promise<Parcela[]> {
    const response = await api.get<Parcela[]>(BASE_URL, {
      params: { skip, limit }
    });
    return response.data;
  },

  /**
   * Lista parcelas de um movimento específico
   */
  async getByMovimento(movimentoId: number): Promise<Parcela[]> {
    const response = await api.get<Parcela[]>(`${BASE_URL}/movimento/${movimentoId}`);
    return response.data;
  },

  /**
   * Lista parcelas vencidas
   */
  async getVencidas(): Promise<Parcela[]> {
    const response = await api.get<Parcela[]>(`${BASE_URL}/vencidas`);
    return response.data;
  },

  /**
   * Lista parcelas a vencer
   */
  async getAVencer(): Promise<Parcela[]> {
    const response = await api.get<Parcela[]>(`${BASE_URL}/a-vencer`);
    return response.data;
  },

  /**
   * Busca parcela por ID
   */
  async getById(id: number): Promise<Parcela> {
    const response = await api.get<Parcela>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Cria nova parcela
   */
  async create(data: ParcelaCreate): Promise<Parcela> {
    const response = await api.post<Parcela>(BASE_URL, data);
    return response.data;
  },

  /**
   * Atualiza parcela
   */
  async update(id: number, data: ParcelaUpdate): Promise<Parcela> {
    const response = await api.put<Parcela>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Atualiza apenas o status da parcela
   */
  async updateStatus(id: number, status: ParcelaStatus): Promise<Parcela> {
    const response = await api.patch<Parcela>(`${BASE_URL}/${id}/status`, { status });
    return response.data;
  },

  /**
   * Marca parcela como paga
   */
  async marcarComoPaga(id: number, dataPagamento?: string): Promise<Parcela> {
    const data = dataPagamento || new Date().toISOString().split('T')[0];
    const response = await api.patch<Parcela>(`${BASE_URL}/${id}/status`, {
      status: 'PAGA',
      datapagamento: data
    });
    return response.data;
  },

  /**
   * Remove parcela
   */
  async delete(id: number): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },

  /**
   * Reativar parcela deletada
   */
  async reativar(id: number): Promise<Parcela> {
    const response = await api.patch<Parcela>(`${BASE_URL}/${id}/reativar`);
    return response.data;
  },

  /**
   * Cancelar parcela
   */
  async cancelar(id: number): Promise<Parcela> {
    const response = await api.patch<Parcela>(`${BASE_URL}/${id}/status`, {
      status: 'CANCELADA'
    });
    return response.data;
  },

  /**
   * Gerar parcelas automaticamente para um movimento
   */
  async gerarParcelas(movimentoId: number, numeroParcelas: number): Promise<Parcela[]> {
    const response = await api.post<Parcela[]>(`/movimentos/${movimentoId}/gerar-parcelas`, {
      numero_parcelas: numeroParcelas
    });
    return response.data;
  },

  /**
   * Estatísticas de parcelas
   */
  async getEstatisticas(filters?: ParcelaFilter): Promise<{
    total: number;
    pendentes: number;
    pagas: number;
    vencidas: number;
    canceladas: number;
    valor_total: number;
    valor_pago: number;
    valor_pendente: number;
  }> {
    const params = new URLSearchParams();
    
    if (filters?.movimento_id) params.append('movimento_id', filters.movimento_id.toString());
    if (filters?.data_vencimento_inicio) params.append('data_vencimento_inicio', filters.data_vencimento_inicio);
    if (filters?.data_vencimento_fim) params.append('data_vencimento_fim', filters.data_vencimento_fim);

    const response = await api.get(`${BASE_URL}/estatisticas?${params.toString()}`);
    return response.data;
  }
};

export default parcelasService;
