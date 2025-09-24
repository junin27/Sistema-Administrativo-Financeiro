/**
 * Serviço para operações com fornecedores.
 * Gerencia todas as operações CRUD para entidade Supplier.
 */

import { get, post, put, del } from './api';
import type { 
  Supplier, 
  SupplierCreate, 
  SupplierUpdate, 
  SupplierFilter,
  PaginationParams,
  PaginationResponse 
} from '../types/entities';

const BASE_URL = '/suppliers';

export const supplierService = {
  /**
   * Lista todos os fornecedores com filtros e paginação
   */
  async list(
    filters?: SupplierFilter, 
    pagination?: PaginationParams
  ): Promise<PaginationResponse<Supplier>> {
    const params = {
      ...filters,
      ...pagination,
    };
    return get<PaginationResponse<Supplier>>(BASE_URL, params);
  },

  /**
   * Busca um fornecedor por ID
   */
  async getById(id: string): Promise<Supplier> {
    return get<Supplier>(`${BASE_URL}/${id}`);
  },

  /**
   * Cria um novo fornecedor
   */
  async create(data: SupplierCreate): Promise<Supplier> {
    return post<Supplier>(BASE_URL, data);
  },

  /**
   * Atualiza um fornecedor existente
   */
  async update(id: string, data: SupplierUpdate): Promise<Supplier> {
    return put<Supplier>(`${BASE_URL}/${id}`, data);
  },

  /**
   * Remove um fornecedor (soft delete)
   */
  async remove(id: string): Promise<void> {
    return del<void>(`${BASE_URL}/${id}`);
  },

  /**
   * Reativa um fornecedor
   */
  async reactivate(id: string): Promise<Supplier> {
    return post<Supplier>(`${BASE_URL}/${id}/reactivate`);
  },

  /**
   * Busca fornecedores por termo de pesquisa
   */
  async search(term: string): Promise<Supplier[]> {
    return get<Supplier[]>(`${BASE_URL}/search`, { q: term });
  },

  /**
   * Valida CNPJ
   */
  async validateTaxId(taxId: string): Promise<{ valid: boolean; message?: string }> {
    return get<{ valid: boolean; message?: string }>(`${BASE_URL}/validate-tax-id`, { tax_id: taxId });
  },
};
