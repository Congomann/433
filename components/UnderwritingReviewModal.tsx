import React, { useState, useEffect } from 'react';
import { Policy, PolicyUnderwritingStatus } from '../types';
import { CloseIcon, DocumentTextIcon } from './icons';

interface UnderwritingReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (policyId: number, updates: { underwritingStatus: PolicyUnderwritingStatus, underwritingNotes: string }) => void;
  policy: Policy | null;
}

const UnderwritingReviewModal: React.FC<UnderwritingReviewModalProps> = ({ isOpen, onClose, onSave, policy }) => {
  const [status, setStatus] = useState<PolicyUnderwritingStatus>(PolicyUnderwritingStatus.PENDING);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (policy) {
      setStatus(policy.underwritingStatus || PolicyUnderwritingStatus.PENDING);
      setNotes(policy.underwritingNotes || '');
    }
  }, [policy]);

  const handleSave = () => {
    if (policy) {
      onSave(policy.id, { underwritingStatus: status, underwritingNotes: notes });
    }
  };

  if (!isOpen || !policy) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 modal-backdrop">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg m-4 modal-panel">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Underwriting Review</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close modal" title="Close">
            <CloseIcon />
          </button>
        </div>
        <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p><strong className="font-medium text-slate-600">Policy Type:</strong> {policy.type}</p>
            <p><strong className="font-medium text-slate-600">Policy #:</strong> {policy.policyNumber}</p>
            <p><strong className="font-medium text-slate-600">Annual Premium:</strong> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(policy.annualPremium)}</p>
        </div>
        <div className="space-y-4">
            <div>
                <label htmlFor="underwritingStatus" className="block text-sm font-medium text-slate-700 mb-1.5">Update Status</label>
                <select 
                    id="underwritingStatus"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as PolicyUnderwritingStatus)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    {Object.values(PolicyUnderwritingStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="underwritingNotes" className="block text-sm font-medium text-slate-700 mb-1.5">Underwriting Notes (Internal)</label>
                <textarea
                    id="underwritingNotes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={6}
                    className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Add internal notes for this review..."
                />
            </div>
        </div>
         <div className="flex justify-end items-center gap-3 mt-8">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-900 bg-white rounded-md shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 button-press">Cancel</button>
          <button onClick={handleSave} className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-500 flex items-center button-press">
            <DocumentTextIcon className="w-5 h-5 mr-2" /> Save Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnderwritingReviewModal;
