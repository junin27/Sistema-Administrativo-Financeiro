import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import movimentosService, { MovimentoContaCreate, MovimentoContaUpdate } from '../../services/movimentosService';
import pessoasService, { Pessoa } from '../../services/pessoasService';

const MovimentoForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [formData, setFormData] = useState<MovimentoContaCreate>({
    numeronotafiscal: '',
    Pessoas_idFornecedorCliente: 0,
    Pessoas_idfaturado: 0,
    tipo: 'PAGAR',
    valortotal: 0,
    dataemissao: '',
    datavencimento: '',
    descricao: '',
    observacoes: '',
    status: 'ABERTO'
  });

  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingPessoas, setLoadingPessoas] = useState(true);

  const loadPessoas = useCallback(async () => {
    try {
      setLoadingPessoas(true);
      const response = await pessoasService.getAll({ page: 1, size: 100 });
      setPessoas(response.items);
    } catch (err) {
      setError('Erro ao carregar pessoas');
    } finally {
      setLoadingPessoas(false);
    }
  }, []);

  const loadMovimento = useCallback(async () => {
    try {
      setLoading(true);
      const movimento = await movimentosService.getById(parseInt(id!));
      setFormData({
        numeronotafiscal: movimento.numeronotafiscal,
        Pessoas_idFornecedorCliente: movimento.Pessoas_idFornecedorCliente,
        Pessoas_idfaturado: movimento.Pessoas_idfaturado,
        tipo: movimento.tipo,
        valortotal: movimento.valortotal,
        dataemissao: movimento.dataemissao.split('T')[0],
        datavencimento: movimento.datavencimento ? movimento.datavencimento.split('T')[0] : '',
        descricao: movimento.descricao || '',
        observacoes: movimento.observacoes || '',
        status: movimento.status
      });
    } catch (err) {
      const error = err as AxiosError<{ detail: string }>;
      setError(error.response?.data?.detail || 'Erro ao carregar movimento');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPessoas();
    if (isEditing) {
      loadMovimento();
    }
  }, [id, isEditing, loadPessoas, loadMovimento]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'valortotal' || name === 'Pessoas_idFornecedorCliente' || name === 'Pessoas_idfaturado' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações
    if (!formData.numeronotafiscal.trim()) {
      setError('Número da nota fiscal é obrigatório');
      return;
    }

    if (!formData.Pessoas_idFornecedorCliente) {
      setError('Fornecedor/Cliente é obrigatório');
      return;
    }

    if (formData.valortotal <= 0) {
      setError('Valor deve ser maior que zero');
      return;
    }

    if (!formData.dataemissao) {
      setError('Data de emissão é obrigatória');
      return;
    }

    if (!formData.datavencimento) {
      setError('Data de vencimento é obrigatória');
      return;
    }

    // Verificar se data de vencimento não é anterior à data de emissão
    if (new Date(formData.datavencimento) < new Date(formData.dataemissao)) {
      setError('Data de vencimento não pode ser anterior à data de emissão');
      return;
    }

    try {
      setLoading(true);
      
      if (isEditing) {
        const updateData: MovimentoContaUpdate = { ...formData };
        await movimentosService.update(parseInt(id!), updateData);
      } else {
        await movimentosService.create(formData);
      }
      
      navigate('/movimentos');
    } catch (err) {
      const error = err as AxiosError<{ detail: string | { msg: string }[] }>;
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          setError(error.response.data.detail);
        } else if (Array.isArray(error.response.data.detail)) {
          setError(error.response.data.detail.map((e: { msg: string }) => e.msg).join(', '));
        }
      } else {
        setError('Erro ao salvar movimento');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    // Remove tudo que não é dígito
    const numericValue = value.replace(/\D/g, '');
    
    // Converte para número e divide por 100 para ter centavos
    const floatValue = parseFloat(numericValue) / 100;
    
    // Formata como moeda brasileira
    return floatValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const numericValue = value.replace(/\D/g, '');
    const floatValue = parseFloat(numericValue) / 100;
    
    setFormData(prev => ({
      ...prev,
      valortotal: floatValue || 0
    }));
  };

  if (loadingPessoas) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Editar Movimento' : 'Novo Movimento'}
          </h1>
          <button
            onClick={() => navigate('/movimentos')}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Voltar
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="numeronotafiscal" className="block text-sm font-medium text-gray-700 mb-1">
                  Número da Nota Fiscal *
                </label>
                <input
                  type="text"
                  id="numeronotafiscal"
                  name="numeronotafiscal"
                  value={formData.numeronotafiscal}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="Pessoas_idFornecedorCliente" className="block text-sm font-medium text-gray-700 mb-1">
                  Fornecedor/Cliente *
                </label>
                <select
                  id="Pessoas_idFornecedorCliente"
                  name="Pessoas_idFornecedorCliente"
                  value={formData.Pessoas_idFornecedorCliente}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione um fornecedor/cliente</option>
                  {pessoas.map((pessoa) => (
                    <option key={pessoa.idPessoas} value={pessoa.idPessoas}>
                      {pessoa.razaosocial || pessoa.fantasia} - {pessoa.documento}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="Pessoas_idfaturado" className="block text-sm font-medium text-gray-700 mb-1">
                  Faturado (Opcional)
                </label>
                <select
                  id="Pessoas_idfaturado"
                  name="Pessoas_idfaturado"
                  value={formData.Pessoas_idfaturado}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>Selecione um faturado (opcional)</option>
                  {pessoas.map((pessoa) => (
                    <option key={pessoa.idPessoas} value={pessoa.idPessoas}>
                      {pessoa.razaosocial || pessoa.fantasia} - {pessoa.documento}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo *
                </label>
                <select
                  id="tipo"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="RECEBER">Receber (Receita)</option>
                  <option value="PAGAR">Pagar (Despesa)</option>
                </select>
              </div>

              <div>
                <label htmlFor="valortotal" className="block text-sm font-medium text-gray-700 mb-1">
                  Valor *
                </label>
                <input
                  type="text"
                  id="valortotal"
                  name="valortotal"
                  value={formatCurrency(formData.valortotal.toString().replace('.', ''))}
                  onChange={handleCurrencyChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0,00"
                  required
                />
              </div>

              <div>
                <label htmlFor="dataemissao" className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Emissão *
                </label>
                <input
                  type="date"
                  id="dataemissao"
                  name="dataemissao"
                  value={formData.dataemissao}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="datavencimento" className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Vencimento *
                </label>
                <input
                  type="date"
                  id="datavencimento"
                  name="datavencimento"
                  value={formData.datavencimento}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ABERTO">Aberto</option>
                  <option value="FECHADO">Fechado</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descrição do movimento"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  id="observacoes"
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Observações adicionais"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={() => navigate('/movimentos')}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MovimentoForm;
