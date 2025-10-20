/**
 * Tipos TypeScript para a Etapa 2 - Contas a Pagar.
 * Define interfaces para validação e criação de contas a pagar.
 */

import type { ExpenseCategory } from './entities';

// Re-exportar ExpenseCategory para facilitar o uso
export type { ExpenseCategory } from './entities';

// Schemas para validação
export interface SupplierValidation {
  company_name: string;
  tax_id: string;
}

export interface BilledPersonValidation {
  full_name: string;
  document_id: string;
}

export interface ExpenseValidation {
  description: string;
  category?: ExpenseCategory;
}

// Schema para parcela
export interface InstallmentCreate {
  installment_number: number;
  due_date: string;
  installment_amount: number;
  notes?: string;
}

// Schema principal para criação de conta a pagar
export interface PayableAccountCreateEtapa2 {
  invoice_number?: string;
  issue_date: string;
  product_description: string;
  total_amount: number;
  supplier: SupplierValidation;
  billed_person?: BilledPersonValidation;
  expense: ExpenseValidation;
  installments: InstallmentCreate[];
}

// Resultado de validação
export interface ValidationResult {
  exists: boolean;
  id?: string;
  message: string;
}

// Resposta da validação
export interface PayableAccountValidationResponse {
  supplier_validation: ValidationResult;
  billed_person_validation?: ValidationResult;
  expense_validation: ValidationResult;
}

// Resposta da criação
export interface PayableAccountCreateResponse {
  success: boolean;
  message: string;
  payable_account_id?: string;
  validation_results: PayableAccountValidationResponse;
}