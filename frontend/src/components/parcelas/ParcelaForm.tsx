/**
 * Formulário para criar/editar parcelas manualmente.
 * Usado em casos especiais onde parcelas precisam ser ajustadas ou criadas fora do fluxo normal.
 */

import React, { useState } from 'react';
import { Calendar, DollarSign, Hash, FileText, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import type { Parcela, ParcelaCreate, ParcelaUpdate, ParcelaStatus } from '../../types/entities';

interface ParcelaFormProps {
  parcela?: Parcela;
  movimentoId?: number;
  onSubmit: (data: ParcelaCreate) => Promise<void>;
  onUpdate?: (data: ParcelaUpdate) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

export function ParcelaForm({ parcela, movimentoId, onSubmit, onUpdate, onCancel, isEdit = false }: ParcelaFormProps) {
  const [formData, setFormData] = useState({
    MovimentoContas_idMovimentoContas: parcela?.MovimentoContas_idMovimentoContas || movimentoId || 0,
    identificacao: parcela?.identificacao || '',
    numero_parcela: parcela?.numero_parcela || 1,
    valorparcela: parcela?.valorparcela || 0,
    datavencimento: parcela?.datavencimento ? parcela.datavencimento.split('T')[0] : '',
    datapagamento: parcela?.datapagamento ? parcela.datapagamento.split('T')[0] : '',
    status: (parcela?.status || 'PENDENTE') as ParcelaStatus,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validação do formulário
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isEdit && !formData.MovimentoContas_idMovimentoContas) {
      newErrors.MovimentoContas_idMovimentoContas = 'Movimento é obrigatório';
    }

    if (!formData.identificacao.trim()) {
      newErrors.identificacao = 'Identificação é obrigatória';
    }

    if (formData.numero_parcela < 1) {
      newErrors.numero_parcela = 'Número da parcela deve ser maior que 0';
    }

    if (formData.valorparcela <= 0) {
      newErrors.valorparcela = 'Valor deve ser maior que 0';
    }

    if (!formData.datavencimento) {
      newErrors.datavencimento = 'Data de vencimento é obrigatória';
    }

    // Validar data de pagamento se status é PAGA
    if (formData.status === 'PAGA' && !formData.datapagamento) {
      newErrors.datapagamento = 'Data de pagamento é obrigatória para parcelas pagas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Corrija os erros no formulário');
      return;
    }

    setLoading(true);

    try {
      if (isEdit && onUpdate) {
        const updateData: ParcelaUpdate = {
          identificacao: formData.identificacao,
          numero_parcela: formData.numero_parcela,
          valorparcela: formData.valorparcela,
          datavencimento: formData.datavencimento,
          datapagamento: formData.datapagamento || undefined,
          status: formData.status,
        };
        await onUpdate(updateData);
      } else {
        const createData: ParcelaCreate = {
          MovimentoContas_idMovimentoContas: formData.MovimentoContas_idMovimentoContas,
          identificacao: formData.identificacao,
          numero_parcela: formData.numero_parcela,
          valorparcela: formData.valorparcela,
          datavencimento: formData.datavencimento,
          datapagamento: formData.datapagamento || undefined,
          status: formData.status,
        };
        await onSubmit(createData);
      }

      toast.success(isEdit ? 'Parcela atualizada com sucesso!' : 'Parcela criada com sucesso!');
    } catch (error) {
      const err = error as AxiosError<{ detail: string }>;
      toast.error(err.response?.data?.detail || 'Erro ao salvar parcela');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | number | ParcelaStatus) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpar erro do campo ao modificar
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          {isEdit ? 'Editar Parcela' : 'Nova Parcela'}
        </h2>
      </div>

      {/* Grid de Campos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Movimento ID (apenas criação) */}
        {!isEdit && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash className="inline h-4 w-4 mr-1" />
              ID do Movimento *
            </label>
            <input
              type="number"
              value={formData.MovimentoContas_idMovimentoContas}
              onChange={(e) => handleChange('MovimentoContas_idMovimentoContas', parseInt(e.target.value))}
              className={`input-field ${errors.MovimentoContas_idMovimentoContas ? 'border-red-500' : ''}`}
              placeholder="ID do movimento"
              disabled={!!movimentoId}
              min="1"
            />
            {errors.MovimentoContas_idMovimentoContas && (
              <p className="text-red-500 text-sm mt-1">{errors.MovimentoContas_idMovimentoContas}</p>
            )}
          </div>
        )}

        {/* Identificação */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="inline h-4 w-4 mr-1" />
            Identificação *
          </label>
          <input
            type="text"
            value={formData.identificacao}
            onChange={(e) => handleChange('identificacao', e.target.value)}
            className={`input-field ${errors.identificacao ? 'border-red-500' : ''}`}
            placeholder="Ex: Parcela 1/3 - Nota Fiscal 12345"
            maxLength={100}
          />
          {errors.identificacao && (
            <p className="text-red-500 text-sm mt-1">{errors.identificacao}</p>
          )}
        </div>

        {/* Número da Parcela */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Hash className="inline h-4 w-4 mr-1" />
            Número da Parcela *
          </label>
          <input
            type="number"
            value={formData.numero_parcela}
            onChange={(e) => handleChange('numero_parcela', parseInt(e.target.value))}
            className={`input-field ${errors.numero_parcela ? 'border-red-500' : ''}`}
            placeholder="1"
            min="1"
          />
          {errors.numero_parcela && (
            <p className="text-red-500 text-sm mt-1">{errors.numero_parcela}</p>
          )}
        </div>

        {/* Valor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="inline h-4 w-4 mr-1" />
            Valor *
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.valorparcela}
            onChange={(e) => handleChange('valorparcela', parseFloat(e.target.value))}
            className={`input-field ${errors.valorparcela ? 'border-red-500' : ''}`}
            placeholder="0.00"
            min="0.01"
          />
          {errors.valorparcela && (
            <p className="text-red-500 text-sm mt-1">{errors.valorparcela}</p>
          )}
          {formData.valorparcela > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {formData.valorparcela.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
          )}
        </div>

        {/* Data de Vencimento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            Data de Vencimento *
          </label>
          <input
            type="date"
            value={formData.datavencimento}
            onChange={(e) => handleChange('datavencimento', e.target.value)}
            className={`input-field ${errors.datavencimento ? 'border-red-500' : ''}`}
          />
          {errors.datavencimento && (
            <p className="text-red-500 text-sm mt-1">{errors.datavencimento}</p>
          )}
        </div>

        {/* Data de Pagamento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            Data de Pagamento
          </label>
          <input
            type="date"
            value={formData.datapagamento}
            onChange={(e) => handleChange('datapagamento', e.target.value)}
            className={`input-field ${errors.datapagamento ? 'border-red-500' : ''}`}
          />
          {errors.datapagamento && (
            <p className="text-red-500 text-sm mt-1">{errors.datapagamento}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">Opcional (preencher se status for PAGA)</p>
        </div>

        {/* Status */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value as ParcelaStatus)}
            className="input-field"
          >
            <option value="PENDENTE">Pendente</option>
            <option value="PAGA">Paga</option>
            <option value="VENCIDA">Vencida</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Status atual da parcela (PAGA requer data de pagamento)
          </p>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="btn-outline"
          disabled={loading}
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Salvando...' : isEdit ? 'Atualizar' : 'Criar Parcela'}
        </button>
      </div>
    </form>
  );
}
