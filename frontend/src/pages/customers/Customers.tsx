/**
 * Página de listagem de clientes.
 * Placeholder básico - será expandido posteriormente.
 */

import { Link } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';

export function Customers() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="h-8 w-8 mr-3 text-green-600" />
            Clientes
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie seus clientes e consumidores
          </p>
        </div>
        <Link to="/clientes/novo" className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Link>
      </div>

      {/* Conteúdo temporário */}
      <div className="card">
        <div className="card-body">
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Página em desenvolvimento
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              A listagem de clientes será implementada em breve.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
