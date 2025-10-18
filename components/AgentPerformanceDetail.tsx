import React, { useMemo } from 'react';
import { Agent, Client, Policy, PolicyType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ComposedChart, Line } from 'recharts';

interface AgentPerformanceDetailProps {
  agent: Agent;
  policies: Policy[];
  clients: Client[];
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const AgentPerformanceDetail: React.FC<AgentPerformanceDetailProps> = ({ agent, policies }) => {
  const agentPolicies = policies; 

  const monthlyData = useMemo(() => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(0, i).toLocaleString('default', { month: 'short' }),
      policiesSold: 0,
      totalAP: 0,
      commissionEarned: 0,
    }));

    agentPolicies.forEach(policy => {
      const monthIndex = new Date(policy.startDate).getMonth();
      if (data[monthIndex]) {
        data[monthIndex].policiesSold += 1;
        data[monthIndex].totalAP += policy.annualPremium;
        data[monthIndex].commissionEarned += policy.annualPremium * agent.commissionRate;
      }
    });
    return data;
  }, [agent, agentPolicies]);
  
  const commissionByType = useMemo(() => {
    const data = agentPolicies.reduce((acc, policy) => {
        const commission = policy.annualPremium * agent.commissionRate;
        acc[policy.type] = (acc[policy.type] || 0) + commission;
        return acc;
    }, {} as Record<PolicyType, number>);

    return Object.entries(data)
        .map(([name, value]) => ({ name, Commission: value }))
        .sort((a, b) => (b.Commission as number) - (a.Commission as number));
  }, [agent, agentPolicies]);

  const hasData = agentPolicies.length > 0;
  const COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

  return (
    <div>
      <h3 className="text-xl font-bold text-slate-800 mb-4">Performance Overview</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center border rounded-lg p-4 mb-6 bg-slate-50">
          <div>
              <p className="text-3xl font-bold text-primary-600">{agent.clientCount}</p>
              <p className="text-sm text-slate-500 font-medium">Clients</p>
          </div>
          <div>
              <p className="text-3xl font-bold text-primary-600">{agent.leads}</p>
              <p className="text-sm text-slate-500 font-medium">Leads</p>
          </div>
          <div>
              <p className="text-3xl font-bold text-primary-600">{(agent.conversionRate * 100).toFixed(0)}%</p>
              <p className="text-sm text-slate-500 font-medium">Conversion Rate</p>
          </div>
      </div>

      {hasData ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <h4 className="font-semibold text-slate-700 mb-2">Monthly Sales & Commissions</h4>
            <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" orientation="left" stroke="#4f46e5" label={{ value: 'Policies Sold', angle: -90, position: 'insideLeft', offset: -5 }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#10b981" label={{ value: 'Commission', angle: 90, position: 'insideRight' }} tickFormatter={formatCurrency} />
                    <Tooltip formatter={(value: number, name: string) => [name === 'commissionEarned' ? formatCurrency(value) : value, name === 'commissionEarned' ? 'Commission Earned' : 'Policies Sold']} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="policiesSold" name="Policies Sold" fill="#818cf8" />
                    <Line yAxisId="right" type="monotone" dataKey="commissionEarned" name="Commission Earned" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="lg:col-span-2">
             <h4 className="font-semibold text-slate-700 mb-2">Commission by Policy Type</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={commissionByType} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={formatCurrency} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }}/>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="Commission" fill="#4f46e5" barSize={20}>
                        {commissionByType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
              </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-lg">
          No policy data available to generate performance details.
        </div>
      )}
    </div>
  );
};

export default AgentPerformanceDetail;