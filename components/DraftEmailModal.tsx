import React, { useState, useEffect } from 'react';
import { EmailDraft } from '../types';
import { CloseIcon, EnvelopeIcon } from './icons';

interface DraftEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  draft: EmailDraft | null;
  onSend: () => void;
}

const DraftEmailModal: React.FC<DraftEmailModalProps> = ({ isOpen, onClose, draft, onSend }) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (draft) {
      setSubject(draft.subject);
      setBody(draft.body);
    }
  }, [draft]);

  if (!isOpen || !draft) return null;

  const handleSend = () => {
    // In a real app, you'd send the subject and body to an email service
    onSend();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 modal-backdrop">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl m-4 modal-panel">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Draft Email</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close modal" title="Close">
            <CloseIcon />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">To:</label>
            <p className="mt-1 p-2 bg-slate-100 rounded-md text-slate-800">{draft.clientName} &lt;{draft.to}&gt;</p>
          </div>
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label htmlFor="body" className="block text-sm font-medium text-slate-700 mb-1.5">Body</label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <div className="flex justify-end items-center gap-3 mt-8">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-900 bg-white rounded-md shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 button-press">Cancel</button>
          <button onClick={handleSend} className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-500 flex items-center button-press">
            <EnvelopeIcon className="w-5 h-5 mr-2" /> Send Email
          </button>
        </div>
      </div>
    </div>
  );
};

export default DraftEmailModal;