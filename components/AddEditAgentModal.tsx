import React, { useState, useEffect } from 'react';
import { Agent, AgentStatus } from '../types';
import { CloseIcon, PlusIcon } from './icons';

interface AddEditAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (agentData: Agent) => void;
  agentToEdit: Agent | null;
}

const DEFAULT_NEW_AGENT_FORM_DATA: Omit<Agent, 'id' | 'slug' | 'leads' | 'clientCount' | 'conversionRate' | 'socials'> = {
    name: '',
    email: '',
    commissionRate: 0.75,
    location: '',
    phone: '',
    languages: [],
    bio: '',
    calendarLink: '',
    avatar: 'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg',
    status: AgentStatus.PENDING,
    joinDate: '',
};

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
      <label htmlFor={props.id || props.name} className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <input {...props} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
    </div>
);

const TextAreaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.id || props.name} className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
        <textarea {...props} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
    </div>
);

const AddEditAgentModal: React.FC<AddEditAgentModalProps> = ({ isOpen, onClose, onSave, agentToEdit }) => {
  const [formData, setFormData] = useState(agentToEdit || DEFAULT_NEW_AGENT_FORM_DATA);

  useEffect(() => {
    if (isOpen) {
      setFormData(agentToEdit || DEFAULT_NEW_AGENT_FORM_DATA);
    }
  }, [agentToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number' && name === 'commissionRate') {
      setFormData(prev => ({ ...prev, commissionRate: parseFloat(value) / 100 }));
    } else if (name === 'languages') {
      setFormData(prev => ({ ...prev, languages: value.split(',').map(s => s.trim()) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData(prev => ({ ...prev, avatar: event.target.result as string }));
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAgentData: Agent = {
      ...DEFAULT_NEW_AGENT_FORM_DATA, // Ensure all fields are present
      ...formData,
      id: agentToEdit?.id || 0, // ID 0 indicates a new agent
      slug: agentToEdit?.slug || '', // Slug will be generated in parent
      leads: agentToEdit?.leads || 0,
      clientCount: agentToEdit?.clientCount || 0,
      conversionRate: agentToEdit?.conversionRate || 0,
      socials: agentToEdit?.socials || {},
    };
    onSave(finalAgentData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 modal-backdrop">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto modal-panel">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">{agentToEdit ? 'Edit Agent Profile' : 'Add New Agent Application'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close modal" title="Close">
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
            <InputField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
            <InputField label="Phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
            <InputField label="Location (City, ST)" name="location" value={formData.location} onChange={handleChange} />
            <InputField label="Commission Rate (%)" name="commissionRate" type="number" value={formData.commissionRate * 100} onChange={handleChange} min="0" max="100" />
            <InputField label="Languages (comma-separated)" name="languages" value={formData.languages.join(', ')} onChange={handleChange} />
          </div>
          <TextAreaField label="Bio" name="bio" value={formData.bio} onChange={handleChange} rows={4} />
          <InputField label="Calendar Link" name="calendarLink" type="url" value={formData.calendarLink} onChange={handleChange} />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {agentToEdit ? 'Update Profile Picture' : 'Upload Profile Picture'}
            </label>
            <div className="flex items-center gap-4 mt-2">
              <img src={formData.avatar} alt="Avatar Preview" className="w-20 h-20 rounded-full object-cover border-2 border-slate-200" />
              <input
                type="file"
                name="avatar"
                accept="image/*"
                onChange={handleAvatarChange}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4 items-center gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-900 bg-white rounded-md shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-500 flex items-center">
              <PlusIcon className="w-5 h-5 mr-2" /> {agentToEdit ? 'Save Changes' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditAgentModal;