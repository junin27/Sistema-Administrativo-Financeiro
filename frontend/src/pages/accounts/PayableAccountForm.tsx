import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingDown, Plus, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { payableAccountService } from '../../services/payableAccountService';
import {
  PayableAccountCreateEtapa2,
  InstallmentCreate,
  PayableAccountValidationResponse,
  ValidationResult,
  ExpenseCategory
} from '../../types/payableAccounts';

export function PayableAccountForm() {
  const navigate = useNavigate();
  
  // Estados do formulário
  const [formData, setFormData] = useState<PayableAccountCreateEtapa2>({
    invoice_number: '',
    issue_date: '',
    product_description: '',
    total_amount: 0,
    supplier: {
      company_name: '',
      tax_id: ''
    },
    billed_person: {
      full_name: '',
      document_id: ''
    },
    expense: {
      description: '',
      category: 'MANUTENÇÃO E OPERAÇÃO'
    },
    installments: [
      {
        installment_number: 1,
        due_date: '',
        installment_amount: 0,
        notes: ''
      }
    ]
  });

  const [validationResults, setValidationResults] = useState<PayableAccountValidationResponse | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showBilledPerson, setShowBilledPerson] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Categorias de despesa disponíveis
  const expenseCategories: ExpenseCategory[] = [
    'INSUMOS AGRÍCOLAS',
    'MANUTENÇÃO E OPERAÇÃO',
    'RECURSOS HUMANOS',
    'SERVIÇOS OPERACIONAIS',
    'INFRAESTRUTURA E UTILIDADES',
    'ADMINISTRATIVAS',
    'SEGUROS E PROTEÇÃO',
    'IMPOSTOS E TAXAS',
    'INVESTIMENTOS'
  ];

  // Função para atualizar campos do formulário
  const updateFormData = (path: string, value: any) => {
    setFormData((prev: PayableAccountCreateEtapa2) => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  // Função para adicionar parcela
  const addInstallment = () => {
    const newInstallment: InstallmentCreate = {
      installment_number: formData.installments.length + 1,
      due_date: '',
      installment_amount: 0,
      notes: ''
    };
    
    setFormData((prev: PayableAccountCreateEtapa2) => ({
      ...prev,
      installments: [...prev.installments, newInstallment]
    }));
  };

  // Função para remover parcela
  const removeInstallment = (index: number) => {
    if (formData.installments.length > 1) {
      setFormData((prev: PayableAccountCreateEtapa2) => ({
        ...prev,
        installments: prev.installments.filter((_: InstallmentCreate, i: number) => i !== index)
      }));
    }
  };

  // Função para atualizar parcela
  const updateInstallment = (index: number, field: keyof InstallmentCreate, value: any) => {
    setFormData((prev: PayableAccountCreateEtapa2) => ({
      ...prev,
      installments: prev.installments.map((installment: InstallmentCreate, i: number) => 
        i === index ? { ...installment, [field]: value } : installment
      )
    }));
  };

  // Função para distribuir valor total entre parcelas
  const distributeAmount = () => {
    const amountPerInstallment = formData.total_amount / formData.installments.length;
    
    setFormData((prev: PayableAccountCreateEtapa2) => ({
      ...prev,
      installments: prev.installments.map((installment: InstallmentCreate) => ({
        ...installment,
        installment_amount: Number(amountPerInstallment.toFixed(2))
      }))
    }));
  };

  // Função para validar dados
  const handleValidate = async () => {
    setIsValidating(true);
    setErrorMessage('');
    
    try {
      const results = await payableAccountService.validatePayableAccount(formData);
      setValidationResults(results);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || 'Erro ao validar dados');
    } finally {
      setIsValidating(false);
    }
  };

  // Função para criar conta a pagar
  const handleCreate = async () => {
    setIsCreating(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const result = await payableAccountService.createPayableAccount(formData);
      
      if (result.success) {
        setSuccessMessage(result.message);
        setValidationResults(result.validation_results);
        
        // Limpar formulário após sucesso
        setTimeout(() => {
          navigate('/contas-pagar');
        }, 3000);
      } else {
        setErrorMessage('Erro ao criar conta a pagar');
      }
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || 'Erro ao criar conta a pagar');
    } finally {
      setIsCreating(false);
    }
  };

  // Componente para exibir resultado de validação
  const ValidationResultDisplay = ({ result, label }: { result: ValidationResult; label: string }) => (
    <div className="flex items-center space-x-2 p-3 rounded-lg border">
      {result.exists ? (
        <CheckCircle className="h-5 w-5 text-green-600" />
      ) : (
        <XCircle className="h-5 w-5 text-red-600" />
      )}
      <div>
        <span className="font-medium">{label}:</span>
        <span className={`ml-2 ${result.exists ? 'text-green-600' : 'text-red-600'}`}>
          {result.message}
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate('/contas-pagar')} className="btn-outline p-2">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <TrendingDown className="h-8 w-8 mr-3 text-red-600" />
            Nova Conta a Pagar - Etapa 2
          </h1>
          <p className="text-gray-600 mt-1">
            Registre uma nova conta a pagar com validação automática de fornecedor, faturado e despesa
          </p>
        </div>
      </div>

      {/* Mensagens de sucesso e erro */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800 font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{errorMessage}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dados do Movimento */}
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold mb-4">Dados do Movimento</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número da Nota Fiscal
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.invoice_number}
                  onChange={(e) => updateFormData('invoice_number', e.target.value)}
                  placeholder="Ex: 12345"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Emissão *
                </label>
                <input
                  type="date"
                  className="input"
                  value={formData.issue_date}
                  onChange={(e) => updateFormData('issue_date', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição do Produto/Serviço *
                </label>
                <textarea
                  className="input"
                  rows={3}
                  value={formData.product_description}
                  onChange={(e) => updateFormData('product_description', e.target.value)}
                  placeholder="Descreva o produto ou serviço..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Total *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  value={formData.total_amount}
                  onChange={(e) => updateFormData('total_amount', Number(e.target.value))}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dados do Fornecedor */}
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold mb-4">Dados do Fornecedor</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Razão Social *
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.supplier.company_name}
                  onChange={(e) => updateFormData('supplier.company_name', e.target.value)}
                  placeholder="Ex: IGUAÇU MAQUINAS LTDA"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CNPJ *
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.supplier.tax_id}
                  onChange={(e) => updateFormData('supplier.tax_id', e.target.value)}
                  placeholder="Ex: 11.111.111/0001-00"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dados da Pessoa Faturada */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Dados da Pessoa Faturada</h3>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showBilledPerson}
                  onChange={(e) => setShowBilledPerson(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Incluir pessoa faturada</span>
              </label>
            </div>
            
            {showBilledPerson && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.billed_person?.full_name || ''}
                    onChange={(e) => updateFormData('billed_person.full_name', e.target.value)}
                    placeholder="Ex: BELTRANO DA SILVA"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CPF
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.billed_person?.document_id || ''}
                    onChange={(e) => updateFormData('billed_person.document_id', e.target.value)}
                    placeholder="Ex: 999.999.999-99"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dados da Despesa */}
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold mb-4">Classificação da Despesa</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição *
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.expense.description}
                  onChange={(e) => updateFormData('expense.description', e.target.value)}
                  placeholder="Ex: MANUTENÇÃO E OPERAÇÃO"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  className="input"
                  value={formData.expense.category}
                  onChange={(e) => updateFormData('expense.category', e.target.value)}
                >
                  {expenseCategories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Parcelas */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Parcelas</h3>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={distributeAmount}
                className="btn-outline text-sm"
                disabled={formData.total_amount <= 0}
              >
                Distribuir Valor
              </button>
              <button
                type="button"
                onClick={addInstallment}
                className="btn-primary text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Parcela
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {formData.installments.map((installment: InstallmentCreate, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Parcela {installment.installment_number}</h4>
                  {formData.installments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInstallment(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Vencimento *
                    </label>
                    <input
                      type="date"
                      className="input"
                      value={installment.due_date}
                      onChange={(e) => updateInstallment(index, 'due_date', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor da Parcela *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input"
                      value={installment.installment_amount}
                      onChange={(e) => updateInstallment(index, 'installment_amount', Number(e.target.value))}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observações
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={installment.notes || ''}
                      onChange={(e) => updateInstallment(index, 'notes', e.target.value)}
                      placeholder="Observações..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Resumo das parcelas */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Total das Parcelas:</span>
              <span className="font-medium">
                R$ {formData.installments.reduce((sum, inst) => sum + inst.installment_amount, 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Valor Total:</span>
              <span className="font-medium">R$ {formData.total_amount.toFixed(2)}</span>
            </div>
            {Math.abs(formData.installments.reduce((sum, inst) => sum + inst.installment_amount, 0) - formData.total_amount) > 0.01 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Diferença:</span>
                <span className="font-medium">
                  R$ {(formData.total_amount - formData.installments.reduce((sum, inst) => sum + inst.installment_amount, 0)).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resultados da Validação */}
      {validationResults && (
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold mb-4">Resultados da Validação</h3>
            
            <div className="space-y-3">
              <ValidationResultDisplay 
                result={validationResults.supplier_validation} 
                label="Fornecedor" 
              />
              
              {validationResults.billed_person_validation && (
                <ValidationResultDisplay 
                  result={validationResults.billed_person_validation} 
                  label="Pessoa Faturada" 
                />
              )}
              
              <ValidationResultDisplay 
                result={validationResults.expense_validation} 
                label="Despesa" 
              />
            </div>
          </div>
        </div>
      )}

      {/* Botões de Ação */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={handleValidate}
          disabled={isValidating}
          className="btn-outline"
        >
          {isValidating ? 'Validando...' : 'Validar Dados'}
        </button>
        
        <button
          type="button"
          onClick={handleCreate}
          disabled={isCreating || !formData.supplier.company_name || !formData.supplier.tax_id || !formData.expense.description}
          className="btn-primary"
        >
          {isCreating ? 'Criando...' : 'Criar Conta a Pagar'}
        </button>
      </div>
    </div>
  );
}
