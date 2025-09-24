/**
 * Tipos TypeScript para as entidades do sistema.
 * Define interfaces bem tipadas para comunicação com a API.
 */

// Tipos base
export interface BaseEntity {
  id: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Supplier (Fornecedor)
export interface Supplier extends BaseEntity {
  company_name: string;
  trade_name?: string;
  tax_id: string;
}

export interface SupplierCreate {
  company_name: string;
  trade_name?: string;
  tax_id: string;
}

export interface SupplierUpdate {
  company_name?: string;
  trade_name?: string;
  tax_id?: string;
}

export interface SupplierFilter {
  company_name?: string;
  trade_name?: string;
  tax_id?: string;
  active?: boolean;
  search?: string;
}

// Customer (Cliente)
export interface Customer extends BaseEntity {
  full_name: string;
  document_id: string;
}

export interface CustomerCreate {
  full_name: string;
  document_id: string;
}

export interface CustomerUpdate {
  full_name?: string;
  document_id?: string;
}

export interface CustomerFilter {
  full_name?: string;
  document_id?: string;
  active?: boolean;
  search?: string;
}

// BilledPerson (Faturado)
export interface BilledPerson extends BaseEntity {
  full_name: string;
  document_id: string;
}

export interface BilledPersonCreate {
  full_name: string;
  document_id: string;
}

export interface BilledPersonUpdate {
  full_name?: string;
  document_id?: string;
}

export interface BilledPersonFilter {
  full_name?: string;
  document_id?: string;
  active?: boolean;
  search?: string;
}

// RevenueType (Tipo de Receita)
export interface RevenueType extends BaseEntity {
  description: string;
  notes?: string;
}

export interface RevenueTypeCreate {
  description: string;
  notes?: string;
}

export interface RevenueTypeUpdate {
  description?: string;
  notes?: string;
}

// ExpenseType (Tipo de Despesa)
export type ExpenseCategory = 
  | 'INSUMOS AGRÍCOLAS'
  | 'MANUTENÇÃO E OPERAÇÃO'
  | 'RECURSOS HUMANOS'
  | 'SERVIÇOS OPERACIONAIS'
  | 'INFRAESTRUTURA E UTILIDADES'
  | 'ADMINISTRATIVAS'
  | 'SEGUROS E PROTEÇÃO'
  | 'IMPOSTOS E TAXAS'
  | 'INVESTIMENTOS';

export interface ExpenseType extends BaseEntity {
  description: string;
  category: ExpenseCategory;
  notes?: string;
}

export interface ExpenseTypeCreate {
  description: string;
  category: ExpenseCategory;
  notes?: string;
}

export interface ExpenseTypeUpdate {
  description?: string;
  category?: ExpenseCategory;
  notes?: string;
}

// PayableAccount (Conta a Pagar)
export interface PayableAccount extends BaseEntity {
  supplier_id: string;
  billed_person_id?: string;
  invoice_number?: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  description?: string;
  notes?: string;
  installments_count: number;
  supplier?: Supplier;
  billed_person?: BilledPerson;
  installments?: PayableInstallment[];
}

export interface PayableAccountCreate {
  supplier_id: string;
  billed_person_id?: string;
  invoice_number?: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  description?: string;
  notes?: string;
  installments_count?: number;
}

export interface PayableAccountUpdate {
  supplier_id?: string;
  billed_person_id?: string;
  invoice_number?: string;
  issue_date?: string;
  due_date?: string;
  total_amount?: number;
  description?: string;
  notes?: string;
  installments_count?: number;
}

// ReceivableAccount (Conta a Receber)
export interface ReceivableAccount extends BaseEntity {
  customer_id: string;
  invoice_number?: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  description?: string;
  notes?: string;
  installments_count: number;
  customer?: Customer;
  installments?: ReceivableInstallment[];
}

export interface ReceivableAccountCreate {
  customer_id: string;
  invoice_number?: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  description?: string;
  notes?: string;
  installments_count?: number;
}

export interface ReceivableAccountUpdate {
  customer_id?: string;
  invoice_number?: string;
  issue_date?: string;
  due_date?: string;
  total_amount?: number;
  description?: string;
  notes?: string;
  installments_count?: number;
}

// PayableInstallment (Parcela de Conta a Pagar)
export interface PayableInstallment extends BaseEntity {
  payable_account_id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  paid_date?: string;
  paid_amount?: number;
  discount?: number;
  interest?: number;
  notes?: string;
  is_paid: boolean;
}

// ReceivableInstallment (Parcela de Conta a Receber)
export interface ReceivableInstallment extends BaseEntity {
  receivable_account_id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  received_date?: string;
  received_amount?: number;
  discount?: number;
  interest?: number;
  notes?: string;
  is_received: boolean;
}

// Paginação
export interface PaginationParams {
  page?: number;
  size?: number;
}

export interface PaginationResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Responses da API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface ApiError {
  detail: string;
  errors?: Array<{
    loc: string[];
    msg: string;
    type: string;
  }>;
}
