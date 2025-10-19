import React, { useState, useMemo } from 'react';
import { Client, PolicyType, PolicyStatus, PolicyUnderwritingStatus, Policy } from '../types';
import { RocketLaunchIcon, UserCircleIcon } from './icons';
import { useToast } from '../contexts/ToastContext';
import { INSURANCE_CARRIERS } from '../constants';

interface NewBusinessViewProps {
    clients: Client[];
    onSavePolicy: (policyData: Omit<Policy, 'id'> & { id?: number }) => void;
}

const SelectField: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: React.ReactNode }> = ({ label, children, ...props }) => (
    <div>
        <label htmlFor={props.id || props.name} className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
        <select {...props} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/50 appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}>
            {children}
        </select>
    </div>
);


const NewBusinessView: React.FC<NewBusinessViewProps> = ({ clients, onSavePolicy }) => {
    const { addToast } = useToast();
    const [selectedClientId, setSelectedClientId] = useState('');
    const [policyType, setPolicyType] = useState<PolicyType.INDEXED_UNIVERSAL_LIFE | PolicyType.FINAL_EXPENSE>(PolicyType.INDEXED_UNIVERSAL_LIFE);
    const [coverageAmount, setCoverageAmount] = useState('');
    const [carrier, setCarrier] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const activeClients = useMemo(() => clients.filter(c => c.status === 'Active'), [clients]);
    const selectedClient = useMemo(() => activeClients.find(c => c.id === Number(selectedClientId)), [activeClients, selectedClientId]);

    const resetForm = () => {
        setSelectedClientId('');
        setPolicyType(PolicyType.INDEXED_UNIVERSAL_LIFE);
        setCoverageAmount('');
        setCarrier('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient || !policyType || !coverageAmount || !carrier) {
            addToast('Missing Information', 'Please fill out all required fields.', 'warning');
            return;
        }

        setIsSubmitting(true);
        
        const annualPremium = parseFloat(coverageAmount);
        const newPolicy: Omit<Policy, 'id'> = {
            clientId: selectedClient.id,
            policyNumber: `SUB-${Date.now()}`,
            type: policyType,
            carrier: carrier,
            monthlyPremium: annualPremium / 12,
            annualPremium: annualPremium,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            status: PolicyStatus.ACTIVE,
            underwritingStatus: PolicyUnderwritingStatus.PENDING,
        };

        try {
            // Simulate API call latency
            await new Promise(resolve => setTimeout(resolve, 1000));
            onSavePolicy(newPolicy);
            addToast('Submission Successful', `The policy for ${selectedClient.firstName} ${selectedClient.lastName} has been sent to ${carrier} for review.`, 'success');
            resetForm();
        } catch (error) {
            addToast('Submission Failed', 'There was an error submitting the policy.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-10 page-enter">
            <div className="flex items-center mb-8">
                <RocketLaunchIcon className="w-10 h-10 text-primary-600 mr-4" />
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-800">New Business Submission</h1>
                    <p className="text-slate-500">Submit new IUL and Final Expense policies directly to carriers.</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto bg-white/70 backdrop-blur-lg rounded-2xl border border-white/50 shadow-premium p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Step 1: Client Information */}
                    <div>
                        <h2 className="text-xl font-bold text-slate-700 border-b border-slate-200 pb-2 mb-4">1. Client Information</h2>
                        <SelectField
                            label="Select an Existing Client"
                            name="client"
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                            required
                        >
                            <option value="">-- Select a client --</option>
                            {activeClients.map(client => (
                                <option key={client.id} value={client.id}>
                                    {client.firstName} {client.lastName}
                                </option>
                            ))}
                        </SelectField>

                        {selectedClient && (
                            <div className="mt-4 p-4 bg-slate-50/70 border border-slate-200 rounded-lg flex items-center space-x-4 animate-scale-in">
                                <UserCircleIcon className="w-12 h-12 text-slate-400 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-slate-800">{selectedClient.firstName} {selectedClient.lastName}</p>
                                    <p className="text-sm text-slate-500">{selectedClient.email} &middot; {selectedClient.phone}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Step 2: Policy Details */}
                    <div>
                        <h2 className="text-xl font-bold text-slate-700 border-b border-slate-200 pb-2 mb-4">2. Policy Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SelectField
                                label="Policy Type"
                                name="policyType"
                                value={policyType}
                                onChange={(e) => setPolicyType(e.target.value as PolicyType.INDEXED_UNIVERSAL_LIFE | PolicyType.FINAL_EXPENSE)}
                                required
                            >
                                <option value={PolicyType.INDEXED_UNIVERSAL_LIFE}>Indexed Universal Life (IUL)</option>
                                <option value={PolicyType.FINAL_EXPENSE}>Final Expense</option>
                            </SelectField>

                            <div>
                                <label htmlFor="coverageAmount" className="block text-sm font-medium text-slate-700 mb-1.5">Coverage Amount / Annual Premium</label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className="text-slate-500 sm:text-sm">$</span>
                                    </div>
                                    <input
                                        id="coverageAmount"
                                        name="coverageAmount"
                                        type="number"
                                        value={coverageAmount}
                                        onChange={(e) => setCoverageAmount(e.target.value)}
                                        className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/50"
                                        placeholder="50000"
                                        step="1000"
                                        min="0"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <SelectField
                                label="Carrier"
                                name="carrier"
                                value={carrier}
                                onChange={(e) => setCarrier(e.target.value)}
                                required
                                className="md:col-span-2"
                            >
                                <option value="">-- Select a carrier --</option>
                                {INSURANCE_CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
                            </SelectField>
                        </div>
                    </div>
                    
                    {/* Step 3: Submission */}
                    <div className="border-t border-slate-200 pt-6 flex justify-end">
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center justify-center bg-primary-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 button-press disabled:bg-slate-400 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                    Submitting...
                                </>
                            ) : (
                                "Submit to Carrier"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewBusinessView;