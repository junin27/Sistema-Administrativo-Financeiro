import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Receipt, Save, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { revenueTypeService } from '../../services/revenueTypeService';

// Schema de validação
const revenueTypeSchema = z.object({
  description: z.string()
    .min(1, 'Descrição é obrigatória')
    .max(255, 'Descrição deve ter no máximo 255 caracteres')
    .refine(async (value) => {
      if (!value) return true;
      // Validação de descrição duplicada será feita no onSubmit
      return true;
    }),
  notes: z.string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional()
    .or(z.literal(''))
});

type RevenueTypeFormData = z.infer<typeof revenueTypeSchema>;

export function RevenueTypeForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    setError: setFormError
  } = useForm<RevenueTypeFormData>({
    resolver: zodResolver(revenueTypeSchema),
    defaultValues: {
      description: '',
      notes: ''
    }
  });

  // Carregar dados para edição
  useEffect(() => {
    if (isEditing && id) {
      loadRevenueType(id);
    }
  }, [id, isEditing]);

  const loadRevenueType = async (revenueTypeId: string) => {
    try {
      setInitialLoading(true);
      const revenueType = await revenueTypeService.getById(revenueTypeId);
      setValue('description', revenueType.description);
      setValue('notes', revenueType.notes || '');
    } catch (error) {
      console.error('Erro ao carregar tipo de receita:', error);
      setError('Erro ao carregar dados do tipo de receita');
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data: RevenueTypeFormData) => {
    try {
      setLoading(true);
      setError(null);

      // Validar descrição duplicada
      const isDuplicate = await revenueTypeService.validateDescription(
        data.description,
        isEditing ? id : undefined
      );

      if (isDuplicate) {
        setFormError('description', {
          type: 'manual',
          message: 'Já existe um tipo de receita com esta descrição'
        });
        return;
      }

      if (isEditing && id) {
        await revenueTypeService.update(id, {
          description: data.description,
          notes: data.notes || undefined
        });
      } else {
        await revenueTypeService.create({
          description: data.description,
          notes: data.notes || undefined
        });
      }

      navigate('/tipos-receita');
    } catch (error: any) {
      console.error('Erro ao salvar tipo de receita:', error);
      
      if (error.response?.data?.detail) {
        if (error.response.data.detail.includes('descrição')) {
          setFormError('description', {
            type: 'manual',
            message: 'Já existe um tipo de receita com esta descrição'
          });
        } else {
          setError(error.response.data.detail);
        }
      } else {
        setError('Erro ao salvar tipo de receita. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/tipos-receita')} className="btn-outline p-2">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Receipt className="h-8 w-8 mr-3 text-green-600" />
              Carregando...
            </h1>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando dados...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate('/tipos-receita')} className="btn-outline p-2">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Receipt className="h-8 w-8 mr-3 text-green-600" />
            {isEditing ? 'Editar Tipo de Receita' : 'Novo Tipo de Receita'}
          </h1>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Descrição */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição *
                </label>
                <input
                  type="text"
                  id="description"
                  {...register('description')}
                  className={`input ${errors.description ? 'border-red-500' : ''}`}
                  placeholder="Ex: Vendas de Produtos, Prestação de Serviços..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Observações */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  {...register('notes')}
                  className={`input ${errors.notes ? 'border-red-500' : ''}`}
                  placeholder="Observações adicionais sobre este tipo de receita..."
                />
                {errors.notes && (
                  <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
                )}
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/tipos-receita')}
                className="btn-outline"
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || isSubmitting}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? 'Atualizar' : 'Salvar'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
