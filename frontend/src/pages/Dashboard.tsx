/**
 * Página Dashboard - Visão geral do sistema financeiro.
 * Exibe estatísticas principais e resumos dos dados.
 */

import React from 'react';
import { useQuery } from 'react-query';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building2,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

// Mockdata - depois será substituída por API real
const mockStats = {
  totalSuppliers: 45,
  totalCustomers: 128,
  totalPayable: 125000.50,
  totalReceivable: 87500.25,
  overdueBills: 8,
  paidThisMonth: 15,
  recentActivity: [
    { id: 1, type: 'payment', description: 'Pagamento para Fornecedor ABC', amount: 2500.00, date: '2025-09-20' },
    { id: 2, type: 'receipt', description: 'Recebimento de Cliente XYZ', amount: 1800.00, date: '2025-09-19' },
    { id: 3, type: 'invoice', description: 'Nova fatura processada via PDF', amount: 3200.00, date: '2025-09-18' },
  ]
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: {
    value: number;
    label: string;
    positive: boolean;
  };
  color: 'blue' | 'green' | 'yellow' | 'red';
}

function StatCard({ title, value, icon: Icon, trend, color }: Readonly<StatCardProps>) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="text-lg font-semibold text-gray-900">
                {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
              </dd>
            </dl>
          </div>
        </div>
        {trend && (
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <span className={`font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.positive ? '+' : ''}{trend.value}%
              </span>
              <span className="ml-2 text-gray-500">{trend.label}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function Dashboard() {
  // Aqui depois será substituído por query real da API
  const { data: stats, isLoading } = useQuery('dashboard-stats', () => 
    Promise.resolve(mockStats)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Visão geral do sistema financeiro
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Fornecedores"
          value={stats?.totalSuppliers || 0}
          icon={Building2}
          color="blue"
          trend={{ value: 12, label: 'vs mês anterior', positive: true }}
        />
        <StatCard
          title="Total Clientes"
          value={stats?.totalCustomers || 0}
          icon={Users}
          color="green"
          trend={{ value: 8, label: 'vs mês anterior', positive: true }}
        />
        <StatCard
          title="Contas a Pagar"
          value={formatCurrency(stats?.totalPayable || 0)}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          title="Contas a Receber"
          value={formatCurrency(stats?.totalReceivable || 0)}
          icon={TrendingUp}
          color="green"
        />
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Contas Vencidas
                </h3>
                <p className="text-2xl font-bold text-red-600">
                  {stats?.overdueBills || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Pagos este Mês
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  {stats?.paidThisMonth || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Vencimentos Hoje
                </h3>
                <p className="text-2xl font-bold text-blue-600">3</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">
            Atividade Recente
          </h3>
        </div>
        <div className="card-body">
          <div className="flow-root">
            <ul className="-mb-8">
              {stats?.recentActivity.map((activity, activityIdx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {activityIdx !== stats.recentActivity.length - 1 ? (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                          <DollarSign className="h-4 w-4 text-white" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            {activity.description}
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(activity.amount)}
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          {new Date(activity.date).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
