import React, { useEffect, useState, useCallback } from 'react';
import { ToastType } from '../types';
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, InfoIcon, CloseIcon } from './icons';

interface ToastProps {
  id: string;
  title: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircleIcon className="h-6 w-6 text-emerald-400" />,
  error: <XCircleIcon className="h-6 w-6 text-rose-400" />,
  warning: <ExclamationTriangleIcon className="h-6 w-6 text-amber-400" />,
  info: <InfoIcon className="h-6 w-6 text-sky-400" />,
};

const BG_COLORS: Record<ToastType, string> = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    warning: 'bg-amber-500',
    info: 'bg-sky-500',
};

const Toast: React.FC<ToastProps> = ({ id, title, message, type, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    const handleClose = useCallback(() => {
        setIsExiting(true);
        setTimeout(() => onClose(id), 500); // Wait for animation to finish
    }, [id, onClose]);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, 5000); // Auto-dismiss after 5 seconds

        return () => {
            clearTimeout(timer);
        };
    }, [id, handleClose]);


    return (
        <div className={`w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${isExiting ? 'toast-leave' : 'toast-enter'}`}>
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        {ICONS[type]}
                    </div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        <p className="text-sm font-medium text-slate-900">{title}</p>
                        <p className="mt-1 text-sm text-slate-500">{message}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button onClick={handleClose} className="bg-white rounded-md inline-flex text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                            <span className="sr-only">Close</span>
                            <CloseIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
            <div className={`h-1 ${BG_COLORS[type]}`}></div>
        </div>
    );
};

export default Toast;