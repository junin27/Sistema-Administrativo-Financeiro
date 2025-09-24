/**
 * Página de contas a pagar.
 * Placeholder básico - será expandido posteriormente.
 */

import { Link } from 'react-router-dom';
import { Plus, TrendingDown } from 'lucide-react';

export function PayableAccounts() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <TrendingDown className="h-8 w-8 mr-3 text-red-600" />
            Contas a Pagar
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie suas obrigações financeiras
          </p>
        </div>
        <Link to="/contas-pagar/nova" className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Nova Conta
        </Link>
      </div>
      <div className="card">
        <div className="card-body">
          <div className="text-center py-12">
            <TrendingDown className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Página em desenvolvimento
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}
