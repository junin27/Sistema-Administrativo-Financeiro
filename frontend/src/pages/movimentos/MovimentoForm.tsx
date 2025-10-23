import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import movimentosService, { MovimentoContaCreate, MovimentoContaUpdate } from '../../services/movimentosService';
import pessoasService, { Pessoa } from '../../services/pessoasService';

const MovimentoForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [formData, setFormData] = useState<MovimentoContaCreate>({
    numero_nota_fiscal: '',
    fornecedor_cliente_id: 0,
    tipo: 'despesa',
    valor: 0,
    data_emissao: '',
    data_vencimento: '',
    descricao: '',
    status: 'pendente'
  });

  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingPessoas, setLoadingPessoas] = useState(true);

  useEffect(() => {
    loadPessoas();
    if (isEditing) {
      loadMovimento();
    }
  }, [id]);

  const loadPessoas = async () => {
    try {
      setLoadingPessoas(true);
      const response = await pessoasService.getAll({ page: 1, size: 100 });
      setPessoas(response.items);
    } catch (err: any) {
      setError('Erro ao carregar pessoas');
    } finally {
      setLoadingPessoas(false);
    }
  };

  const loadMovimento = async () => {
    try {
      setLoading(true);
      const movimento = await movimentosService.getById(parseInt(id!));
      setFormData({
        numero_nota_fiscal: movimento.numero_nota_fiscal,
        fornecedor_cliente_id: movimento.fornecedor_cliente_id,
        tipo: movimento.tipo,
        valor: movimento.valor,
        data_emissao: movimento.data_emissao.split('T')[0], // Format for input date
        data_vencimento: movimento.data_vencimento.split('T')[0], // Format for input date
        descricao: movimento.descricao || '',
        status: movimento.status
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao carregar movimento');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'valor' || name === 'fornecedor_cliente_id' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações
    if (!formData.numero_nota_fiscal.trim()) {
      setError('Número da nota fiscal é obrigatório');
      return;
    }

    if (!formData.fornecedor_cliente_id) {
      setError('Fornecedor/Cliente é obrigatório');
      return;
    }

    if (formData.valor <= 0) {
      setError('Valor deve ser maior que zero');
      return;
    }

    if (!formData.data_emissao) {
      setError('Data de emissão é obrigatória');
      return;
    }

    if (!formData.data_vencimento) {
      setError('Data de vencimento é obrigatória');
      return;
    }

    // Verificar se data de vencimento não é anterior à data de emissão
    if (new Date(formData.data_vencimento) < new Date(formData.data_emissao)) {
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
    } catch (err: any) {
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          setError(err.response.data.detail);
        } else if (Array.isArray(err.response.data.detail)) {
          setError(err.response.data.detail.map((e: any) => e.msg).join(', '));
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
      valor: floatValue || 0
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
                <label htmlFor="numero_nota_fiscal" className="block text-sm font-medium text-gray-700 mb-1">
                  Número da Nota Fiscal *
                </label>
                <input
                  type="text"
                  id="numero_nota_fiscal"
                  name="numero_nota_fiscal"
                  value={formData.numero_nota_fiscal}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="fornecedor_cliente_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Fornecedor/Cliente *
                </label>
                <select
                  id="fornecedor_cliente_id"
                  name="fornecedor_cliente_id"
                  value={formData.fornecedor_cliente_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione um fornecedor/cliente</option>
                  {pessoas.map((pessoa) => (
                    <option key={pessoa.id} value={pessoa.id}>
                      {pessoa.razao_social || pessoa.nome_fantasia} - {pessoa.documento}
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
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
                </select>
              </div>

              <div>
                <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-1">
                  Valor *
                </label>
                <input
                  type="text"
                  id="valor"
                  name="valor"
                  value={formatCurrency(formData.valor.toString().replace('.', ''))}
                  onChange={handleCurrencyChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0,00"
                  required
                />
              </div>

              <div>
                <label htmlFor="data_emissao" className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Emissão *
                </label>
                <input
                  type="date"
                  id="data_emissao"
                  name="data_emissao"
                  value={formData.data_emissao}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="data_vencimento" className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Vencimento *
                </label>
                <input
                  type="date"
                  id="data_vencimento"
                  name="data_vencimento"
                  value={formData.data_vencimento}
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
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="cancelado">Cancelado</option>
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
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descrição adicional do movimento"
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