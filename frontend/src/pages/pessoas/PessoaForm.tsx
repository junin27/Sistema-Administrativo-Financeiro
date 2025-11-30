import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import pessoasService, { PessoaCreate, PessoaUpdate } from '../../services/pessoasService';

const PessoaForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<PessoaCreate>({
    documento: '',
    tipo: 'FORNECEDOR',
    razaosocial: '',
    fantasia: '',
    endereco: '',
    telefone: '',
    email: '',
    status: 'ATIVO'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && id) {
      loadPessoa(parseInt(id));
    }
  }, [id, isEditing]);

  const loadPessoa = async (pessoaId: number) => {
    try {
      setLoading(true);
      const pessoa = await pessoasService.getById(pessoaId);
      setFormData({
        documento: pessoa.documento,
        tipo: pessoa.tipo,
        razaosocial: pessoa.razaosocial,
        fantasia: pessoa.fantasia || '',
        endereco: pessoa.endereco || '',
        telefone: pessoa.telefone || '',
        email: pessoa.email || '',
        status: pessoa.status
      });
    } catch (err) {
      const error = err as AxiosError<{ detail: string }>;
      setError(error.response?.data?.detail || 'Erro ao carregar pessoa');
    } finally {
      setLoading(false);
    }
  };

  const validateDocument = (documento: string): boolean => {
    // Remove caracteres não numéricos (caso ainda tenha algum)
    const cleanDoc = documento.replace(/\D/g, '');
    
    if (cleanDoc.length === 11) {
      // Validação CPF
      // Verifica se todos os dígitos são iguais
      if (/^(\d)\1{10}$/.test(cleanDoc)) {
        setDocumentError('CPF inválido');
        return false;
      }
      
      // Validação do primeiro dígito verificador
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(cleanDoc.charAt(i)) * (10 - i);
      }
      let remainder = sum % 11;
      let firstDigit = remainder < 2 ? 0 : 11 - remainder;
      
      if (firstDigit !== parseInt(cleanDoc.charAt(9))) {
        setDocumentError('CPF inválido');
        return false;
      }
      
      // Validação do segundo dígito verificador
      sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += parseInt(cleanDoc.charAt(i)) * (11 - i);
      }
      remainder = sum % 11;
      let secondDigit = remainder < 2 ? 0 : 11 - remainder;
      
      if (secondDigit !== parseInt(cleanDoc.charAt(10))) {
        setDocumentError('CPF inválido');
        return false;
      }
    } else if (cleanDoc.length === 14) {
      // Validação CNPJ
      if (/^(\d)\1{13}$/.test(cleanDoc)) {
        setDocumentError('CNPJ inválido');
        return false;
      }
      
      let length = cleanDoc.length - 2;
      let numbers = cleanDoc.substring(0, length);
      const digits = cleanDoc.substring(length);
      let sum = 0;
      let pos = length - 7;
      
      for (let i = length; i >= 1; i--) {
        sum += parseInt(numbers.charAt(length - i)) * pos--;
        if (pos < 2) pos = 9;
      }
      
      let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
      if (result !== parseInt(digits.charAt(0))) {
        setDocumentError('CNPJ inválido');
        return false;
      }
      
      length = length + 1;
      numbers = cleanDoc.substring(0, length);
      sum = 0;
      pos = length - 7;
      
      for (let i = length; i >= 1; i--) {
        sum += parseInt(numbers.charAt(length - i)) * pos--;
        if (pos < 2) pos = 9;
      }
      
      result = sum % 11 < 2 ? 0 : 11 - sum % 11;
      if (result !== parseInt(digits.charAt(1))) {
        setDocumentError('CNPJ inválido');
        return false;
      }
    } else {
      setDocumentError('Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)');
      return false;
    }
    
    setDocumentError(null);
    return true;
  };

  const formatDocument = (value: string): string => {
    const cleanValue = value.replace(/\D/g, '');
    
    if (cleanValue.length <= 11) {
      // CPF
      return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
      // CNPJ
      return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
  };

  const handleInputChange = (field: keyof PessoaCreate, value: string) => {
    if (field === 'documento') {
      // Remove caracteres não numéricos para armazenar
      const cleanValue = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [field]: cleanValue }));
      // Valida apenas quando tiver 11 ou 14 dígitos completos
      if (cleanValue.length === 11 || cleanValue.length === 14) {
        validateDocument(cleanValue);
      } else if (cleanValue.length > 0 && cleanValue.length < 11) {
        // Se está digitando CPF mas ainda não completou, limpa o erro
        setDocumentError(null);
      } else if (cleanValue.length > 11 && cleanValue.length < 14) {
        // Se está digitando CNPJ mas ainda não completou, limpa o erro
        setDocumentError(null);
      } else if (cleanValue.length === 0) {
        // Se limpou o campo, remove o erro
        setDocumentError(null);
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateDocument(formData.documento)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isEditing && id) {
        await pessoasService.update(parseInt(id), formData as PessoaUpdate);
      } else {
        await pessoasService.create(formData);
      }

      navigate('/pessoas');
    } catch (err) {
      const error = err as AxiosError<{ detail: string }>;
      setError(error.response?.data?.detail || 'Erro ao salvar pessoa');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
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
            {isEditing ? 'Editar Pessoa' : 'Nova Pessoa'}
          </h1>
          <button
            onClick={() => navigate('/pessoas')}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Documento *
                </label>
                <input
                  type="text"
                  value={formatDocument(formData.documento)}
                  onChange={(e) => handleInputChange('documento', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    documentError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="CPF ou CNPJ"
                  required
                />
                {documentError && (
                  <p className="mt-1 text-sm text-red-600">{documentError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo *
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => handleInputChange('tipo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="FORNECEDOR">Fornecedor</option>
                  <option value="CLIENTE">Cliente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="ATIVO">Ativo</option>
                  <option value="INATIVO">Inativo</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razão Social *
                </label>
                <input
                  type="text"
                  value={formData.razaosocial}
                  onChange={(e) => handleInputChange('razaosocial', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  value={formData.fantasia}
                  onChange={(e) => handleInputChange('fantasia', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço
                </label>
                <textarea
                  value={formData.endereco}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="text"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={() => navigate('/pessoas')}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || Boolean(documentError)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
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

export default PessoaForm;