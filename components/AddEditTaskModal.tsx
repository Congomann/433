import React, { useState, useEffect } from 'react';
import { Task, Client } from '../types';
import { CloseIcon, PlusIcon } from './icons';

interface AddEditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'completed'> & { id?: number }) => void;
  // FIX: Allow a partial Task object for pre-filling the modal when creating a new task.
  taskToEdit?: Partial<Task> | null;
  clients: Client[];
}

const AddEditTaskModal: React.FC<AddEditTaskModalProps> = ({ isOpen, onClose, onSave, taskToEdit, clients }) => {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [clientId, setClientId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (taskToEdit) {
      // FIX: Add fallbacks to handle the partial task object.
      setTitle(taskToEdit.title || '');
      setDueDate(taskToEdit.dueDate || '');
      setClientId(taskToEdit.clientId);
    } else {
      // Reset form for new task
      setTitle('');
      setDueDate('');
      setClientId(undefined);
    }
  }, [taskToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) return;

    onSave({
      id: taskToEdit?.id,
      title,
      dueDate,
      clientId: clientId ? Number(clientId) : undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 modal-backdrop">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md m-4 modal-panel">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">{taskToEdit?.id ? 'Edit Task' : 'Add New Task'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close modal" title="Close">
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1.5">Task Title</label>
            <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" required />
          </div>
          <div className="mb-4">
            <label htmlFor="dueDate" className="block text-sm font-medium text-slate-700 mb-1.5">Due Date</label>
            <input type="date" id="dueDate" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" required />
          </div>
          <div className="mb-6">
            <label htmlFor="client" className="block text-sm font-medium text-slate-700 mb-1.5">Associated Client (Optional)</label>
            <select id="client" value={clientId || ''} onChange={(e) => setClientId(e.target.value ? Number(e.target.value) : undefined)} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">None</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.firstName} {client.lastName}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end items-center gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-900 bg-white rounded-md shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-500 flex items-center">
              <PlusIcon className="w-5 h-5 mr-2" /> {taskToEdit?.id ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditTaskModal;
