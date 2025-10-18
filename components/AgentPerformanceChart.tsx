import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Agent } from '../types';

interface ChartData extends Agent {
    totalPremium: number;
    overrideEarned: number;
}

interface AgentPerformanceChartProps {
  data: ChartData[];
}

const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
        return `$${(amount / 1000).toFixed(0)}k`;
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const AgentPerformanceChart: React.FC<AgentPerformanceChartProps> = ({ data }) => {
  const chartData = data.filter(d => d.status === 'Active').sort((a, b) => b.totalPremium - a.totalPremium);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart
        data={chartData}
        margin={{
          top: 5, right: 20, left: 0, bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis 
            yAxisId="left" 
            orientation="left" 
            stroke="#4f46e5"
            tickFormatter={(value) => formatCurrency(Number(value))} 
        />
        <YAxis 
            yAxisId="right" 
            orientation="right" 
            stroke="#10b981" 
            tickFormatter={(value) => formatCurrency(Number(value))} 
        />
        <Tooltip formatter={(value: number, name: string) => [new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value), name === 'totalPremium' ? 'Total AP Sold' : 'Override Earned']} />
        <Legend />
        <Bar yAxisId="left" dataKey="totalPremium" name="Total AP Sold" fill="#818cf8" barSize={20} />
        <Line yAxisId="right" type="monotone" dataKey="overrideEarned" name="Override Earned" stroke="#10b981" strokeWidth={2} />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default AgentPerformanceChart;