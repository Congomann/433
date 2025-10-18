import React from 'react';
import { CrmLogoIcon, LinkedInIcon, FacebookIcon, InstagramIcon, TwitterIcon } from './icons';

interface PublicFooterProps {
  onNavigate: (view: string) => void;
}

const PublicFooter: React.FC<PublicFooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-secondary text-white font-sans">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-4">
            <CrmLogoIcon variant="dark" className="w-48" />
            <p className="text-slate-400 text-sm pr-8">
              Providing tailored insurance solutions that secure financial peace of mind for individuals, families, and businesses.
            </p>
            <div className="flex space-x-4 text-slate-400">
                <a href="#" className="hover:text-white transition-colors"><LinkedInIcon className="w-5 h-5" /></a>
                <a href="#" className="hover:text-white transition-colors"><FacebookIcon className="w-5 h-5" /></a>
                <a href="#" className="hover:text-white transition-colors"><InstagramIcon className="w-5 h-5" /></a>
                <a href="#" className="hover:text-white transition-colors"><TwitterIcon className="w-5 h-5" /></a>
            </div>
          </div>
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Navigation</h3>
              <ul className="mt-4 space-y-2 text-slate-400">
                <li><a href="#/home" onClick={() => onNavigate('home')} className="hover:text-white transition-colors">Home</a></li>
                <li><a href="#/shop" onClick={() => onNavigate('shop')} className="hover:text-white transition-colors">Shop Insurance</a></li>
                <li><a href="#/find-advisor" onClick={() => onNavigate('find-advisor')} className="hover:text-white transition-colors">Find an Advisor</a></li>
                <li><a href="#/resources" onClick={() => onNavigate('resources')} className="hover:text-white transition-colors">Resources</a></li>
                <li><a href="#/contact" onClick={() => onNavigate('contact')} className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
             <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Solutions</h3>
              <ul className="mt-4 space-y-2 text-slate-400">
                <li><a href="#/shop" onClick={() => onNavigate('shop')} className="hover:text-white transition-colors">Life Insurance</a></li>
                <li><a href="#/shop" onClick={() => onNavigate('shop')} className="hover:text-white transition-colors">Health & Benefits</a></li>
                <li><a href="#/shop" onClick={() => onNavigate('shop')} className="hover:text-white transition-colors">Home & Property</a></li>
                <li><a href="#/shop" onClick={() => onNavigate('shop')} className="hover:text-white transition-colors">Auto & Commercial</a></li>
              </ul>
            </div>
             <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Company</h3>
              <ul className="mt-4 space-y-2 text-slate-400">
                <li><a href="#/about" onClick={() => onNavigate('about')} className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#/dashboard" onClick={() => onNavigate('dashboard')} className="hover:text-white transition-colors">Agent Portal</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Contact Us</h3>
              <ul className="mt-4 space-y-2 text-slate-400">
                <li><a href="mailto:Info@newhollandfinancial.com">Info@newhollandfinancial.com</a></li>
                <li><a href="tel:717-847-9638">(717) 847-9638</a></li>
                <li>Des Moines, IA</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} New Holland Financial Group | www.newhollandfinancial.com</p>
          <p className="mt-2 text-xs max-w-3xl mx-auto">This website is for informational purposes only and does not constitute a complete description of our investment services or performance. This website is in no way a solicitation or offer to sell securities or investment advisory services except, where applicable, in states where we are registered or where an exemption or exclusion from such registration exists.</p>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;