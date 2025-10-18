import React, { useState, useMemo } from 'react';
import { Client, Policy, PolicyStatus, PolicyUnderwritingStatus, PolicyType } from '../types';
import { RocketLaunchIcon, AiSparklesIcon, CheckCircleIcon, ClipboardDocumentIcon } from './icons';
import { useToast } from '../contexts/ToastContext';
import { analyzeEAppConfirmation } from '../services/geminiService';
import { CARRIER_PORTALS } from '../constants';

interface CarrierEAppsViewProps {
    clients: Client[];
    onSavePolicy: (policyData: Omit<Policy, 'id'> & { id?: number }) => void;
}

const copyToClipboard = (text: string, fieldName: string, showToast: Function) => {
    if (!text) {
        showToast('Nothing to Copy', `The ${fieldName} field is empty.`, 'info');
        return;
    }
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to Clipboard', `${fieldName} has been copied.`, 'success');
    }, () => {
        showToast('Copy Failed', 'Could not copy text.', 'error');
    });
};

const DataField: React.FC<{ label: string, value?: string | number | null }> = ({ label, value }) => {
    const { addToast } = useToast();
    return (
        <div className="flex justify-between items-center bg-slate-100/80 p-3 rounded-lg border border-slate-200/80">
            <div>
                <p className="text-xs font-semibold text-slate-500">{label}</p>
                <p className="text-sm font-medium text-slate-800">{value || <span className="italic text-slate-400">Not Provided</span>}</p>
            </div>
            {value && 
                <button onClick={() => copyToClipboard(String(value), label, addToast)} className="text-slate-500 hover:text-primary-600 p-1.5 rounded-full hover:bg-slate-200" title={`Copy ${label}`}>
                    <ClipboardDocumentIcon className="w-4 h-4" />
                </button>
            }
        </div>
    );
};

// FIX: Define the missing InputField component.
const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.id || props.name} className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
        <input {...props} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/50" />
    </div>
);


const StepIndicator: React.FC<{ stepNum: number; title: string; current: number; }> = ({ stepNum, title, current }) => (
    <div className={`flex items-center space-x-3 text-sm ${current > stepNum ? 'text-emerald-600' : current === stepNum ? 'text-primary-600 font-semibold' : 'text-slate-400'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${current > stepNum ? 'bg-emerald-100 border-emerald-500' : current === stepNum ? 'bg-primary-100 border-primary-500' : 'bg-slate-100 border-slate-300'}`}>
            {current > stepNum ? <CheckCircleIcon className="w-5 h-5" /> : stepNum}
        </div>
        <span>{title}</span>
    </div>
);

