import React, { useState } from 'react';
import { CloseIcon } from './icons';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string) => void;
}

const BroadcastModal: React.FC<BroadcastModalProps> = ({ isOpen, onClose, onSend }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 modal-backdrop">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg m-4 modal-panel">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Broadcast Announcement</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close modal" title="Close">
            <CloseIcon />
          </button>
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={8}
          className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Type your message here. It will be sent to all active Agents and Sub-Admins."
        />
        <div className="flex justify-end items-center gap-3 pt-4">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-900 bg-white rounded-md shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 button-press">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-500 disabled:bg-slate-400 button-press"
          >
            Send to All
          </button>
        </div>
      </div>
    </div>
  );
};

export default BroadcastModal;