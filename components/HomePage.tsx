import React from 'react';
import { ShieldCheckIcon, HeartIcon, HomeIcon, CarIcon, BuildingOfficeIcon, UsersIcon } from './icons';

interface HomePageProps {
  onNavigate: (view: string) => void;
}

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="text-center p-6 bg-white rounded-2xl shadow-premium hover:shadow-premium-lg hover:-translate-y-1 transition-all duration-300 card-enter">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 text-primary-600 mx-auto mb-4">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-secondary mb-2">{title}</h3>
        <p className="text-slate-600 text-sm leading-relaxed">{children}</p>
    </div>
);

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="page-enter font-sans">
      {/* Hero Section */}
      <section className="relative bg-secondary text-white py-24 md:py-32">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop')" }}
        ></div>
        <div className="container mx-auto px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight mb-4" style={{ animation: `slideInUp 0.5s ease-out`}}>
            Insurance That Powers Your Progress
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-8" style={{ animation: `slideInUp 0.5s ease-out 0.2s backwards`}}>
            Get covered in minutes. We offer straightforward, reliable insurance solutions to protect you, your family, and your business.
          </p>
          <div className="flex justify-center items-center gap-4" style={{ animation: `slideInUp 0.5s ease-out 0.4s backwards`}}>
            <button onClick={() => onNavigate('shop')} className="bg-primary-600 text-white font-bold px-8 py-3 rounded-lg shadow-lg hover:bg-primary-700 transition-transform hover:scale-105 button-press">
              Shop for Insurance
            </button>
            <button onClick={() => onNavigate('find-advisor')} className="bg-white/10 border border-white/20 text-white font-bold px-8 py-3 rounded-lg shadow-lg hover:bg-white/20 transition-transform hover:scale-105 button-press">
              Find an Advisor
            </button>
          </div>
        </div>
      </section>

      {/* Services Overview Section */}
      <section className="py-20 bg-light">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary">What We Offer</h2>
            <p className="text-slate-600 mt-2 max-w-2xl mx-auto">From personal protection to business security, we provide a comprehensive range of insurance products to meet your needs.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard icon={<HeartIcon className="w-8 h-8"/>} title="Life Insurance">Secure your family's future with tailored life insurance policies, including term, whole, and universal life options.</FeatureCard>
            <FeatureCard icon={<ShieldCheckIcon className="w-8 h-8"/>} title="Health & Benefits">Access individual and group plans for medical, dental, and supplemental needs to keep your team healthy and protected.</FeatureCard>
            <FeatureCard icon={<HomeIcon className="w-8 h-8"/>} title="Home & Property">Protect your home, belongings, and rental properties from fire, theft, and other unexpected events.</FeatureCard>
            <FeatureCard icon={<CarIcon className="w-8 h-8"/>} title="Auto Insurance">Reliable coverage for your personal cars, classic vehicles, and commercial fleets.</FeatureCard>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="relative">
                    <img src="https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=1974&auto=format&fit=crop" alt="Insurance agent with clients" className="rounded-2xl shadow-xl w-full" />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">Why Choose New Holland Financial?</h2>
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    We're more than just an insurance agency; we're your partners in building a secure financial future. Our mission is rooted in integrity, experience, and a deep commitment to personalized service. We work with you to understand your unique needs and find the perfect coverage from top-rated carriers.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-start"><UsersIcon className="w-6 h-6 text-primary-600 mr-3 mt-1 flex-shrink-0" /><p className="text-slate-600"><strong>Expert Advisors:</strong> Our team of licensed professionals provides clear, unbiased guidance to help you make informed decisions.</p></div>
                    <div className="flex items-start"><BuildingOfficeIcon className="w-6 h-6 text-primary-600 mr-3 mt-1 flex-shrink-0" /><p className="text-slate-600"><strong>Top-Rated Carriers:</strong> We partner with the nation's most reputable insurance companies to offer you reliable and competitive products.</p></div>
                    <div className="flex items-start"><ShieldCheckIcon className="w-6 h-6 text-primary-600 mr-3 mt-1 flex-shrink-0" /><p className="text-slate-600"><strong>Claims Support:</strong> When you need us most, we're here to help you navigate the claims process smoothly and efficiently.</p></div>
                  </div>
                </div>
            </div>
        </div>
      </section>
      
        {/* Call to Action Section */}
        <section className="bg-secondary">
            <div className="container mx-auto px-6 lg:px-8 py-20 text-center text-white">
                <h2 className="text-3xl font-bold mb-2">Ready to Secure Your Future?</h2>
                <p className="max-w-2xl mx-auto mb-8 text-slate-300">Let's talk. A short conversation with one of our expert advisors can help you find the perfect coverage. Get started with a no-obligation quote today.</p>
                <button onClick={() => onNavigate('contact')} className="bg-primary-600 text-white font-bold px-10 py-4 rounded-lg shadow-xl text-lg hover:bg-primary-700 transition-transform hover:scale-105 button-press">
                    Request a Free Consultation
                </button>
            </div>
        </section>
    </div>
  );
};

export default HomePage;