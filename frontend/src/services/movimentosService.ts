import { api } from './api';

export interface MovimentoConta {
  id?: number;
  numero_nota_fiscal: string;
  fornecedor_cliente_id: number;
  pessoa_faturada_id?: number;
  tipo: 'receita' | 'despesa';
  valor: number;
  data_emissao: string;
  data_vencimento: string;
  data_pagamento?: string;
  status: 'pendente' | 'pago' | 'cancelado';
  observacoes?: string;
  descricao?: string;
  created_at?: string;
  updated_at?: string;
  fornecedor_cliente?: {
    id: number;
    razao_social: string;
    nome_fantasia?: string;
    documento: string;
    tipo: string;
  };
  pessoa_faturada?: {
    id: number;
    razao_social: string;
    nome_fantasia?: string;
    documento: string;
    tipo: string;
  };
}

export interface MovimentoContaCreate {
  numero_nota_fiscal: string;
  fornecedor_cliente_id: number;
  pessoa_faturada_id?: number;
  tipo: 'receita' | 'despesa';
  valor: number;
  data_emissao: string;
  data_vencimento: string;
  data_pagamento?: string;
  status?: 'pendente' | 'pago' | 'cancelado';
  observacoes?: string;
  descricao?: string;
}

export interface MovimentoContaUpdate {
  numero_nota_fiscal?: string;
  fornecedor_cliente_id?: number;
  pessoa_faturada_id?: number;
  tipo?: 'receita' | 'despesa';
  valor?: number;
  data_emissao?: string;
  data_vencimento?: string;
  data_pagamento?: string;
  status?: 'pendente' | 'pago' | 'cancelado';
  observacoes?: string;
}

export interface MovimentoContaFilter {
  numero_nota_fiscal?: string;
  fornecedor_cliente_id?: number;
  pessoa_faturada_id?: number;
  tipo?: 'receita' | 'despesa';
  status?: 'pendente' | 'pago' | 'cancelado';
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
  tipo: 'receita' | 'despesa';
  total_valor: number;
  quantidade: number;
}

class MovimentosService {
  private baseUrl = '/api/v1/movimentos';

  async getAll(params?: {
    page?: number;
    size?: number;
    filters?: MovimentoContaFilter;
  }): Promise<MovimentosListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());
    if (params?.filters?.numero_nota_fiscal) queryParams.append('numero_nota_fiscal', params.filters.numero_nota_fiscal);
    if (params?.filters?.fornecedor_cliente_id) queryParams.append('fornecedor_cliente_id', params.filters.fornecedor_cliente_id.toString());
    if (params?.filters?.pessoa_faturada_id) queryParams.append('pessoa_faturada_id', params.filters.pessoa_faturada_id.toString());
    if (params?.filters?.tipo) queryParams.append('tipo', params.filters.tipo);
    if (params?.filters?.status) queryParams.append('status', params.filters.status);
    if (params?.filters?.data_emissao_inicio) queryParams.append('data_emissao_inicio', params.filters.data_emissao_inicio);
    if (params?.filters?.data_emissao_fim) queryParams.append('data_emissao_fim', params.filters.data_emissao_fim);
    if (params?.filters?.data_vencimento_inicio) queryParams.append('data_vencimento_inicio', params.filters.data_vencimento_inicio);
    if (params?.filters?.data_vencimento_fim) queryParams.append('data_vencimento_fim', params.filters.data_vencimento_fim);

    const response = await api.get(`${this.baseUrl}?${queryParams.toString()}`);
    return response.data;
  }

  async getById(id: number): Promise<MovimentoConta> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async create(movimento: MovimentoContaCreate): Promise<MovimentoConta> {
    const response = await api.post(this.baseUrl, movimento);
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
      filters: { ...params?.filters, tipo: 'receita' }
    });
  }

  async getDespesas(params?: {
    page?: number;
    size?: number;
    filters?: Omit<MovimentoContaFilter, 'tipo'>;
  }): Promise<MovimentosListResponse> {
    return this.getAll({
      ...params,
      filters: { ...params?.filters, tipo: 'despesa' }
    });
  }

  async getContasPagar(params?: {
    page?: number;
    size?: number;
    filters?: Omit<MovimentoContaFilter, 'tipo'>;
  }): Promise<MovimentosListResponse> {
    return this.getDespesas({
      ...params,
      filters: { ...params?.filters, status: 'pendente' }
    });
  }

  async getContasReceber(params?: {
    page?: number;
    size?: number;
    filters?: Omit<MovimentoContaFilter, 'tipo'>;
  }): Promise<MovimentosListResponse> {
    return this.getReceitas({
      ...params,
      filters: { ...params?.filters, status: 'pendente' }
    });
  }

  async marcarComoPago(id: number, dataPagamento?: string): Promise<MovimentoConta> {
    return this.update(id, {
      status: 'pago',
      data_pagamento: dataPagamento || new Date().toISOString().split('T')[0]
    });
  }

  async cancelar(id: number): Promise<MovimentoConta> {
    return this.update(id, { status: 'cancelado' });
  }
}

export default new MovimentosService();
export const movimentosService = new MovimentosService();