/**
 * Arquivo de exportação centralizada de tipos.
 * Facilita a importação de tipos em todo o projeto.
 */

import { ReactNode } from 'react';

// Entidades principais
export * from './entities';

// Processamento de PDF
export * from './pdf';

// Tipos de componentes comuns
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  details?: string;
}

// Props de componentes base
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

// Props de formulários
export interface FormProps<T> extends BaseComponentProps {
  initialData?: Partial<T>;
  onSubmit: (data: T) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string;
}

// Props de tabelas
export interface TableProps<T> extends BaseComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  isLoading?: boolean;
  onRowClick?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onReactivate?: (item: T) => void;
}

export interface TableColumn<T> {
  key: keyof T | string;
  title: string;
  render?: (value: any, item: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

// Props de modais
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

// Props de filtros
export interface FilterProps<T> extends BaseComponentProps {
  filters: T;
  onFiltersChange: (filters: T) => void;
  onClear: () => void;
  isLoading?: boolean;
}

// Props de paginação
export interface PaginationProps extends BaseComponentProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

// Props de busca
export interface SearchProps extends BaseComponentProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
  isLoading?: boolean;
}

// Props de status
export interface StatusBadgeProps extends BaseComponentProps {
  status: 'active' | 'inactive' | 'pending' | 'success' | 'error' | 'warning';
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Props de botões
export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}

// Tipos de navegação
export interface NavigationItem {
  key: string;
  label: string;
  icon?: ReactNode;
  path?: string;
  children?: NavigationItem[];
  badge?: string | number;
}

// Tipos de notificação
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Tipos de validação
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Tipos de formulário com validação
export interface FormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  help?: string;
}

// Tipos para hooks
export interface UseApiOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  retry?: number;
  retryDelay?: number;
}

export interface UseFormOptions<T> {
  initialData?: Partial<T>;
  validationSchema?: any; // Zod schema
  onSubmit: (data: T) => void | Promise<void>;
  onError?: (errors: ValidationError[]) => void;
}
