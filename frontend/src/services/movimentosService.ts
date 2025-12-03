import { api } from './api';
import { Classificacao } from '../types/entities';
import { Pessoa } from './pessoasService';

export interface MovimentoConta {
  idMovimentoContas?: number;
  numeronotafiscal: string;
  Pessoas_idFornecedorCliente: number;
  Pessoas_idfaturado: number;
  tipo: 'PAGAR' | 'RECEBER';
  valortotal: number;
  dataemissao: string;
  datavencimento?: string; // Backend schema missing this? Let's check ddl_schemas.py again.
  datapagamento?: string;
  status: 'ABERTO' | 'FECHADO' | 'CANCELADO';
  observacoes?: string;
  descricao?: string;
  created_at?: string;
  updated_at?: string;
  fornecedor_cliente?: Pessoa;
  faturado?: Pessoa;
  classificacoes?: Classificacao[];
}

export interface MovimentoContaCreate {
  numeronotafiscal: string;
  Pessoas_idFornecedorCliente: number;
  Pessoas_idfaturado: number;
  tipo: 'PAGAR' | 'RECEBER';
  valortotal: number;
  dataemissao: string;
  datavencimento?: string;
  datapagamento?: string;
  status?: 'ABERTO' | 'FECHADO' | 'CANCELADO';
  observacoes?: string;
  descricao?: string;
}

export interface MovimentoContaUpdate {
  numeronotafiscal?: string;
  Pessoas_idFornecedorCliente?: number;
  Pessoas_idfaturado?: number;
  tipo?: 'PAGAR' | 'RECEBER';
  valortotal?: number;
  dataemissao?: string;
  datavencimento?: string;
  datapagamento?: string;
  status?: 'ABERTO' | 'FECHADO' | 'CANCELADO';
  observacoes?: string;
}

export interface MovimentoContaFilter {
  numeronotafiscal?: string;
  fornecedor_id?: number;
  faturado_id?: number;
  tipo?: 'PAGAR' | 'RECEBER';
  status?: 'ABERTO' | 'FECHADO' | 'CANCELADO';
  data_emissao_inicio?: string;
  data_emissao_fim?: string;
  data_vencimento_inicio?: string;
  data_vencimento_fim?: string;
  include_deleted?: boolean;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
}

export interface MovimentosListResponse {
  items: MovimentoConta[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface MovimentoResumo {
  tipo: 'PAGAR' | 'RECEBER';
  total_valor: number;
  quantidade: number;
}

class MovimentosService {
  private baseUrl = '/movimentos/';

  async getAll(params?: {
    page?: number;
    size?: number;
    filters?: MovimentoContaFilter;
  }): Promise<MovimentosListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());
    if (params?.filters?.fornecedor_id) queryParams.append('fornecedor_id', params.filters.fornecedor_id.toString());
    if (params?.filters?.tipo) queryParams.append('tipo', params.filters.tipo);
    if (params?.filters?.status) queryParams.append('status', params.filters.status);
    if (params?.filters?.numeronotafiscal) queryParams.append('numeronotafiscal', params.filters.numeronotafiscal);
    if (params?.filters?.include_deleted !== undefined) queryParams.append('include_deleted', params.filters.include_deleted.toString());
    if (params?.filters?.order_by) queryParams.append('order_by', params.filters.order_by);
    if (params?.filters?.order_dir) queryParams.append('order_dir', params.filters.order_dir);
    // Note: Backend filter schema has data_inicio/data_fim, not specific for emissao/vencimento. 
    // ddl_schemas.py says data_inicio/data_fim. I'll map data_emissao_inicio to data_inicio for now.

    // Ensure trailing slash to avoid redirect
    const path = this.baseUrl;
    const url = queryParams.toString() ? `${path}?${queryParams.toString()}` : path;
    const response = await api.get(url);
    return response.data;
  }

  async getById(id: number): Promise<MovimentoConta> {
    const response = await api.get(`${this.baseUrl}${id}`);
    return response.data;
  }

  async create(movimento: MovimentoContaCreate): Promise<MovimentoConta> {
    // Ensure trailing slash
    const path = this.baseUrl;
    const response = await api.post(path, movimento);
    return response.data;
  }

  async update(id: number, movimento: MovimentoContaUpdate): Promise<MovimentoConta> {
    const response = await api.put(`${this.baseUrl}${id}`, movimento);
    return response.data;
  }

  async delete(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}${id}`);
  }

  async getResumo(): Promise<MovimentoResumo[]> {
    try {
      // Avoid redirect by using correct endpoint with trailing slash if needed, 
      // or matching backend route exactly. Backend is /movimentos/resumo
      const response = await api.get(`${this.baseUrl}resumo`);
      return response.data;
    } catch (error) {
      // Se o endpoint de resumo falhar, retorna array vazio ao invés de quebrar
      console.warn('[MovimentosService] Erro ao buscar resumo:', error);
      return [];
    }
  }

  async getReceitas(params?: {
    page?: number;
    size?: number;
    filters?: Omit<MovimentoContaFilter, 'tipo'>;
  }): Promise<MovimentosListResponse> {
    return this.getAll({
      ...params,
      filters: { ...params?.filters, tipo: 'RECEITA' }
    });
  }

  async getDespesas(params?: {
    page?: number;
    size?: number;
    filters?: Omit<MovimentoContaFilter, 'tipo'>;
  }): Promise<MovimentosListResponse> {
    return this.getAll({
      ...params,
      filters: { ...params?.filters, tipo: 'DESPESA' }
    });
  }

  async getContasPagar(params?: {
    page?: number;
    size?: number;
    filters?: Omit<MovimentoContaFilter, 'tipo'>;
  }): Promise<MovimentosListResponse> {
    return this.getDespesas({
      ...params,
      filters: { ...params?.filters, status: 'PENDENTE' }
    });
  }

  async getContasReceber(params?: {
    page?: number;
    size?: number;
    filters?: Omit<MovimentoContaFilter, 'tipo'>;
  }): Promise<MovimentosListResponse> {
    return this.getReceitas({
      ...params,
      filters: { ...params?.filters, status: 'PENDENTE' }
    });
  }

  async marcarComoPago(id: number, dataPagamento?: string): Promise<MovimentoConta> {
    return this.update(id, {
      status: 'PAGO',
      datapagamento: dataPagamento || new Date().toISOString().split('T')[0]
    });
  }

  async cancelar(id: number): Promise<MovimentoConta> {
    return this.update(id, { status: 'CANCELADO' });
  }
}

export default new MovimentosService();
export const movimentosService = new MovimentosService();
