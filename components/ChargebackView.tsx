import React, { useState, useMemo } from 'react';
import { Chargeback, ChargebackStatus } from '../types';
import { ExclamationTriangleIcon, EllipsisVerticalIcon } from './icons';

interface ChargebackViewProps {
  chargebacks: Chargeback[];
  onUpdateStatus: (id: number, status: ChargebackStatus) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const StatusBadge: React.FC<{ status: ChargebackStatus }> = ({ status }) => {
  const styles = {
    [ChargebackStatus.UNPAID]: 'bg-rose-100 text-rose-800 ring-rose-200',
    [ChargebackStatus.PAID]: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    [ChargebackStatus.ADJUSTED]: 'bg-amber-100 text-amber-800 ring-amber-200',
  };
  return (
    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ring-1 ring-inset ${styles[status]}`}>
      {status}
    </span>
  );
};

const ChargebackRow: React.FC<{ chargeback: Chargeback; onUpdateStatus: (id: number, status: ChargebackStatus) => void; }> = ({ chargeback, onUpdateStatus }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const handleStatusChange = (newStatus: ChargebackStatus) => {
        onUpdateStatus(chargeback.id, newStatus);
        setIsMenuOpen(false);
    };

    return (
        <tr className="hover:bg-slate-50/50 transition-colors row-enter border-b border-slate-200/50 last:border-b-0 group">
            <td className="px-6 py-5 whitespace-nowrap">
                <div className="text-sm font-bold text-slate-900">{chargeback.clientName}</div>
                <div className="text-sm text-slate-500">{chargeback.policyType}</div>
            </td>
            <td className="px-6 py-5 whitespace-nowrap">
                <div className="text-sm text-slate-900">{chargeback.cancellationDate}</div>
                <div className="text-sm text-slate-500">{chargeback.monthsPaid} months paid</div>
            </td>
            <td className="px-6 py-5 whitespace-nowrap text-sm font-semibold text-rose-600">
                {formatCurrency(chargeback.debtAmount)}
            </td>
            <td className="px-6 py-5 whitespace-nowrap">
                <StatusBadge status={chargeback.status} />
            </td>
            <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium relative">
                <button
                    onClick={() => setIsMenuOpen(prev => !prev)}
                    onBlur={() => setTimeout(() => setIsMenuOpen(false), 150)}
                    className="p-1.5 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
                >
                    <EllipsisVerticalIcon className="w-5 h-5" />
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                        <div className="py-1">
                            <a href="#" onClick={(e) => { e.preventDefault(); handleStatusChange(ChargebackStatus.PAID); }} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Mark as Paid</a>
                            <a href="#" onClick={(e) => { e.preventDefault(); handleStatusChange(ChargebackStatus.ADJUSTED); }} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Mark as Adjusted</a>
                            <a href="#" onClick={(e) => { e.preventDefault(); handleStatusChange(ChargebackStatus.UNPAID); }} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Mark as Unpaid</a>
                        </div>
                    </div>
                )}
            </td>
        </tr>
    );
};


const ChargebackView: React.FC<ChargebackViewProps> = ({ chargebacks, onUpdateStatus }) => {
    const [filter, setFilter] = useState<'all' | ChargebackStatus>(ChargebackStatus.UNPAID);
    
    const filteredChargebacks = useMemo(() => {
        if (filter === 'all') return chargebacks;
        return chargebacks.filter(c => c.status === filter);
    }, [chargebacks, filter]);
    
    const totalDebt = chargebacks.filter(c => c.status === ChargebackStatus.UNPAID).reduce((sum, c) => sum + c.debtAmount, 0);

    return (
        <div className="p-6 sm:p-10">
            <div className="flex items-center mb-8">
                <ExclamationTriangleIcon className="w-10 h-10 text-rose-500 mr-4" />
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-800">Debt & Chargebacks</h1>
                    <p className="text-lg text-slate-500 mt-1">
                        Total outstanding debt: <span className="font-bold text-rose-600">{formatCurrency(totalDebt)}</span>
                    </p>
                </div>
            </div>

            <div className="mb-6 flex space-x-2 border-b border-slate-200/80">
                <button onClick={() => setFilter(ChargebackStatus.UNPAID)} className={`px-4 py-2 font-medium text-sm rounded-t-lg border-b-2 ${filter === ChargebackStatus.UNPAID ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Unpaid</button>
                <button onClick={() => setFilter(ChargebackStatus.PAID)} className={`px-4 py-2 font-medium text-sm rounded-t-lg border-b-2 ${filter === ChargebackStatus.PAID ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Paid</button>
                <button onClick={() => setFilter(ChargebackStatus.ADJUSTED)} className={`px-4 py-2 font-medium text-sm rounded-t-lg border-b-2 ${filter === ChargebackStatus.ADJUSTED ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Adjusted</button>
                <button onClick={() => setFilter('all')} className={`px-4 py-2 font-medium text-sm rounded-t-lg border-b-2 ${filter === 'all' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>All</button>
            </div>

            <div className="bg-white/70 backdrop-blur-lg rounded-2xl border border-white/50 shadow-premium overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Client & Policy</th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cancellation</th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Debt Amount</th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredChargebacks.map(chargeback => (
                            <ChargebackRow key={chargeback.id} chargeback={chargeback} onUpdateStatus={onUpdateStatus} />
                        ))}
                    </tbody>
                </table>
                {filteredChargebacks.length === 0 && (
                    <div className="text-center p-12 text-slate-500">
                        <p className="font-semibold">No chargebacks found</p>
                        <p className="text-sm mt-1">There are no records matching the "{filter}" filter.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChargebackView;
