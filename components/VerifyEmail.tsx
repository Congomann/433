import React, { useState } from 'react';
import { User } from '../types';
import { CrmLogoIcon } from './icons';

interface VerifyEmailProps {
  user: User | null;
  onVerify: (userId: number, code: string) => Promise<void>;
  onNavigateToLogin: () => void;
}

const VerifyEmail: React.FC<VerifyEmailProps> = ({ user, onVerify, onNavigateToLogin }) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user && code) {
      setIsLoading(true);
      await onVerify(user.id, code);
      // Don't set loading to false; parent will switch views on success,
      // or show an error toast on failure. We'll reset it in case of failure.
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
            <p className="text-slate-600">No user specified for verification.</p>
            <button onClick={onNavigateToLogin} className="mt-4 font-medium text-primary-600 hover:text-primary-500">
                Back to Login
            </button>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <CrmLogoIcon className="w-auto h-12 mx-auto" />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Verify your email address
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          We've sent a verification code to <strong>{user.email}</strong>.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-slate-200">
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099c.636-1.21 2.864-1.21 3.5 0l5.857 11.127a2.121 2.121 0 01-1.75 3.274H4.15a2.121 2.121 0 01-1.75-3.274L8.257 3.099zM9 10a1 1 0 112 0v3a1 1 0 11-2 0v-3zm2 5a1 1 0 10-2 0 1 1 0 002 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-700">
                  This is a simulation. In a real app, this code would be sent to your email.
                  <br/> Your verification code is: <strong className="font-bold text-amber-800">{user.verificationCode}</strong>
                </p>
              </div>
            </div>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-slate-700">
                Verification Code
              </label>
              <div className="mt-1">
                <input
                  id="code"
                  name="code"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 uppercase"
                  placeholder="Enter 6-character code"
                />
              </div>
            </div>
            <div>
              <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400">
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </button>
            </div>
          </form>
           <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
                Entered the wrong email?{' '}
                <button onClick={onNavigateToLogin} className="font-medium text-primary-600 hover:text-primary-500">
                    Back to Login
                </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;