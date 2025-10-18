import React from 'react';
import { CrmLogoIcon } from '../icons';
import { User } from '../../types';

interface OnboardingHeaderProps {
  user: User;
}

const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({ user }) => {
  const userInitials = user.name.split(' ').map(n => n[0]).join('');

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="container mx-auto px-6 lg:px-8 py-4 flex justify-between items-center">
        <CrmLogoIcon className="w-48" variant="light" />
        <div className="flex items-center">
          <span className="text-sm font-semibold text-slate-700 mr-3">{user.name}</span>
          <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
            {userInitials}
          </div>
        </div>
      </div>
    </header>
  );
};

export default OnboardingHeader;
