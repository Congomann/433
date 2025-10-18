import React, { useState, useEffect } from 'react';
import { Policy, PolicyStatus, PolicyType } from '../types';
import { CloseIcon, PlusIcon } from './icons';
import { INSURANCE_CARRIERS } from '../constants';

interface AddEditPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (policyData: Omit<Policy, 'id'> & { id?: number }) => void;
  policyToEdit?: Policy | null;
  clientId: number | null;
}

const AddEditPolicyModal: React.FC<AddEditPolicyModalProps> = ({ isOpen, onClose, onSave, policyToEdit, clientId }) => {
  const [formData, setFormData] = useState({
    policyNumber: '',
    type: PolicyType.WHOLE_LIFE,
    carrier: '',
    status: PolicyStatus.ACTIVE,
    startDate: '',
    endDate: '',
    monthlyPremium: '',
    annualPremium: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (policyToEdit) {
        setFormData({
          policyNumber: policyToEdit.policyNumber,
          type: policyToEdit.type,
          carrier: policyToEdit.carrier || '',
          status: policyToEdit.status,
          startDate: policyToEdit.startDate,
          endDate: policyToEdit.endDate,
          monthlyPremium: policyToEdit.monthlyPremium.toString(),
          annualPremium: policyToEdit.annualPremium.toString(),
        });
      } else {
        // Reset form for new policy
        setFormData({
          policyNumber: '',
          type: PolicyType.WHOLE_LIFE,
          carrier: '',
          status: PolicyStatus.ACTIVE,
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          monthlyPremium: '',
          annualPremium: '',
        });
      }
    }
  }, [policyToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'monthlyPremium') {
      const monthly = parseFloat(value);
      setFormData(prev => ({
        ...prev,
        monthlyPremium: value,
        annualPremium: isNaN(monthly) ? '' : (monthly * 12).toFixed(2),
      }));
    } else if (name === 'annualPremium') {
      const annual = parseFloat(value);
      setFormData(prev => ({
        ...prev,
        annualPremium: value,
        monthlyPremium: isNaN(annual) ? '' : (annual / 12).toFixed(2),
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;

    onSave({
      id: policyToEdit?.id,
      clientId,
      ...formData,
      monthlyPremium: parseFloat(formData.monthlyPremium) || 0,
      annualPremium: parseFloat(formData.annualPremium) || 0,
      type: formData.type as PolicyType,
      status: formData.status as PolicyStatus,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 modal-backdrop">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-premium-lg p-8 w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto modal-panel border border-white/50">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">{policyToEdit ? 'Edit Policy' : 'Add New Policy'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close modal" title="Close">
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="policyNumber" className="block text-sm font-medium text-slate-700 mb-1.5">Policy Number</label>
              <input type="text" id="policyNumber" name="policyNumber" value={formData.policyNumber} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/50" required />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-1.5">Policy Type</label>
              <select id="type" name="type" value={formData.type} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/50">
                {Object.values(PolicyType).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="carrier" className="block text-sm font-medium text-slate-700 mb-1.5">Insurance Carrier</label>
              <select id="carrier" name="carrier" value={formData.carrier} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/50">
                <option value="">Select a carrier...</option>
                {INSURANCE_CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
              <select id="status" name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/50">
                {Object.values(PolicyStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
             <div /> {/* Placeholder for grid */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 mb-1.5">Start Date</label>
              <input type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/50" required />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 mb-1.5">End Date</label>
              <input type="date" id="endDate" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/50" />
            </div>
            <div>
              <label htmlFor="monthlyPremium" className="block text-sm font-medium text-slate-700 mb-1.5">Monthly Premium ($)</label>
              <input type="number" id="monthlyPremium" name="monthlyPremium" value={formData.monthlyPremium} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/50" step="0.01" />
            </div>
            <div>
              <label htmlFor="annualPremium" className="block text-sm font-medium text-slate-700 mb-1.5">Annual Premium ($)</label>
              <input type="number" id="annualPremium" name="annualPremium" value={formData.annualPremium} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/50" step="0.01" />
            </div>
          </div>
          <div className="flex justify-end mt-8 items-center gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-900 bg-white rounded-lg shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg shadow-md hover:bg-primary-700 flex items-center">
              <PlusIcon className="w-5 h-5 mr-2" /> {policyToEdit ? 'Save Changes' : 'Add Policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditPolicyModal;