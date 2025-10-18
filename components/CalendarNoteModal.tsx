import React, { useState, useEffect } from 'react';
import { CalendarNote, User } from '../types';
import { CloseIcon, PlusIcon, TagIcon, TrashIcon, PencilIcon } from './icons';
import { NOTE_COLORS } from '../constants';

interface CalendarNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteData: Omit<CalendarNote, 'id'> & { id?: number }) => void;
  onDelete: (noteId: number) => void;
  selectedDate: Date;
  notesForDay: CalendarNote[];
  currentUser: User;
  users: User[];
}

const CalendarNoteModal: React.FC<CalendarNoteModalProps> = ({ isOpen, onClose, onSave, onDelete, selectedDate, notesForDay, currentUser, users }) => {
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0].name);
  const [editingNote, setEditingNote] = useState<CalendarNote | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setNewNoteText('');
      setSelectedColor(NOTE_COLORS[0].name);
      setEditingNote(null);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (editingNote) {
      if (editingNote.text.trim() === '') return;
      onSave({ ...editingNote });
    } else {
      if (newNoteText.trim() === '') return;
      onSave({
        date: selectedDate.toISOString().split('T')[0],
        text: newNoteText,
        color: selectedColor,
        userId: currentUser.id,
      });
    }
    setNewNoteText('');
    setSelectedColor(NOTE_COLORS[0].name);
    setEditingNote(null);
  };

  const getUserById = (id: number) => users.find(u => u.id === id);

  if (!isOpen) return null;

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(selectedDate);

  const NoteItem: React.FC<{ note: CalendarNote }> = ({ note }) => {
    const noteCreator = getUserById(note.userId);
    const isEditingThis = editingNote?.id === note.id;
    const color = NOTE_COLORS.find(c => c.name === note.color);

    return (
      <div className={`p-3 rounded-lg ${color?.bg || 'bg-slate-100'}`}>
        {isEditingThis ? (
          <textarea
            value={editingNote.text}
            onChange={(e) => setEditingNote(prev => prev ? { ...prev, text: e.target.value } : null)}
            className="w-full p-2 border border-slate-300 rounded-md"
            rows={3}
          />
        ) : (
          <p className="text-slate-800 whitespace-pre-wrap">{note.text}</p>
        )}
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-300/50">
          <div className="flex items-center">
            <img src={noteCreator?.avatar} alt={noteCreator?.name} className="w-6 h-6 rounded-full mr-2" />
            <span className="text-xs font-medium text-slate-600">{noteCreator?.name}</span>
          </div>
          {note.userId === currentUser.id && (
            <div className="flex items-center space-x-2">
              {isEditingThis ? (
                <>
                  <button onClick={handleSave} className="text-xs font-semibold text-emerald-600 hover:underline">Save</button>
                  <button onClick={() => setEditingNote(null)} className="text-xs text-slate-500 hover:underline">Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditingNote(note)} className="text-slate-500 hover:text-primary-600" aria-label="Edit note" title="Edit note"><PencilIcon className="w-4 h-4" /></button>
                  <button onClick={() => onDelete(note.id)} className="text-slate-500 hover:text-rose-600" aria-label="Delete note" title="Delete note"><TrashIcon className="w-4 h-4" /></button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 modal-backdrop">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4 modal-panel">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900">{formattedDate}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close modal" title="Close"><CloseIcon /></button>
        </div>
        
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 mb-4">
          {notesForDay.length > 0 ? (
            notesForDay.map(note => <NoteItem key={note.id} note={note} />)
          ) : (
            <p className="text-slate-500 text-center py-4">No notes for this day yet.</p>
          )}
        </div>

        {!editingNote && (
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Add a new note</h3>
            <textarea
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Write your note here..."
              className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
            />
            <div className="flex justify-between items-center mt-3">
              <div className="flex items-center space-x-2">
                <TagIcon className="text-slate-500" />
                {NOTE_COLORS.map(color => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`w-6 h-6 rounded-full ${color.bg} transition-transform hover:scale-110 ${selectedColor === color.name ? `ring-2 ${color.ring} ring-offset-2` : ''}`}
                    aria-label={`Select ${color.name} color`}
                    title={color.name}
                  />
                ))}
              </div>
              <button
                onClick={handleSave}
                disabled={!newNoteText.trim()}
                className="flex items-center bg-primary-600 text-white font-semibold px-4 py-2 rounded-md shadow-sm hover:bg-primary-500 disabled:bg-slate-400 button-press"
              >
                <PlusIcon className="w-5 h-5 mr-2" /> Add Note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarNoteModal;