/**
 * Serviço para operações com clientes.
 * Gerencia todas as operações CRUD para entidade Customer.
 */

import { get, post, put, del } from './api';
import {
  Customer,
  CustomerCreate,
  CustomerUpdate,
  CustomerFilter,
  PaginationParams
} from '../types/entities';

const BASE_URL = '/api/v1/customers';

export const customerService = {
  /**
   * Lista todos os clientes com paginação e filtros
   */
  async list(
    filters?: CustomerFilter, 
    pagination?: PaginationParams
  ): Promise<Customer[]> {
    const params = new URLSearchParams();
    
    if (pagination?.skip) params.append('skip', pagination.skip.toString());
    if (pagination?.limit) params.append('limit', pagination.limit.toString());
    if (filters?.full_name) params.append('full_name', filters.full_name);
    if (filters?.document_id) params.append('document_id', filters.document_id);
    
    const url = params.toString() ? `${BASE_URL}?${params}` : BASE_URL;
    return get<Customer[]>(url);
  },

  /**
   * Obtém um cliente por ID
   */
  async getById(id: string): Promise<Customer> {
    return get<Customer>(`${BASE_URL}/${id}`);
  },

  /**
   * Obtém um cliente por CPF
   */
  async getByDocumentId(documentId: string): Promise<Customer> {
    return get<Customer>(`${BASE_URL}/document-id/${documentId}`);
  },

  /**
   * Cria um novo cliente
   */
  async create(customerData: CustomerCreate): Promise<Customer> {
    return post<Customer>(BASE_URL, customerData);
  },

  /**
   * Atualiza um cliente existente
   */
  async update(id: string, customerData: CustomerUpdate): Promise<Customer> {
    return put<Customer>(`${BASE_URL}/${id}`, customerData);
  },

  /**
   * Remove um cliente (soft delete)
   */
  async remove(id: string): Promise<void> {
    return del<void>(`${BASE_URL}/${id}`);
  },

  /**
   * Reativa um cliente inativo
   */
  async reactivate(id: string): Promise<Customer> {
    return post<Customer>(`${BASE_URL}/${id}/reactivate`, {});
  },

  /**
   * Busca clientes por nome
   */
  async searchByName(searchTerm: string, params?: PaginationParams): Promise<Customer[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('search_term', searchTerm);
    
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    return get<Customer[]>(`${BASE_URL}/search/name?${queryParams}`);
  },

  /**
   * Valida se um CPF já está em uso
   */
  async validateDocumentId(documentId: string): Promise<boolean> {
    try {
      await this.getByDocumentId(documentId);
      return false; // CPF já existe
    } catch (error: any) {
      if (error.status === 404) {
        return true; // CPF disponível
      }
      throw error; // Outro erro
    }
  }
};