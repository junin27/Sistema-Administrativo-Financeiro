/**
 * Formulário para criação/edição de clientes.
 * Placeholder básico - será expandido posteriormente.
 */

import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';

export function CustomerForm() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/clientes')}
          className="btn-outline p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="h-8 w-8 mr-3 text-green-600" />
            Novo Cliente
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Preencha os dados para criar um novo cliente
          </p>
        </div>
      </div>

      {/* Conteúdo temporário */}
      <div className="card">
        <div className="card-body">
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Formulário em desenvolvimento
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              O formulário de clientes será implementado em breve.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
