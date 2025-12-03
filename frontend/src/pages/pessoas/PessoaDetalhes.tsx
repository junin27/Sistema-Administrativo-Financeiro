import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { 
  User, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Calendar,
  Edit,
  ArrowLeft,
  Activity,
  DollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import pessoasService, { Pessoa } from '../../services/pessoasService';
import movimentosService, { MovimentoConta } from '../../services/movimentosService';

const PessoaDetalhes: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [pessoa, setPessoa] = useState<Pessoa | null>(null);
  const [movimentos, setMovimentos] = useState<MovimentoConta[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMovimentos, setLoadingMovimentos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dados' | 'movimentos' | 'historico'>('dados');

  useEffect(() => {
    if (id) {
      loadPessoa(parseInt(id));
      loadMovimentos(parseInt(id));
    }
  }, [id]);

  const loadPessoa = async (pessoaId: number) => {
    try {
      setLoading(true);
      const pessoaData = await pessoasService.getById(pessoaId);
      setPessoa(pessoaData);
    } catch (err) {
      const error = err as AxiosError<{ detail: string }>;
      setError(error.response?.data?.detail || 'Erro ao carregar pessoa');
    } finally {
      setLoading(false);
    }
  };

  const loadMovimentos = async (pessoaId: number) => {
    try {
      setLoadingMovimentos(true);
      // Buscar movimentos onde a pessoa é fornecedor/cliente
      const movimentosFornecedor = await movimentosService.getAll({
        page: 1,
        size: 100,
        filters: { fornecedor_id: pessoaId }
      });

      // Buscar movimentos onde a pessoa é faturada
      const movimentosFaturado = await movimentosService.getAll({
        page: 1,
        size: 100,
        filters: { faturado_id: pessoaId }
      });

      // Combinar e remover duplicatas
      const todosMovimentos = [
        ...movimentosFornecedor.items,
        ...movimentosFaturado.items
      ];

      // Remover duplicatas baseado no ID
      const movimentosUnicos = todosMovimentos.filter((movimento, index, self) =>
        index === self.findIndex(m => m.idMovimentoContas === movimento.idMovimentoContas)
      );

      // Ordenar por data de emissão (mais recente primeiro)
      movimentosUnicos.sort((a, b) => 
        new Date(b.dataemissao).getTime() - new Date(a.dataemissao).getTime()
      );

      setMovimentos(movimentosUnicos);
    } catch (err) {
      // console.error('Erro ao carregar movimentos:', err);
    } finally {
      setLoadingMovimentos(false);
    }
  };

  const formatDocument = (documento: string): string => {
    const cleanDoc = documento.replace(/\D/g, '');
    
    if (cleanDoc.length === 11) {
      // CPF
      return cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (cleanDoc.length === 14) {
      // CNPJ
      return cleanDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return documento;
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

  const getTipoColor = (tipo: string) => {
    return tipo === 'RECEBER' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const calcularTotais = () => {
    const receitas = movimentos.filter(m => m.tipo === 'RECEBER');
    const despesas = movimentos.filter(m => m.tipo === 'PAGAR');
    
    const totalReceitas = receitas.reduce((sum, m) => sum + m.valortotal, 0);
    const totalDespesas = despesas.reduce((sum, m) => sum + m.valortotal, 0);
    const saldo = totalReceitas - totalDespesas;

    return {
      totalReceitas,
      totalDespesas,
      saldo,
      quantidadeReceitas: receitas.length,
      quantidadeDespesas: despesas.length
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !pessoa) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error || 'Pessoa não encontrada'}</div>
          <button
            onClick={() => navigate('/pessoas')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Voltar para Lista
          </button>
        </div>
      </div>
    );
  }

  const totais = calcularTotais();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/pessoas')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              {pessoa.tipo === 'FORNECEDOR' ? (
                <Building2 className="h-8 w-8 mr-3 text-blue-600" />
              ) : (
                <User className="h-8 w-8 mr-3 text-green-600" />
              )}
              {pessoa.razaosocial}
            </h1>
            <p className="text-gray-600 mt-1">
              {pessoa.tipo === 'FORNECEDOR' ? 'Fornecedor' : 'Cliente'} • {formatDocument(pessoa.documento)}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link
            to={`/pessoas/${pessoa.idPessoas}/editar`}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Link>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
          pessoa.status === 'ATIVO' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {pessoa.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('dados')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dados'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Dados Pessoais
          </button>
          <button
            onClick={() => setActiveTab('movimentos')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'movimentos'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Activity className="h-4 w-4 inline mr-2" />
            Movimentos ({movimentos.length})
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'historico'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Calendar className="h-4 w-4 inline mr-2" />
            Histórico
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'dados' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informações Básicas */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informações Básicas</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Documento</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">{formatDocument(pessoa.documento)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <p className="mt-1 text-sm text-gray-900 capitalize">{pessoa.tipo}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Razão Social</label>
                <p className="mt-1 text-sm text-gray-900">{pessoa.razaosocial}</p>
              </div>
              {pessoa.fantasia && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome Fantasia</label>
                  <p className="mt-1 text-sm text-gray-900">{pessoa.fantasia}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="mt-1 text-sm text-gray-900 capitalize">{pessoa.status}</p>
              </div>
            </div>
          </div>

          {/* Informações de Contato */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contato</h2>
            <div className="space-y-4">
              {pessoa.telefone && (
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Telefone</label>
                    <p className="text-sm text-gray-900">{pessoa.telefone}</p>
                  </div>
                </div>
              )}
              {pessoa.email && (
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900">{pessoa.email}</p>
                  </div>
                </div>
              )}
              {pessoa.endereco && (
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Endereço</label>
                    <p className="text-sm text-gray-900">{pessoa.endereco}</p>
                  </div>
                </div>
              )}
              {!pessoa.telefone && !pessoa.email && !pessoa.endereco && (
                <p className="text-sm text-gray-500 italic">Nenhuma informação de contato cadastrada</p>
              )}
            </div>
          </div>

          {/* Resumo Financeiro */}
          <div className="bg-white shadow-md rounded-lg p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumo Financeiro</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-600">Receitas</p>
                    <p className="text-lg font-semibold text-green-900">{formatCurrency(totais.totalReceitas)}</p>
                    <p className="text-xs text-green-600">{totais.quantidadeReceitas} transações</p>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <TrendingDown className="h-8 w-8 text-red-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-600">Despesas</p>
                    <p className="text-lg font-semibold text-red-900">{formatCurrency(totais.totalDespesas)}</p>
                    <p className="text-xs text-red-600">{totais.quantidadeDespesas} transações</p>
                  </div>
                </div>
              </div>
              <div className={`p-4 rounded-lg ${totais.saldo >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                <div className="flex items-center">
                  <DollarSign className={`h-8 w-8 ${totais.saldo >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${totais.saldo >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Saldo</p>
                    <p className={`text-lg font-semibold ${totais.saldo >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                      {formatCurrency(totais.saldo)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-gray-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Total Movimentos</p>
                    <p className="text-lg font-semibold text-gray-900">{movimentos.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Informações do Sistema */}
          <div className="bg-white shadow-md rounded-lg p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informações do Sistema</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pessoa.created_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data de Criação</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(pessoa.created_at)}</p>
                </div>
              )}
              {pessoa.updated_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Última Atualização</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(pessoa.updated_at)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'movimentos' && (
        <div className="space-y-6">
          {loadingMovimentos ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
            </div>
          ) : movimentos.length > 0 ? (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nota Fiscal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Emissão
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vencimento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {movimentos.map((movimento) => (
                    <tr key={movimento.idMovimentoContas} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movimento.numeronotafiscal}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoColor(movimento.tipo)}`}>
                          {movimento.tipo === 'RECEBER' ? 'Receber' : 'Pagar'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {formatCurrency(movimento.valortotal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(movimento.dataemissao)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movimento.datavencimento ? formatDate(movimento.datavencimento) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(movimento.status)}`}>
                          {movimento.status === 'FECHADO' ? 'Fechado' : movimento.status === 'ABERTO' ? 'Aberto' : 'Cancelado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-white shadow-md rounded-lg">
              <Activity className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum movimento encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                Esta pessoa ainda não possui movimentos financeiros registrados.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'historico' && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Histórico de Alterações</h2>
          <div className="space-y-4">
            {pessoa.created_at && (
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Pessoa criada</p>
                  <p className="text-sm text-gray-500">{formatDate(pessoa.created_at)}</p>
                </div>
              </div>
            )}
            {pessoa.updated_at && pessoa.updated_at !== pessoa.created_at && (
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Edit className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Última atualização</p>
                  <p className="text-sm text-gray-500">{formatDate(pessoa.updated_at)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PessoaDetalhes;