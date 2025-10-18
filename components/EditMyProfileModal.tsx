import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { CloseIcon } from './icons';

interface EditMyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: User) => void;
  currentUser: User;
}

const EditMyProfileModal: React.FC<EditMyProfileModalProps> = ({ isOpen, onClose, onSave, currentUser }) => {
  const [formData, setFormData] = useState<User>(currentUser);

  useEffect(() => {
    if (isOpen) {
      setFormData(currentUser);
    }
  }, [currentUser, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 modal-backdrop">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md m-4 modal-panel">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Edit My Profile</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close modal" title="Close">
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Profile Picture
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
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" required />
          </div>
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
            <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" required />
          </div>

          <div className="flex justify-end pt-4 items-center gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-900 bg-white rounded-md shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-500 flex items-center">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMyProfileModal;