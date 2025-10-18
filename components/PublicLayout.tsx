import React from 'react';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';

interface PublicLayoutProps {
  children: React.ReactNode;
  onNavigate: (view: string) => void;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children, onNavigate }) => {
  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      <PublicHeader onNavigate={onNavigate} />
      <main className="flex-grow">
        {children}
      </main>
      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
};

export default PublicLayout;