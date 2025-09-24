/**
 * Formulário para criação/edição de fornecedores.
 * Validação com Zod e React Hook Form.
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from 'react-query';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { supplierService } from '../../services/supplierService';
import type { SupplierCreate, SupplierUpdate } from '../../types/entities';

// Schema de validação
const supplierSchema = z.object({
  company_name: z.string()
    .min(1, 'Razão social é obrigatória')
    .min(3, 'Razão social deve ter pelo menos 3 caracteres')
    .max(255, 'Razão social deve ter no máximo 255 caracteres'),
  trade_name: z.string()
    .max(255, 'Nome fantasia deve ter no máximo 255 caracteres')
    .optional()
    .or(z.literal('')),
  tax_id: z.string()
    .min(1, 'CNPJ é obrigatório')
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX')
});

type SupplierFormData = z.infer<typeof supplierSchema>;

export function SupplierForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  // Formulário
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      company_name: '',
      trade_name: '',
      tax_id: '',
    }
  });

  // Query para buscar dados do fornecedor (se editando)
  const { isLoading } = useQuery(
    ['supplier', id],
    () => supplierService.getById(id!),
    {
      enabled: isEditing,
      onSuccess: (data) => {
        setValue('company_name', data.company_name);
        setValue('trade_name', data.trade_name || '');
        setValue('tax_id', data.tax_id);
      }
    }
  );

  // Mutation para criar/atualizar
  const mutation = useMutation(
    (data: SupplierFormData) => {
      const cleanData = {
        ...data,
        trade_name: data.trade_name || undefined,
      };

      if (isEditing) {
        return supplierService.update(id!, cleanData as SupplierUpdate);
      } else {
        return supplierService.create(cleanData as SupplierCreate);
      }
    },
    {
      onSuccess: () => {
        toast.success(
          isEditing 
            ? 'Fornecedor atualizado com sucesso!' 
            : 'Fornecedor criado com sucesso!'
        );
        navigate('/fornecedores');
      },
      onError: (error) => {
        console.error('Erro ao salvar fornecedor:', error);
      }
    }
  );

  // Formatação do CNPJ
  const formatCNPJ = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2})$/);
    
    if (match) {
      return [match[1], match[2], match[3], match[4], match[5]]
        .filter(Boolean)
        .join('.')
        .replace(/\.(\d{3})\./, '.$1/')
        .replace(/\/(\d{4})\./, '/$1-');
    }
    
    return value;
  };

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setValue('tax_id', formatted);
  };

  const onSubmit = (data: SupplierFormData) => {
    mutation.mutate(data);
  };

  if (isEditing && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/fornecedores')}
          className="btn-outline p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Building2 className="h-8 w-8 mr-3 text-blue-600" />
            {isEditing ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isEditing 
              ? 'Atualize as informações do fornecedor'
              : 'Preencha os dados para criar um novo fornecedor'
            }
          </p>
        </div>
      </div>

      {/* Formulário */}
      <div className="card max-w-2xl">
        <div className="card-header">
          <h2 className="text-lg font-medium text-gray-900">
            Informações do Fornecedor
          </h2>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="card-body space-y-6">
          {/* Razão Social */}
          <div>
            <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
              Razão Social *
            </label>
            <input
              type="text"
              id="company_name"
              {...register('company_name')}
              className={`mt-1 input-field ${errors.company_name ? 'input-error' : ''}`}
              placeholder="Ex: Empresa XYZ Ltda"
            />
            {errors.company_name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.company_name.message}
              </p>
            )}
          </div>

          {/* Nome Fantasia */}
          <div>
            <label htmlFor="trade_name" className="block text-sm font-medium text-gray-700">
              Nome Fantasia
            </label>
            <input
              type="text"
              id="trade_name"
              {...register('trade_name')}
              className={`mt-1 input-field ${errors.trade_name ? 'input-error' : ''}`}
              placeholder="Ex: XYZ Company"
            />
            {errors.trade_name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.trade_name.message}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Nome comercial da empresa (opcional)
            </p>
          </div>

          {/* CNPJ */}
          <div>
            <label htmlFor="tax_id" className="block text-sm font-medium text-gray-700">
              CNPJ *
            </label>
            <input
              type="text"
              id="tax_id"
              {...register('tax_id')}
              onChange={handleCNPJChange}
              className={`mt-1 input-field font-mono ${errors.tax_id ? 'input-error' : ''}`}
              placeholder="XX.XXX.XXX/XXXX-XX"
              maxLength={18}
            />
            {errors.tax_id && (
              <p className="mt-1 text-sm text-red-600">
                {errors.tax_id.message}
              </p>
            )}
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/fornecedores')}
              className="btn-outline"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="loading-spinner h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isEditing ? 'Atualizar' : 'Criar'} Fornecedor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
