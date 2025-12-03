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
  Clock,
  Plus,
  Tag
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import movimentosService, { MovimentoConta } from '../../services/movimentosService';
import parcelasService, { GerarParcelasOptions } from '../../services/parcelasService';
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
  const [showGerarParcelas, setShowGerarParcelas] = useState(false);
  const [numeroParcelas, setNumeroParcelas] = useState(1);
  const [primeiroVencimento, setPrimeiroVencimento] = useState<string>('');
  const [intervaloMeses, setIntervaloMeses] = useState<number>(1);

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
      if (response.classificacoes) {
        _setClassificacoes(response.classificacoes);
      }
    } catch (error) {
      const err = error as AxiosError<{ detail: string }>;
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
    } catch {
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
    } catch {
      toast.error('Erro ao marcar parcela como paga');
    }
  };

  const handleGerarParcelas = async () => {
    if (!id) return;
    try {
      const opts: GerarParcelasOptions = {};
      if (primeiroVencimento) opts.primeiro_vencimento = primeiroVencimento;
      if (intervaloMeses) opts.intervalo_meses = intervaloMeses;
      await parcelasService.gerarParcelas(parseInt(id), numeroParcelas, opts);
      toast.success('Parcelas geradas com sucesso!');
      setShowGerarParcelas(false);
      loadParcelas(parseInt(id));
    } catch (error) {
      const err = error as AxiosError<{ detail: string }>;
      toast.error(err.response?.data?.detail || 'Erro ao gerar parcelas');
    }
  };

  const handleDelete = async () => {
    if (!movimento?.idMovimentoContas) return;
    
    if (window.confirm('Tem certeza que deseja excluir este movimento?')) {
      try {
        await movimentosService.delete(movimento.idMovimentoContas);
        navigate('/movimentos');
      } catch (error) {
        const err = error as AxiosError<{ detail: string }>;
        setError(err.response?.data?.detail || 'Erro ao excluir movimento');
      }
    }
  };

  const handleMarcarComoPago = async () => {
    if (!movimento?.idMovimentoContas) return;
    
    try {
      await movimentosService.marcarComoPago(movimento.idMovimentoContas);
      loadMovimento(movimento.idMovimentoContas);
    } catch (error) {
      const err = error as AxiosError<{ detail: string }>;
      setError(err.response?.data?.detail || 'Erro ao marcar como pago');
    }
  };

  const handleCancelar = async () => {
    if (!movimento?.idMovimentoContas) return;
    
    if (window.confirm('Tem certeza que deseja cancelar este movimento?')) {
      try {
        await movimentosService.cancelar(movimento.idMovimentoContas);
        loadMovimento(movimento.idMovimentoContas);
      } catch (error) {
        const err = error as AxiosError<{ detail: string }>;
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
      case 'FECHADO':
        return 'bg-green-100 text-green-800';
      case 'ABERTO':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELADO':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'FECHADO':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'ABERTO':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'CANCELADO':
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
              Movimento #{movimento.numeronotafiscal}
            </h1>
            <p className="text-gray-600 mt-1">
              {movimento.tipo === 'RECEBER' ? 'Receber (Receita)' : 'Pagar (Despesa)'} • 
              Criado em {formatDateTime(movimento.created_at || '')}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {movimento.status === 'ABERTO' && (
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
            to={`/movimentos/${movimento.idMovimentoContas}/editar`}
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
                    {movimento.status === 'FECHADO' ? 'Fechado' : 
                     movimento.status === 'ABERTO' ? 'Aberto' : 'Cancelado'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center">
                <DollarSign className={`w-5 h-5 ${movimento.tipo === 'RECEBER' ? 'text-green-500' : 'text-red-500'}`} />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Valor</p>
                  <p className={`text-lg font-bold ${movimento.tipo === 'RECEBER' ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(movimento.valortotal)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Nota Fiscal</p>
                  <p className="text-lg font-semibold text-gray-900">{movimento.numeronotafiscal}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  movimento.tipo === 'RECEBER' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {movimento.tipo === 'RECEBER' ? 'Receber (Receita)' : 'Pagar (Despesa)'}
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
                  <p className="text-lg font-semibold text-gray-900">{formatDate(movimento.dataemissao)}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-orange-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Data de Vencimento</p>
                  <p className="text-lg font-semibold text-gray-900">{movimento.datavencimento ? formatDate(movimento.datavencimento) : '-'}</p>
                </div>
              </div>
              
              {movimento.datapagamento && (
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Data de Pagamento</p>
                    <p className="text-lg font-semibold text-gray-900">{formatDate(movimento.datapagamento)}</p>
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
              <button
                onClick={() => setShowGerarParcelas(true)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Gerar Parcelas
              </button>
            </div>
            
            <ParcelasList 
              parcelas={parcelas}
              onMarcarPaga={handleMarcarParcelaPaga}
              loading={loadingParcelas}
            />

            {showGerarParcelas && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                  <h3 className="text-lg font-semibold mb-4">Gerar Parcelas</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Número de Parcelas</label>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={numeroParcelas}
                        onChange={(e) => setNumeroParcelas(parseInt(e.target.value || '1'))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Primeiro Vencimento</label>
                      <input
                        type="date"
                        value={primeiroVencimento}
                        onChange={(e) => setPrimeiroVencimento(e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Intervalo (meses)</label>
                      <input
                        type="number"
                        min={1}
                        max={24}
                        value={intervaloMeses}
                        onChange={(e) => setIntervaloMeses(parseInt(e.target.value || '1'))}
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      onClick={() => setShowGerarParcelas(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleGerarParcelas}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Gerar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Classificações */}
          {_classificacoes && _classificacoes.length > 0 && (
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
          )}
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
                  <p className="text-gray-900">{movimento.fornecedor_cliente.razaosocial}</p>
                </div>
                {movimento.fornecedor_cliente.fantasia && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nome Fantasia</p>
                    <p className="text-gray-900">{movimento.fornecedor_cliente.fantasia}</p>
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
                to={`/pessoas/${movimento.fornecedor_cliente.idPessoas}`}
                className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                <User className="w-4 h-4 mr-2" />
                Ver Detalhes da Pessoa
              </Link>
            </div>
          )}

          {/* Pessoa Faturada */}
          {movimento.faturado && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Pessoa Faturada
              </h2>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Razão Social</p>
                  <p className="text-gray-900">{movimento.faturado.razaosocial}</p>
                </div>
                {movimento.faturado.fantasia && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nome Fantasia</p>
                    <p className="text-gray-900">{movimento.faturado.fantasia}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Documento</p>
                  <p className="text-gray-900">{movimento.faturado.documento}</p>
                </div>
              </div>
              <Link
                to={`/pessoas/${movimento.faturado.idPessoas}`}
                className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                <User className="w-4 h-4 mr-2" />
                Ver Detalhes da Pessoa
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovimentoDetalhes;
