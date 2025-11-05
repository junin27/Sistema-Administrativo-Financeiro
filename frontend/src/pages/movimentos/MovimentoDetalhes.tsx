import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  FileText, 
  User, 
  Building,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import movimentosService, { MovimentoConta } from '../../services/movimentosService';
import parcelasService from '../../services/parcelasService';
import { Parcela, Classificacao } from '../../types/entities';
import ParcelasList from '../../components/parcelas/ParcelasList';

const MovimentoDetalhes: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movimento, setMovimento] = useState<MovimentoConta | null>(null);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [_classificacoes, _setClassificacoes] = useState<Classificacao[]>([]); // TODO: Implementar classificações
  const [loading, setLoading] = useState(true);
  const [loadingParcelas, setLoadingParcelas] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadMovimento(parseInt(id));
      loadParcelas(parseInt(id));
    }
  }, [id]);

  const loadMovimento = async (movimentoId: number) => {
    try {
      setLoading(true);
      const response = await movimentosService.getById(movimentoId);
      setMovimento(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao carregar movimento');
      toast.error('Erro ao carregar movimento');
    } finally {
      setLoading(false);
    }
  };

  const loadParcelas = async (movimentoId: number) => {
    try {
      setLoadingParcelas(true);
      const response = await parcelasService.getByMovimento(movimentoId);
      setParcelas(response);
    } catch (err: any) {
      console.error('Erro ao carregar parcelas:', err);
      // Não mostra erro crítico se parcelas não carregarem
    } finally {
      setLoadingParcelas(false);
    }
  };

  const handleMarcarParcelaPaga = async (parcelaId: number) => {
    try {
      await parcelasService.marcarComoPaga(parcelaId);
      toast.success('Parcela marcada como paga!');
      if (id) {
        loadParcelas(parseInt(id));
        loadMovimento(parseInt(id));
      }
    } catch (err: any) {
      toast.error('Erro ao marcar parcela como paga');
    }
  };

  const handleDelete = async () => {
    if (!movimento?.id) return;
    
    if (window.confirm('Tem certeza que deseja excluir este movimento?')) {
      try {
        await movimentosService.delete(movimento.id);
        navigate('/movimentos');
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Erro ao excluir movimento');
      }
    }
  };

  const handleMarcarComoPago = async () => {
    if (!movimento?.id) return;
    
    try {
      await movimentosService.marcarComoPago(movimento.id);
      loadMovimento(movimento.id);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao marcar como pago');
    }
  };

  const handleCancelar = async () => {
    if (!movimento?.id) return;
    
    if (window.confirm('Tem certeza que deseja cancelar este movimento?')) {
      try {
        await movimentosService.cancelar(movimento.id);
        loadMovimento(movimento.id);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Erro ao cancelar movimento');
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago':
        return 'bg-green-100 text-green-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pago':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pendente':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'cancelado':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !movimento) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'Movimento não encontrado'}
        </div>
        <Link
          to="/movimentos"
          className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Movimentos
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link
            to="/movimentos"
            className="mr-4 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Movimento #{movimento.numero_nota_fiscal}
            </h1>
            <p className="text-gray-600 mt-1">
              {movimento.tipo === 'receita' ? 'Receita' : 'Despesa'} • 
              Criado em {formatDateTime(movimento.created_at || '')}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {movimento.status === 'pendente' && (
            <>
              <button
                onClick={handleMarcarComoPago}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Marcar como Pago
              </button>
              <button
                onClick={handleCancelar}
                className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded flex items-center"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancelar
              </button>
            </>
          )}
          <Link
            to={`/movimentos/${movimento.id}/editar`}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Link>
          <button
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status e Valor */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informações Gerais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                {getStatusIcon(movimento.status)}
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(movimento.status)}`}>
                    {movimento.status === 'pago' ? 'Pago' : 
                     movimento.status === 'pendente' ? 'Pendente' : 'Cancelado'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center">
                <DollarSign className={`w-5 h-5 ${movimento.tipo === 'receita' ? 'text-green-500' : 'text-red-500'}`} />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Valor</p>
                  <p className={`text-lg font-bold ${movimento.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(movimento.valor)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Nota Fiscal</p>
                  <p className="text-lg font-semibold text-gray-900">{movimento.numero_nota_fiscal}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  movimento.tipo === 'receita' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {movimento.tipo === 'receita' ? 'Receita' : 'Despesa'}
                </span>
              </div>
            </div>
          </div>

          {/* Datas */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Datas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Data de Emissão</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(movimento.data_emissao)}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-orange-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Data de Vencimento</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(movimento.data_vencimento)}</p>
                </div>
              </div>
              
              {movimento.data_pagamento && (
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Data de Pagamento</p>
                    <p className="text-lg font-semibold text-gray-900">{formatDate(movimento.data_pagamento)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Descrição e Observações */}
          {(movimento.descricao || movimento.observacoes) && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalhes Adicionais</h2>
              
              {movimento.descricao && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500 mb-2">Descrição</p>
                  <p className="text-gray-900">{movimento.descricao}</p>
                </div>
              )}
              
              {movimento.observacoes && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Observações</p>
                  <p className="text-gray-900">{movimento.observacoes}</p>
                </div>
              )}
            </div>
          )}

          {/* Parcelas */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-blue-500" />
                Parcelas ({parcelas.length})
              </h2>
            </div>
            
            <ParcelasList 
              parcelas={parcelas}
              onMarcarPaga={handleMarcarParcelaPaga}
              loading={loadingParcelas}
            />
          </div>

          {/* Classificações - TODO: Implementar */}
          {/* {_classificacoes && _classificacoes.length > 0 && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-2 text-purple-500" />
                Classificações ({_classificacoes.length})
              </h2>
              
              <div className="space-y-2">
                {_classificacoes.map((classificacao, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        classificacao.tipo === 'RECEITA' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {classificacao.tipo}
                      </span>
                      <span className="text-gray-900 font-medium">
                        {classificacao.descricao}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )} */}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Fornecedor/Cliente */}
          {movimento.fornecedor_cliente && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Fornecedor/Cliente
              </h2>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Razão Social</p>
                  <p className="text-gray-900">{movimento.fornecedor_cliente.razao_social}</p>
                </div>
                {movimento.fornecedor_cliente.nome_fantasia && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nome Fantasia</p>
                    <p className="text-gray-900">{movimento.fornecedor_cliente.nome_fantasia}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Documento</p>
                  <p className="text-gray-900">{movimento.fornecedor_cliente.documento}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Tipo</p>
                  <p className="text-gray-900 capitalize">{movimento.fornecedor_cliente.tipo}</p>
                </div>
              </div>
              <Link
                to={`/pessoas/${movimento.fornecedor_cliente.id}`}
                className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                <User className="w-4 h-4 mr-2" />
                Ver Detalhes da Pessoa
              </Link>
            </div>
          )}

          {/* Pessoa Faturada */}
          {movimento.pessoa_faturada && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Pessoa Faturada
              </h2>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Razão Social</p>
                  <p className="text-gray-900">{movimento.pessoa_faturada.razao_social}</p>
                </div>
                {movimento.pessoa_faturada.nome_fantasia && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nome Fantasia</p>
                    <p className="text-gray-900">{movimento.pessoa_faturada.nome_fantasia}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Documento</p>
                  <p className="text-gray-900">{movimento.pessoa_faturada.documento}</p>
                </div>
              </div>
              <Link
                to={`/pessoas/${movimento.pessoa_faturada.id}`}
                className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                <User className="w-4 h-4 mr-2" />
                Ver Detalhes da Pessoa
              </Link>
            </div>
          )}

          {/* Auditoria */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Auditoria</h2>
            <div className="space-y-2">
              {movimento.created_at && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Criado em</p>
                  <p className="text-gray-900">{formatDateTime(movimento.created_at)}</p>
                </div>
              )}
              {movimento.updated_at && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Atualizado em</p>
                  <p className="text-gray-900">{formatDateTime(movimento.updated_at)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovimentoDetalhes;