import React from 'react';
import { AICallLog } from '../types';
import { PhoneIcon } from './icons';

interface AICallLogsViewProps {
  aiCallLogs: AICallLog[];
}

const IntentBadge: React.FC<{ intent: AICallLog['intent'] }> = ({ intent }) => {
  const styles = {
    'Interested': 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    'Not Interested': 'bg-rose-100 text-rose-800 ring-rose-200',
    'Callback Requested': 'bg-amber-100 text-amber-800 ring-amber-200',
    'Unknown': 'bg-slate-100 text-slate-800 ring-slate-200',
  };
  return (
    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ring-1 ring-inset ${styles[intent] || styles['Unknown']}`}>
      {intent}
    </span>
  );
};

const AICallLogsView: React.FC<AICallLogsViewProps> = ({ aiCallLogs }) => {
  const sortedLogs = [...aiCallLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="p-10 page-enter">
      <div className="flex items-center mb-8">
        <PhoneIcon className="w-10 h-10 text-primary-600 mr-4" />
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800">AI Call Logs</h1>
          <p className="text-slate-500">A real-time record of all outbound calls made by the AI assistant.</p>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-lg rounded-2xl border border-white/50 shadow-premium overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50/50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone Number</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Intent</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {sortedLogs.length > 0 ? sortedLogs.map(log => (
              <tr key={log.id} className="border-b border-slate-200/50 last:border-b-0 hover:bg-slate-100/50 row-enter">
                <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-slate-800">{log.name}</td>
                <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600">{log.phone}</td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <IntentBadge intent={log.intent} />
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600">{log.status}</td>
                <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-500">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="text-center p-12 text-slate-500">
                  <p className="font-semibold">No AI call logs found.</p>
                  <p className="text-sm mt-1">As the AI makes calls, the results will appear here in real-time.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AICallLogsView;