import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { CloseIcon, ShieldIcon } from './icons';

interface ApproveAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newRole: UserRole) => void;
  agentName: string;
  currentRole: UserRole;
}

const ApproveAgentModal: React.FC<ApproveAgentModalProps> = ({ isOpen, onClose, onConfirm, agentName, currentRole }) => {
  const [selectedRole, setSelectedRole] = useState(currentRole);

  useEffect(() => {
    if (isOpen) {
      setSelectedRole(currentRole);
    }
  }, [isOpen, currentRole]);

  const handleConfirm = () => {
    onConfirm(selectedRole);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 modal-backdrop">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md m-4 modal-panel">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Approve Application</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close modal" title="Close">
            <CloseIcon />
          </button>
        </div>
        <div>
            <p className="text-slate-600 mb-4">
                You are about to approve the application for <strong>{agentName}</strong>. Please confirm or adjust their role below.
            </p>
            <div className="mb-6">
                <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1.5">Assign Role</label>
                <select
                    id="role"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                    <option value={UserRole.AGENT}>Agent</option>
                    <option value={UserRole.SUB_ADMIN}>Sub-Admin</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">This will determine their permissions within the CRM.</p>
            </div>
            <div className="flex justify-end items-center gap-3 pt-2">
                <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-900 bg-white rounded-md shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 button-press">Cancel</button>
                <button onClick={handleConfirm} className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-md shadow-sm hover:bg-emerald-500 flex items-center button-press">
                    <ShieldIcon className="w-5 h-5 mr-2" /> Approve and Activate
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ApproveAgentModal;