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

export interface GerarParcelasOptions {
  primeiro_vencimento?: string;
  intervalo_meses?: number;
}

interface ParcelaBackendResponse {
  idParcelasContas: number;
  MovimentoContas_idMovimentoContas: number;
  identificacao: string;
  numero_parcela: number;
  valorparcela: number;
  valorpago: number;
  valorsaldo: number;
  datavencimento: string;
  datapagamento?: string;
  status?: ParcelaStatus;
  statusparcela?: ParcelaStatus;
  deleted_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ParcelasEstatisticas {
  total: number;
  pendentes: number;
  pagas: number;
  vencidas: number;
  canceladas: number;
  valor_total: number;
  valor_pago: number;
  valor_pendente: number;
}

const parcelasService = {
  /**
   * Normaliza o objeto vindo do backend para o tipo Parcela do frontend
   */
  normalizeParcela(payload: ParcelaBackendResponse): Parcela {
    return {
      idParcelasContas: payload.idParcelasContas,
      MovimentoContas_idMovimentoContas: payload.MovimentoContas_idMovimentoContas,
      identificacao: payload.identificacao,
      numero_parcela: payload.numero_parcela,
      valorparcela: payload.valorparcela,
      valorpago: payload.valorpago,
      valorsaldo: payload.valorsaldo,
      datavencimento: payload.datavencimento,
      datapagamento: payload.datapagamento,
      status: payload.status ?? payload.statusparcela,
      deleted_at: payload.deleted_at,
      created_at: payload.created_at,
      updated_at: payload.updated_at,
    } as Parcela;
  },
  /**
   * Lista todas as parcelas com filtros e paginação
   */
  async list(filters?: ParcelaFilter): Promise<PaginationResponse<Parcela>> {
    const params = new URLSearchParams();
    
    // Converte page/per_page para skip/limit
    const page = filters?.page || 1;
    const perPage = filters?.per_page || 50;
    const skip = (page - 1) * perPage;
    
    params.append('skip', skip.toString());
    params.append('limit', perPage.toString());

    if (filters?.movimento_id) params.append('movimento_id', filters.movimento_id.toString());
    if (filters?.status) params.append('status', filters.status);
    // Backend não suporta filtros de data ainda na listagem principal
    // if (filters?.data_vencimento_inicio) params.append('data_vencimento_inicio', filters.data_vencimento_inicio);
    // if (filters?.data_vencimento_fim) params.append('data_vencimento_fim', filters.data_vencimento_fim);
    if (filters?.include_deleted !== undefined) params.append('include_deleted', filters.include_deleted.toString());

    const path = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
    const response = await api.get(`${path}?${params.toString()}`);
    
    // O backend retorna List[ParcelasContasResponse], não PaginationResponse
    // Precisamos adaptar a resposta para o formato esperado pelo frontend ou ajustar o frontend
    const data = response.data as ParcelaBackendResponse[];
    
    // Simular resposta paginada já que o backend retorna array direto
    return {
      items: data.map((p) => this.normalizeParcela(p)),
      total: data.length, // Nota: Backend não retorna total real, isso limita a paginação no frontend
      page: page,
      per_page: perPage,
      pages: 1 // Backend não retorna total de páginas
    };
  },

  /**
   * Lista todas as parcelas (paginado) - backward compatibility
   */
  async getAll(skip: number = 0, limit: number = 100): Promise<Parcela[]> {
    const path = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
    const response = await api.get(`${path}?skip=${skip}&limit=${limit}`);
    return (response.data as ParcelaBackendResponse[]).map((p) => this.normalizeParcela(p));
  },

  /**
   * Lista parcelas de um movimento específico
   */
  async getByMovimento(movimentoId: number): Promise<Parcela[]> {
    const response = await api.get(`${BASE_URL}/movimento/${movimentoId}`);
    return (response.data as ParcelaBackendResponse[]).map((p) => this.normalizeParcela(p));
  },

  /**
   * Lista parcelas vencidas
   */
  async getVencidas(): Promise<Parcela[]> {
    const response = await api.get(`${BASE_URL}/vencidas`);
    return (response.data as ParcelaBackendResponse[]).map((p) => this.normalizeParcela(p));
  },

  /**
   * Lista parcelas a vencer
   */
  async getAVencer(): Promise<Parcela[]> {
    const response = await api.get(`${BASE_URL}/a-vencer`);
    return (response.data as ParcelaBackendResponse[]).map((p) => this.normalizeParcela(p));
  },

  /**
   * Busca parcela por ID
   */
  async getById(id: number): Promise<Parcela> {
    const response = await api.get(`${BASE_URL}/${id}`);
    return this.normalizeParcela(response.data as ParcelaBackendResponse);
  },

  /**
   * Cria nova parcela
   */
  async create(data: ParcelaCreate): Promise<Parcela> {
    const response = await api.post(BASE_URL, data);
    return this.normalizeParcela(response.data as ParcelaBackendResponse);
  },

  /**
   * Atualiza parcela
   */
  async update(id: number, data: ParcelaUpdate): Promise<Parcela> {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return this.normalizeParcela(response.data as ParcelaBackendResponse);
  },

  /**
   * Atualiza apenas o status da parcela
   */
  async updateStatus(id: number, status: ParcelaStatus): Promise<Parcela> {
    const response = await api.patch(`${BASE_URL}/${id}/status`, { status });
    return this.normalizeParcela(response.data as ParcelaBackendResponse);
  },

  /**
   * Marca parcela como paga
   */
  async marcarComoPaga(id: number, dataPagamento?: string): Promise<Parcela> {
    const data = dataPagamento || new Date().toISOString().split('T')[0];
    const response = await api.patch(`${BASE_URL}/${id}/status`, {
      status: 'PAGA',
      datapagamento: data
    });
    return this.normalizeParcela(response.data as ParcelaBackendResponse);
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
    const response = await api.patch<ParcelaBackendResponse>(`${BASE_URL}/${id}/reativar`);
    return this.normalizeParcela(response.data);
  },

  /**
   * Cancelar parcela
   */
  async cancelar(id: number): Promise<Parcela> {
    const response = await api.patch<ParcelaBackendResponse>(`${BASE_URL}/${id}/status`, {
      status: 'CANCELADA'
    });
    return this.normalizeParcela(response.data);
  },

  /**
   * Gerar parcelas automaticamente para um movimento
   */
  async gerarParcelas(
    movimentoId: number,
    numeroParcelas: number,
    options?: GerarParcelasOptions
  ): Promise<Parcela[]> {
    const payload: Record<string, string | number> = { numero_parcelas: numeroParcelas };
    if (options?.primeiro_vencimento) payload.primeiro_vencimento = options.primeiro_vencimento;
    if (options?.intervalo_meses) payload.intervalo_meses = options.intervalo_meses;

    const response = await api.post<ParcelaBackendResponse[]>(`/movimentos/${movimentoId}/gerar-parcelas`, payload);
    return (response.data || []).map((p) => this.normalizeParcela(p));
  },

  /**
   * Estatísticas de parcelas
   */
  async getEstatisticas(filters?: ParcelaFilter): Promise<ParcelasEstatisticas> {
    const params = new URLSearchParams();
    
    if (filters?.movimento_id) params.append('movimento_id', filters.movimento_id.toString());
    if (filters?.data_vencimento_inicio) params.append('data_vencimento_inicio', filters.data_vencimento_inicio);
    if (filters?.data_vencimento_fim) params.append('data_vencimento_fim', filters.data_vencimento_fim);

    const response = await api.get<ParcelasEstatisticas>(`${BASE_URL}/estatisticas?${params.toString()}`);
    return response.data;
  }
};

export default parcelasService;
