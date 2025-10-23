/**
 * Formulário para criação/edição de clientes.
 * Validação com Zod e React Hook Form.
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from 'react-query';
import { ArrowLeft, Save, Users } from 'lucide-react';
import toast from 'react-hot-toast';

import { customerService } from '../../services/customerService';
import type { CustomerCreate, CustomerUpdate } from '../../types/entities';

// Schema de validação
const customerSchema = z.object({
  full_name: z.string()
    .min(1, 'Nome completo é obrigatório')
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  document_id: z.string()
    .min(1, 'CPF é obrigatório')
    .refine((val) => {
      const cleaned = val.replace(/\D/g, '');
      return cleaned.length >= 11 && cleaned.length <= 14;
    }, 'CPF deve ter entre 11 e 14 dígitos')
});

type CustomerFormData = z.infer<typeof customerSchema>;

// Função para formatar CPF
const formatCPF = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
};

export function CustomerForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  // Formulário
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      full_name: '',
      document_id: ''
    }
  });

  // Watch para formatação em tempo real
  const watchedDocumentId = watch('document_id');

  // Formatação automática do CPF
  React.useEffect(() => {
    if (watchedDocumentId) {
      const formatted = formatCPF(watchedDocumentId);
      if (formatted !== watchedDocumentId) {
        setValue('document_id', formatted);
      }
    }
  }, [watchedDocumentId, setValue]);

  // Query para carregar dados do cliente (modo edição)
  const { isLoading } = useQuery(
    ['customer', id],
    () => customerService.getById(id!),
    {
      enabled: isEditing,
      onSuccess: (data) => {
        setValue('full_name', data.full_name);
        setValue('document_id', formatCPF(data.document_id));
      }
    }
  );

  // Mutation para criar cliente
  const createMutation = useMutation(customerService.create, {
    onSuccess: () => {
      toast.success('Cliente criado com sucesso!');
      navigate('/clientes');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Erro ao criar cliente';
      toast.error(message);
    }
  });

  // Mutation para atualizar cliente
  const updateMutation = useMutation(
    (data: CustomerUpdate) => customerService.update(id!, data),
    {
      onSuccess: () => {
        toast.success('Cliente atualizado com sucesso!');
        navigate('/clientes');
      },
      onError: (error: any) => {
        const message = error?.response?.data?.detail || 'Erro ao atualizar cliente';
        toast.error(message);
      }
    }
  );

  // Submit do formulário
  const onSubmit = async (data: CustomerFormData) => {
    try {
      // Limpar CPF para envio
      const cleanedData = {
        ...data,
        document_id: data.document_id.replace(/\D/g, '')
      };

      if (isEditing) {
        await updateMutation.mutateAsync(cleanedData);
      } else {
        await createMutation.mutateAsync(cleanedData as CustomerCreate);
      }
    } catch (error) {
      // Erro já tratado nas mutations
    }
  };

  if (isEditing && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/clientes')}
          className="btn-outline p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="h-8 w-8 mr-3 text-green-600" />
            {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isEditing 
              ? 'Atualize os dados do cliente' 
              : 'Preencha os dados para criar um novo cliente'
            }
          </p>
        </div>
      </div>

      {/* Formulário */}
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Nome Completo */}
            <div>
              <label htmlFor="full_name" className="form-label">
                Nome Completo *
              </label>
              <input
                type="text"
                id="full_name"
                {...register('full_name')}
                className={`form-input ${errors.full_name ? 'border-red-500' : ''}`}
                placeholder="Digite o nome completo do cliente"
              />
              {errors.full_name && (
                <p className="form-error">{errors.full_name.message}</p>
              )}
            </div>

            {/* CPF */}
            <div>
              <label htmlFor="document_id" className="form-label">
                CPF *
              </label>
              <input
                type="text"
                id="document_id"
                {...register('document_id')}
                className={`form-input ${errors.document_id ? 'border-red-500' : ''}`}
                placeholder="000.000.000-00"
                maxLength={14}
              />
              {errors.document_id && (
                <p className="form-error">{errors.document_id.message}</p>
              )}
            </div>

            {/* Botões */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/clientes')}
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
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting 
                  ? (isEditing ? 'Atualizando...' : 'Criando...') 
                  : (isEditing ? 'Atualizar' : 'Criar Cliente')
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
