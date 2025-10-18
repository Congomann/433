import React, { useState, useEffect } from 'react';
import { Client } from '../types';
import { CloseIcon, PencilIcon } from './icons';

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
  clientToEdit: Client | null;
}

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.id || props.name} className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
        <input {...props} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
    </div>
);

const EditClientModal: React.FC<EditClientModalProps> = ({ isOpen, onClose, onSave, clientToEdit }) => {
    const [formData, setFormData] = useState<Partial<Client>>({});

    useEffect(() => {
        if (isOpen && clientToEdit) {
            setFormData(clientToEdit);
        }
    }, [isOpen, clientToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const numericFields = ['weight', 'monthlyPremium', 'annualPremium'];

        if (numericFields.includes(name)) {
            setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : Number(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Client);
    };

    if (!isOpen || !clientToEdit) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 modal-backdrop">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-3xl m-4 max-h-[90vh] overflow-y-auto modal-panel">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">Edit Client Profile: {clientToEdit.firstName} {clientToEdit.lastName}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close modal" title="Close">
                        <CloseIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                        {/* Personal & Medical Info */}
                        <h3 className="col-span-full font-semibold text-lg text-slate-700 border-b border-slate-200 pb-2 mb-2">Personal &amp; Medical Information</h3>
                        <InputField label="First Name" name="firstName" value={formData.firstName || ''} onChange={handleChange} required />
                        <InputField label="Last Name" name="lastName" value={formData.lastName || ''} onChange={handleChange} required />
                        <InputField label="Date of Birth" name="dob" type="date" value={formData.dob || ''} onChange={handleChange} />
                        
                        <InputField label="SSN" name="ssn" value={formData.ssn || ''} onChange={handleChange} placeholder="***-**-****" />
                        <InputField label="Phone Number" name="phone" type="tel" value={formData.phone || ''} onChange={handleChange} required />
                        <InputField label="Email Address" name="email" type="email" value={formData.email || ''} onChange={handleChange} required />

                        <InputField label="Height" name="height" value={formData.height || ''} onChange={handleChange} placeholder="e.g., 5' 11&quot;" />
                        <InputField label="Weight (lbs)" name="weight" type="number" value={formData.weight ?? ''} onChange={handleChange} placeholder="e.g., 180" />
                        <InputField label="Birth State" name="birthState" value={formData.birthState || ''} onChange={handleChange} />

                        <div className="lg:col-span-3">
                            <label htmlFor="medications" className="block text-sm font-medium text-slate-700 mb-1.5">Current Medications</label>
                            <textarea id="medications" name="medications" value={formData.medications || ''} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="List any current medications..."></textarea>
                        </div>
                        
                        {/* Address Info */}
                        <h3 className="col-span-full font-semibold text-lg text-slate-700 border-b border-slate-200 pb-2 mb-2 mt-4">Address</h3>
                        <div className="lg:col-span-3">
                            <InputField label="Street Address" name="address" value={formData.address || ''} onChange={handleChange} />
                        </div>
                        <InputField label="City" name="city" value={formData.city || ''} onChange={handleChange} />
                        <InputField label="State" name="state" value={formData.state || ''} onChange={handleChange} />
                        <div/> {/* Spacer */}

                        {/* Financial Info */}
                        <h3 className="col-span-full font-semibold text-lg text-slate-700 border-b border-slate-200 pb-2 mb-2 mt-4">Financial Details</h3>
                        <InputField label="Bank Name" name="bankName" value={formData.bankName || ''} onChange={handleChange} />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Account Type</label>
                            <select name="accountType" value={formData.accountType || 'Checking'} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                                <option value="Checking">Checking</option>
                                <option value="Saving">Saving</option>
                            </select>
                        </div>
                        <div /> {/* Spacer */}
                        <InputField label="Routing Number" name="routingNumber" value={formData.routingNumber || ''} onChange={handleChange} />
                        <InputField label="Account Number" name="accountNumber" value={formData.accountNumber || ''} onChange={handleChange} />
                    </div>
                    <div className="flex justify-end mt-8 items-center gap-3">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-900 bg-white rounded-md shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 button-press">Cancel</button>
                        <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-500 flex items-center button-press">
                            <PencilIcon className="w-5 h-5 mr-2" /> Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditClientModal;
