import { api } from './api';
import type { AxiosError } from 'axios';

export interface Pessoa {
  id?: number;
  documento: string;
  tipo: 'fornecedor' | 'cliente';
  razao_social: string;
  nome_fantasia?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  status: 'ativo' | 'inativo';
  created_at?: string;
  updated_at?: string;
}

export interface PessoaCreate {
  documento: string;
  tipo: 'fornecedor' | 'cliente';
  razao_social: string;
  nome_fantasia?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  status?: 'ativo' | 'inativo';
}

export interface PessoaUpdate {
  documento?: string;
  tipo?: 'fornecedor' | 'cliente';
  razao_social?: string;
  nome_fantasia?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  status?: 'ativo' | 'inativo';
}

export interface PessoaFilter {
  documento?: string;
  tipo?: 'fornecedor' | 'cliente';
  razao_social?: string;
  nome_fantasia?: string;
  status?: 'ativo' | 'inativo';
  include_deleted?: boolean;
}

export interface PessoasListResponse {
  items: Pessoa[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

class PessoasService {
  private baseUrl = '/pessoas';

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
    if (params?.filters?.razao_social) queryParams.append('razao_social', params.filters.razao_social);
    if (params?.filters?.nome_fantasia) queryParams.append('nome_fantasia', params.filters.nome_fantasia);
    if (params?.filters?.status) queryParams.append('status', params.filters.status);

    const response = await api.get(`${this.baseUrl}?${queryParams.toString()}`);
    return response.data;
  }

  async getById(id: number): Promise<Pessoa> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async create(pessoa: PessoaCreate): Promise<Pessoa> {
    const response = await api.post(this.baseUrl, pessoa);
    return response.data;
  }

  async update(id: number, pessoa: PessoaUpdate): Promise<Pessoa> {
    const response = await api.put(`${this.baseUrl}/${id}`, pessoa);
    return response.data;
  }

  async delete(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  async searchByName(name: string): Promise<Pessoa[]> {
    const response = await api.get(`${this.baseUrl}/search?name=${encodeURIComponent(name)}`);
    return response.data;
  }

  async findByDocumento(documento: string): Promise<Pessoa | null> {
    try {
      const response = await api.get(`${this.baseUrl}/documento/${documento}`);
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
      filters: { ...params?.filters, tipo: 'fornecedor' }
    });
  }

  async getClientes(params?: {
    page?: number;
    size?: number;
    filters?: Omit<PessoaFilter, 'tipo'>;
  }): Promise<PessoasListResponse> {
    return this.getAll({
      ...params,
      filters: { ...params?.filters, tipo: 'cliente' }
    });
  }
}

export default new PessoasService();
export const pessoasService = new PessoasService();