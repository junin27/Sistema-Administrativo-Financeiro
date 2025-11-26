/**
 * Componente para listar parcelas de um movimento
 */
import React from 'react';
import { 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle 
} from 'lucide-react';
import { Parcela } from '../../types/entities';

interface ParcelasListProps {
  parcelas: Parcela[];
  onMarcarPaga?: (parcelaId: number) => void;
  onEdit?: (parcela: Parcela) => void;
  loading?: boolean;
}

const ParcelasList: React.FC<ParcelasListProps> = ({ 
  parcelas, 
  onMarcarPaga, 
  onEdit,
  loading = false 
}) => {
  
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'PENDENTE': {
        icon: Clock,
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        label: 'Pendente'
      },
      'PAGA': {
        icon: CheckCircle,
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        label: 'Paga'
      },
      'VENCIDA': {
        icon: AlertCircle,
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        label: 'Vencida'
      },
      'CANCELADA': {
        icon: XCircle,
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        label: 'Cancelada'
      }
    };

    const badge = badges[status as keyof typeof badges] || badges['PENDENTE'];
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.bgColor} ${badge.textColor}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const isVencida = (vencimento: string, status: string): boolean => {
    if (status === 'PAGA' || status === 'CANCELADA') return false;
    const hoje = new Date();
    const dataVencimento = new Date(vencimento);
    return dataVencimento < hoje;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando parcelas...</p>
      </div>
    );
  }

  if (!parcelas || parcelas.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">Nenhuma parcela encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {parcelas.map((parcela) => (
        <div
          key={parcela.idParcelasContas}
          className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
            isVencida(parcela.datavencimento, parcela.status) ? 'border-red-300 bg-red-50' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            {/* Informações da Parcela */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-semibold text-gray-900">
                  {parcela.identificacao}
                </h4>
                {getStatusBadge(parcela.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                {/* Número da Parcela */}
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="font-medium">Parcela:</span>
                  <span>{parcela.numero_parcela}</span>
                </div>

                {/* Valor */}
                <div className="flex items-center gap-2 text-gray-900">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-semibold">{formatCurrency(parcela.valorparcela)}</span>
                </div>

                {/* Data de Vencimento */}
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Venc: {formatDate(parcela.datavencimento)}</span>
                  {isVencida(parcela.datavencimento, parcela.status) && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>

              {/* Data de Pagamento */}
              {parcela.datapagamento && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Pago em: {formatDate(parcela.datapagamento)}</span>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2 ml-4">
              {parcela.status === 'PENDENTE' && onMarcarPaga && (
                <button
                  onClick={() => onMarcarPaga(parcela.idParcelasContas)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  title="Marcar como paga"
                >
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Pagar
                </button>
              )}

              {onEdit && (
                <button
                  onClick={() => onEdit(parcela)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  title="Editar parcela"
                >
                  Editar
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ParcelasList;
