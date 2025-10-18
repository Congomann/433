import React from 'react';
import { CrmLogoIcon } from './icons';

interface PendingApprovalProps {
  onLogout: () => void;
}

const PendingApproval: React.FC<PendingApprovalProps> = ({ onLogout }) => {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8 text-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <CrmLogoIcon className="w-auto h-12 mx-auto" />
        <h2 className="mt-6 text-3xl font-extrabold text-slate-900">
          Account Pending Approval
        </h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-slate-200">
          <p className="text-slate-600">
            Thank you for registering. Your account is currently awaiting approval from an administrator.
          </p>
          <p className="mt-4 text-slate-600">
            You will be notified via email once your account has been activated. Please check back later.
          </p>
          <div className="mt-8">
            <button
              onClick={onLogout}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;