const CarrierEAppsView: React.FC<CarrierEAppsViewProps> = ({ clients, onSavePolicy }) => {
    const { addToast } = useToast();
    const [step, setStep] = useState(1);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [pastedText, setPastedText] = useState('');
    const [extractedData, setExtractedData] = useState<Partial<Policy> | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const activeClients = useMemo(() => clients.filter(c => c.status === 'Active' || c.status === 'Lead'), [clients]);
    const selectedClient = useMemo(() => clients.find(c => c.id === Number(selectedClientId)), [clients, selectedClientId]);

    const handleAnalyze = async () => {
        if (!pastedText.trim()) {
            addToast('No Text Provided', 'Please paste the confirmation text from the carrier website.', 'warning');
            return;
        }
        setIsProcessing(true);
        try {
            const result = await analyzeEAppConfirmation(pastedText);
            setExtractedData({
                policyNumber: result.policyNumber,
                annualPremium: result.annualPremium,
                monthlyPremium: result.annualPremium ? result.annualPremium / 12 : 0,
                underwritingStatus: result.status,
            });
            setStep(4);
        } catch (error: any) {
            addToast('Analysis Failed', error.message, 'error');
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleSavePolicy = () => {
        if (!selectedClient || !extractedData) return;
        
        setIsProcessing(true);
        const finalPolicy: Omit<Policy, 'id'> = {
            clientId: selectedClient.id,
            policyNumber: extractedData.policyNumber || `N/A-${Date.now()}`,
            type: PolicyType.WHOLE_LIFE, // Defaulting, could be improved with AI extraction
            annualPremium: extractedData.annualPremium || 0,
            monthlyPremium: extractedData.monthlyPremium || 0,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            status: PolicyStatus.ACTIVE,
            underwritingStatus: extractedData.underwritingStatus || PolicyUnderwritingStatus.PENDING,
            carrier: 'Unknown - Extracted by AI', // Defaulting, could be improved
        };

        try {
            onSavePolicy(finalPolicy);
            addToast('Policy Created', `A new policy has been saved for ${selectedClient.firstName}.`, 'success');
            // Reset state for a new session
            setStep(1);
            setSelectedClientId('');
            setPastedText('');
            setExtractedData(null);
        } catch (error) {
            addToast('Save Failed', 'There was an error saving the policy.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };
    
    return (
        <div className="p-10 page-enter">
            <div className="flex items-center mb-8">
                <RocketLaunchIcon className="w-10 h-10 text-primary-600 mr-4" />
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-800">AI E-App Co-pilot</h1>
                    <p className="text-slate-500">Your assistant for fast and accurate new business submissions.</p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto bg-white/70 backdrop-blur-lg rounded-2xl border border-white/50 shadow-premium p-8">
                <div className="flex justify-between mb-8 border-b border-slate-200 pb-4">
                    <StepIndicator stepNum={1} title="Select Client" current={step} />
                    <StepIndicator stepNum={2} title="Launch & Copy Data" current={step} />
                    <StepIndicator stepNum={3} title="Paste Confirmation" current={step} />
                    <StepIndicator stepNum={4} title="Verify & Save" current={step} />
                </div>

                {step === 1 && (
                    <div className="animate-scale-in">
                        <label htmlFor="client-select" className="block text-lg font-semibold text-slate-700 mb-2">Select a Client to Begin</label>
                        <select
                            id="client-select"
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/50"
                        >
                            <option value="">-- Choose a client --</option>
                            {activeClients.map(client => (
                                <option key={client.id} value={client.id}>{client.firstName} {client.lastName}</option>
                            ))}
                        </select>
                        <div className="flex justify-end mt-6">
                            <button onClick={() => setStep(2)} disabled={!selectedClientId} className="bg-primary-600 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:bg-primary-700 disabled:bg-slate-400">
                                Next &rarr;
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && selectedClient && (
                    <div className="animate-scale-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-700">1. Launch Carrier Portal</h3>
                                <p className="text-sm text-slate-500 mb-4">Select a carrier to open their e-app website in a new browser tab.</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {CARRIER_PORTALS.map(carrier => (
                                        <a key={carrier.name} href={carrier.url} target="_blank" rel="noopener noreferrer" className="p-3 text-center font-semibold border rounded-lg transition-all transform hover:scale-105 hover:shadow-md hover:bg-primary-50 hover:border-primary-400 hover:text-primary-700 border-slate-300 bg-white/50">
                                            {carrier.name}
                                        </a>
                                    ))}
                                </div>
                                <div className="mt-8 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                                    <h4 className="font-bold text-amber-800">2. Complete the E-App</h4>
                                    <p className="text-sm text-amber-700 mt-1">Use the client data on the right to fill out the application on the carrier's website. When you are finished, return to this tab and click "I've Submitted the E-App" below.</p>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-700">Client Data Co-pilot</h3>
                                <p className="text-sm text-slate-500 mb-4">Use the copy buttons for quick and accurate data entry.</p>
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                    <DataField label="Full Name" value={`${selectedClient.firstName} ${selectedClient.lastName}`} />
                                    <DataField label="Date of Birth" value={selectedClient.dob} />
                                    <DataField label="SSN" value={selectedClient.ssn} />
                                    <DataField label="Address" value={selectedClient.address} />
                                    <DataField label="City" value={selectedClient.city} />
                                    <DataField label="State" value={selectedClient.state} />
                                    <DataField label="Phone" value={selectedClient.phone} />
                                    <DataField label="Email" value={selectedClient.email} />
                                    <DataField label="Bank Name" value={selectedClient.bankName} />
                                    <DataField label="Account Type" value={selectedClient.accountType} />
                                    <DataField label="Routing Number" value={selectedClient.routingNumber} />
                                    <DataField label="Account Number" value={selectedClient.accountNumber} />
                                </div>
                            </div>
                        </div>
                         <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
                            <button onClick={() => setStep(1)} className="bg-slate-200 text-slate-700 font-semibold px-6 py-2 rounded-lg hover:bg-slate-300">&larr; Change Client</button>
                            <button onClick={() => setStep(3)} className="bg-primary-600 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:bg-primary-700">I've Submitted the E-App &rarr;</button>
                        </div>
                    </div>
                )}
                
                {step === 3 && (
                    <div className="animate-scale-in">
                        <h3 className="text-lg font-semibold text-slate-700">Paste E-App Confirmation</h3>
                        <p className="text-sm text-slate-500 mb-4">Once the application is submitted on the carrier's site, copy the entire confirmation page text (Ctrl+A, Ctrl+C) and paste it below.</p>
                        <textarea
                            value={pastedText}
                            onChange={(e) => setPastedText(e.target.value)}
                            rows={10}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/50"
                            placeholder="Paste the full text from the carrier's confirmation page here..."
                        />
                        <div className="flex justify-between mt-6">
                            <button onClick={() => setStep(2)} className="bg-slate-200 text-slate-700 font-semibold px-6 py-2 rounded-lg hover:bg-slate-300">&larr; Back</button>
                            <button onClick={handleAnalyze} disabled={isProcessing} className="bg-primary-600 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:bg-primary-700 flex items-center disabled:bg-slate-400">
                                {isProcessing ? 'Analyzing...' : <><AiSparklesIcon className="w-5 h-5 mr-2" /> Analyze with AI</>}
                            </button>
                        </div>
                    </div>
                )}

                {step === 4 && selectedClient && extractedData && (
                    <div className="animate-scale-in">
                        <h3 className="text-lg font-semibold text-slate-700">Verify Extracted Information</h3>
                        <p className="text-sm text-slate-500 mb-4">The AI has extracted the following details for <span className="font-bold">{selectedClient.firstName}</span>. Please verify and correct them if needed before saving.</p>
                        <div className="space-y-4 p-6 bg-slate-50/70 border border-slate-200/80 rounded-lg">
                            <InputField label="Policy Number / Application ID" value={extractedData.policyNumber || ''} onChange={(e) => setExtractedData(d => ({...d, policyNumber: e.target.value}))} />
                            <InputField label="Annual Premium ($)" type="number" value={extractedData.annualPremium || ''} onChange={(e) => setExtractedData(d => ({...d, annualPremium: parseFloat(e.target.value)}))} />
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Underwriting Status</label>
                                <select value={extractedData.underwritingStatus} onChange={(e) => setExtractedData(d => ({...d, underwritingStatus: e.target.value as PolicyUnderwritingStatus}))} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/50">
                                    {Object.values(PolicyUnderwritingStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                         <div className="flex justify-between mt-6 pt-6 border-t border-slate-200">
                            <button onClick={() => setStep(3)} className="bg-slate-200 text-slate-700 font-semibold px-6 py-2 rounded-lg hover:bg-slate-300">&larr; Re-analyze</button>
                            <button onClick={handleSavePolicy} disabled={isProcessing} className="bg-emerald-600 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:bg-emerald-700 disabled:bg-slate-400 flex items-center">
                                {isProcessing ? 'Saving...' : <><CheckCircleIcon className="w-5 h-5 mr-2" /> Confirm & Save Policy</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CarrierEAppsView;