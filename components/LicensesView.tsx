import React from 'react';
import { Agent, License } from '../types';
import AgentLicenses from './AgentLicenses';
import { ShieldIcon } from './icons';

interface LicensesViewProps {
  agent: Agent;
  licenses: License[];
  onAddLicense: (licenseData: Omit<License, 'id'>) => void;
  onDeleteLicense: (licenseId: number) => void;
}

const LicensesView: React.FC<LicensesViewProps> = ({ agent, licenses, onAddLicense, onDeleteLicense }) => {
  return (
    <div className="p-8">
      <div className="flex items-center mb-8">
        <ShieldIcon className="w-10 h-10 text-primary-600 mr-4" />
        <div>
            <h1 className="text-3xl font-extrabold text-slate-800">My Licenses</h1>
            <p className="text-slate-500">Manage your state insurance licenses to stay compliant.</p>
        </div>
      </div>
      <AgentLicenses
        agentId={agent.id}
        licenses={licenses}
        onAddLicense={onAddLicense}
        onDeleteLicense={onDeleteLicense}
      />
    </div>
  );
};

export default LicensesView;
