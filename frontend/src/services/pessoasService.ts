import { api } from './api';
import type { AxiosError } from 'axios';

export interface Pessoa {
  idPessoas?: number;
  documento: string;
  tipo: string;
  razaosocial: string;
  fantasia?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface PessoaCreate {
  documento: string;
  tipo: string;
  razaosocial: string;
  fantasia?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  status?: string;
}

export interface PessoaUpdate {
  documento?: string;
  tipo?: string;
  razaosocial?: string;
  fantasia?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  status?: string;
}

export interface PessoaFilter {
  documento?: string;
  tipo?: string;
  razaosocial?: string;
  fantasia?: string;
  status?: string;
  include_deleted?: boolean;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
}

export interface PessoasListResponse {
  items: Pessoa[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

class PessoasService {
  private baseUrl = '/api/v1/pessoas';

  async getAll(params?: {
    page?: number;
    size?: number;
    filters?: PessoaFilter;
  }): Promise<PessoasListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());
    if (params?.filters?.documento) queryParams.append('documento', params.filters.documento);
    if (params?.filters?.tipo) queryParams.append('tipo', params.filters.tipo);
    if (params?.filters?.status) queryParams.append('status', params.filters.status);
    const search = params?.filters?.razaosocial || params?.filters?.fantasia;
    if (search) queryParams.append('search', search);
    if (params?.filters?.order_by) queryParams.append('order_by', params.filters.order_by);
    if (params?.filters?.order_dir) queryParams.append('order_dir', params.filters.order_dir);

    const response = await api.get(`/pessoas?${queryParams.toString()}`);
    return response.data;
  }

  async getById(id: number): Promise<Pessoa> {
    const response = await api.get(`/pessoas/${id}`);
    return response.data;
  }

  async create(pessoa: PessoaCreate): Promise<Pessoa> {
    const response = await api.post('/pessoas', pessoa);
    return response.data;
  }

  async update(id: number, pessoa: PessoaUpdate): Promise<Pessoa> {
    const response = await api.put(`/pessoas/${id}`, pessoa);
    return response.data;
  }

  async delete(id: number): Promise<void> {
    await api.delete(`/pessoas/${id}`);
  }

  async searchByName(name: string): Promise<Pessoa[]> {
    const response = await api.get(`/pessoas/search?name=${encodeURIComponent(name)}`);
    return response.data;
  }

  async findByDocumento(documento: string): Promise<Pessoa | null> {
    try {
      const response = await api.get(`/pessoas/documento/${documento}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      if (err.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getFornecedores(params?: {
    page?: number;
    size?: number;
    filters?: Omit<PessoaFilter, 'tipo'>;
  }): Promise<PessoasListResponse> {
    return this.getAll({
      ...params,
      filters: { ...params?.filters, tipo: 'FORNECEDOR' }
    });
  }

  async getClientes(params?: {
    page?: number;
    size?: number;
    filters?: Omit<PessoaFilter, 'tipo'>;
  }): Promise<PessoasListResponse> {
    return this.getAll({
      ...params,
      filters: { ...params?.filters, tipo: 'CLIENTE' }
    });
  }
}

export default new PessoasService();
export const pessoasService = new PessoasService();
