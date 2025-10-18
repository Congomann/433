import React, { useState } from 'react';
import { License, LicenseType } from '../types';
import { TrashIcon, PlusIcon } from './icons';

interface AgentLicensesProps {
    agentId: number;
    licenses: License[];
    onAddLicense: (licenseData: Omit<License, 'id'>) => void;
    onDeleteLicense: (licenseId: number) => void;
}

const AgentLicenses: React.FC<AgentLicensesProps> = ({ agentId, licenses, onAddLicense, onDeleteLicense }) => {
    const [form, setForm] = useState({
        type: LicenseType.HOME,
        state: '',
        licenseNumber: '',
        expirationDate: '',
        fileName: '',
        fileContent: '',
    });
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setForm(prev => ({
                        ...prev,
                        fileName: file.name,
                        fileContent: event.target!.result as string
                    }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!form.fileContent) {
            setError('Please select a file to upload.');
            return;
        }
        onAddLicense({ agentId, ...form });
        // Reset form
        setForm({
            type: LicenseType.HOME, state: '', licenseNumber: '', expirationDate: '', fileName: '', fileContent: ''
        });
        (e.target as HTMLFormElement).reset();
    };

    const getStatusIndicator = (expDate: string) => {
        if (!expDate || !/^\d{4}-\d{2}-\d{2}$/.test(expDate)) {
            return null; // Invalid date format
        }

        const [year, month, day] = expDate.split('-').map(Number);
        // Date.UTC months are 0-indexed
        const expirationDate = new Date(Date.UTC(year, month - 1, day));

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setUTCDate(today.getUTCDate() + 30);

        if (expirationDate.getTime() < today.getTime()) {
            return <span className="px-2 py-1 text-xs font-semibold text-rose-800 bg-rose-100 rounded-full">Expired</span>;
        }
        if (expirationDate.getTime() <= thirtyDaysFromNow.getTime()) {
            return <span className="px-2 py-1 text-xs font-semibold text-amber-800 bg-amber-100 rounded-full">Expires Soon</span>;
        }
        return <span className="px-2 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 rounded-full">Valid</span>;
    };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Add New License</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">License Type</label>
                        <select name="type" value={form.type} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                            {Object.values(LicenseType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">State (e.g., TX)</label>
                        <input type="text" name="state" value={form.state} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">License Number</label>
                        <input type="text" name="licenseNumber" value={form.licenseNumber} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Expiration Date</label>
                        <input type="date" name="expirationDate" value={form.expirationDate} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1.5">License Document</label>
                         <input type="file" name="file" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" required className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100"/>
                    </div>
                    {error && <p className="text-sm text-rose-600 bg-rose-50 p-2 rounded-md">{error}</p>}
                    <button type="submit" className="w-full flex items-center justify-center bg-primary-600 text-white font-semibold px-4 py-2.5 rounded-md shadow-sm hover:bg-primary-500">
                        <PlusIcon className="w-5 h-5 mr-2" /> Add License
                    </button>
                </form>
            </div>
             <div className="bg-white rounded-lg border border-slate-200 p-6">
                 <h3 className="text-xl font-bold text-slate-800 mb-4">Uploaded Licenses</h3>
                 <div className="space-y-3 max-h-96 overflow-y-auto">
                    {licenses.length > 0 ? licenses.map(lic => (
                        <div key={lic.id} className="p-3 border border-slate-200 rounded-md bg-slate-50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-slate-700">{lic.type} - {lic.state.toUpperCase()}</p>
                                    <p className="text-sm text-slate-500">#{lic.licenseNumber}</p>
                                    {lic.fileContent ? (
                                        <a href={lic.fileContent} target="_blank" rel="noopener noreferrer" download={lic.fileName} className="text-sm text-primary-600 hover:underline">
                                            View: {lic.fileName}
                                        </a>
                                    ) : (
                                        <p className="text-sm text-slate-500">File: {lic.fileName}</p>
                                    )}
                                </div>
                                <button onClick={() => onDeleteLicense(lic.id)} className="text-slate-400 hover:text-rose-600" aria-label="Delete license" title="Delete license"><TrashIcon /></button>
                            </div>
                            <div className="flex justify-between items-center mt-2 text-sm border-t border-slate-200 pt-2">
                                <p>Expires: {lic.expirationDate}</p>
                                {getStatusIndicator(lic.expirationDate)}
                            </div>
                        </div>
                    )) : (
                        <p className="text-slate-500 text-center pt-8">No licenses uploaded yet.</p>
                    )}
                 </div>
            </div>
        </div>
    )
};

export default AgentLicenses;