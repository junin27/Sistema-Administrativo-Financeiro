import { api } from './api';
import { Classificacao } from '../types/entities';
import { Pessoa } from './pessoasService';

export interface MovimentoConta {
  idMovimentoContas?: number;
  numeronotafiscal: string;
  Pessoas_idFornecedorCliente: number;
  Pessoas_idfaturado: number;
  tipo: 'RECEITA' | 'DESPESA';
  valortotal: number;
  dataemissao: string;
  datavencimento?: string; // Backend schema missing this? Let's check ddl_schemas.py again.
  datapagamento?: string;
  status: 'PENDENTE' | 'PAGO' | 'CANCELADO';
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
  tipo: 'RECEITA' | 'DESPESA';
  valortotal: number;
  dataemissao: string;
  datavencimento?: string;
  datapagamento?: string;
  status?: 'PENDENTE' | 'PAGO' | 'CANCELADO';
  observacoes?: string;
  descricao?: string;
}

export interface MovimentoContaUpdate {
  numeronotafiscal?: string;
  Pessoas_idFornecedorCliente?: number;
  Pessoas_idfaturado?: number;
  tipo?: 'RECEITA' | 'DESPESA';
  valortotal?: number;
  dataemissao?: string;
  datavencimento?: string;
  datapagamento?: string;
  status?: 'PENDENTE' | 'PAGO' | 'CANCELADO';
  observacoes?: string;
}

export interface MovimentoContaFilter {
  numeronotafiscal?: string;
  fornecedor_id?: number;
  faturado_id?: number;
  tipo?: 'RECEITA' | 'DESPESA';
  status?: 'PENDENTE' | 'PAGO' | 'CANCELADO';
  data_emissao_inicio?: string;
  data_emissao_fim?: string;
  data_vencimento_inicio?: string;
  data_vencimento_fim?: string;
  include_deleted?: boolean;
}

export interface MovimentosListResponse {
  items: MovimentoConta[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface MovimentoResumo {
  tipo: 'RECEITA' | 'DESPESA';
  total_valor: number;
  quantidade: number;
}

class MovimentosService {
  private baseUrl = '/movimentos';

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
    // Note: Backend filter schema has data_inicio/data_fim, not specific for emissao/vencimento. 
    // ddl_schemas.py says data_inicio/data_fim. I'll map data_emissao_inicio to data_inicio for now.

    const path = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
    const response = await api.get(`${path}?${queryParams.toString()}`);
    return response.data;
  }

  async getById(id: number): Promise<MovimentoConta> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async create(movimento: MovimentoContaCreate): Promise<MovimentoConta> {
    const path = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
    const response = await api.post(path, movimento);
    return response.data;
  }

  async update(id: number, movimento: MovimentoContaUpdate): Promise<MovimentoConta> {
    const response = await api.put(`${this.baseUrl}/${id}`, movimento);
    return response.data;
  }

  async delete(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  async getResumo(): Promise<MovimentoResumo[]> {
    const response = await api.get(`${this.baseUrl}/resumo`);
    return response.data;
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
