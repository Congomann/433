import React from 'react';
import { CrmLogoIcon } from './icons';

interface PublicHeaderProps {
  onNavigate: (view: string) => void;
}

const PublicHeader: React.FC<PublicHeaderProps> = ({ onNavigate }) => {
  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <button onClick={() => onNavigate('home')} aria-label="Go to homepage" title="New Holland Financial Group Homepage">
            <CrmLogoIcon className="w-48" />
          </button>
          <nav className="hidden lg:flex items-center space-x-8 text-sm font-semibold text-secondary">
            <a href="#/shop" onClick={(e) => { e.preventDefault(); onNavigate('shop'); }} className="hover:text-primary-600 transition-colors">Shop Insurance</a>
            <a href="#/find-advisor" onClick={(e) => { e.preventDefault(); onNavigate('find-advisor'); }} className="hover:text-primary-600 transition-colors">Find an Advisor</a>
            <a href="#/resources" onClick={(e) => { e.preventDefault(); onNavigate('resources'); }} className="hover:text-primary-600 transition-colors">Resources</a>
            <a href="#/contact" onClick={(e) => { e.preventDefault(); onNavigate('contact'); }} className="hover:text-primary-600 transition-colors">Contact</a>
          </nav>
          <div className="flex items-center space-x-4">
            <button onClick={() => onNavigate('dashboard')} className="bg-primary-600 text-white font-bold px-5 py-2.5 rounded-lg text-sm shadow-md hover:bg-primary-700 transition-colors button-hover button-press">
              Agent Portal
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;