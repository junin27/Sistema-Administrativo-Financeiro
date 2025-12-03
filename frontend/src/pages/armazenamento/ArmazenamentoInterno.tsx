import React, { useState } from 'react';
import { HardDrive, Database, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import internalStorageService from '@/services/internalStorageService';
import toast from 'react-hot-toast';

export const ArmazenamentoInterno: React.FC = () => {
  const [loadingInsert, setLoadingInsert] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleInsertData = async () => {
    if (loadingInsert) return;
    
    try {
      setLoadingInsert(true);
      const response = await internalStorageService.insertData();
      
      toast.success(
        `Dados inseridos com sucesso! ` +
        `Pessoas: ${response.inserted?.pessoas || 0}, ` +
        `Classificações: ${response.inserted?.classificacao || 0}, ` +
        `Movimentos: ${response.inserted?.movimento_contas || 0}, ` +
        `Parcelas: ${response.inserted?.parcelas_contas || 0}`
      );
    } catch (error) {
      toast.error('Erro ao inserir dados fictícios');
      console.error('Erro ao inserir dados:', error);
    } finally {
      setLoadingInsert(false);
    }
  };

  const handleResetData = async () => {
    if (loadingReset) return;
    
    try {
      setLoadingReset(true);
      const response = await internalStorageService.resetData();
      
      toast.success(
        `Dados resetados com sucesso! ` +
        `Pessoas: ${response.deleted?.pessoas || 0}, ` +
        `Classificações: ${response.deleted?.classificacao || 0}, ` +
        `Movimentos: ${response.deleted?.movimento_contas || 0}, ` +
        `Parcelas: ${response.deleted?.parcelas_contas || 0}`
      );
      setShowConfirmReset(false);
    } catch (error) {
      toast.error('Erro ao resetar dados');
      console.error('Erro ao resetar dados:', error);
    } finally {
      setLoadingReset(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-indigo-600" />
            Armazenamento Interno
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie dados fictícios para testes do sistema. Insira 200 registros em cada tabela ou limpe todos os dados.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Inserir Dados */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Database className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Inserir Dados</h2>
                <p className="text-sm text-gray-500">Adiciona 200 registros fictícios</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Serão inseridos 200 registros fictícios e realistas em cada uma das 5 tabelas principais:
              <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                <li>Pessoas (fornecedores, clientes, faturados)</li>
                <li>Classificações (receitas e despesas)</li>
                <li>Movimentos de Contas</li>
                <li>Parcelas de Contas</li>
                <li>Relações Movimento x Classificação</li>
              </ul>
            </p>

            <button
              onClick={handleInsertData}
              disabled={loadingInsert}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {loadingInsert ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Inserindo...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  Inserir Dados
                </>
              )}
            </button>
          </div>

          {/* Card Resetar Dados */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Resetar Dados</h2>
                <p className="text-sm text-gray-500">Remove todos os registros</p>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <strong>Atenção:</strong> Esta operação é irreversível e removerá todos os dados das 5 tabelas principais.
                </div>
              </div>
            </div>

            {!showConfirmReset ? (
              <button
                onClick={() => setShowConfirmReset(true)}
                disabled={loadingReset}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Resetar Dados
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 text-center mb-2">
                  Tem certeza que deseja resetar todos os dados?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleResetData}
                    disabled={loadingReset}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  >
                    {loadingReset ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Resetando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Confirmar
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    disabled={loadingReset}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Informações</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Os dados inseridos são fictícios e servem apenas para testes</li>
            <li>• Os dados incluem variações realistas: diferentes status, valores, datas, etc.</li>
            <li>• O reset remove todos os registros das tabelas principais</li>
            <li>• Operações podem levar alguns segundos dependendo da quantidade de dados</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

