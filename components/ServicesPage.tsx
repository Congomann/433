import React from 'react';
import { INSURANCE_SERVICES, InsuranceService } from '../constants';

const ServiceCard: React.FC<{ service: InsuranceService }> = ({ service }) => (
    <div className="bg-white rounded-2xl shadow-premium hover:shadow-premium-lg hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden border border-slate-200/50">
        <div className="p-6">
            <div className="flex items-center mb-4">
                <div className="bg-primary-100 text-primary-600 p-3 rounded-xl mr-4">
                    {service.icon}
                </div>
                <h3 className="text-xl font-bold text-secondary">{service.title}</h3>
            </div>
            <p className="text-slate-600 text-sm mb-4 min-h-[60px]">{service.overview}</p>
        </div>
        <div className="bg-slate-50 p-6 mt-auto border-t border-slate-200/80">
            <ul className="space-y-2">
                {service.benefits.slice(0, 3).map((benefit, i) => (
                    <li key={i} className="flex items-start text-sm text-slate-700">
                        <svg className="w-4 h-4 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        <span dangerouslySetInnerHTML={{ __html: benefit }} />
                    </li>
                ))}
            </ul>
        </div>
    </div>
);

const ServicesPage: React.FC = () => {
    const categories = ['Life', 'Auto & Commercial', 'Property & Health'];
    
    return (
        <div className="bg-light py-16 page-enter">
            <div className="container mx-auto px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-secondary">Shop Insurance Solutions</h1>
                    <p className="text-slate-600 mt-4 max-w-3xl mx-auto text-lg">
                        Explore our comprehensive range of insurance products designed to protect every aspect of your life and business. Find the perfect coverage to secure your financial future.
                    </p>
                </div>
                
                {categories.map(category => (
                    <div key={category} className="mb-16">
                        <h2 className="text-3xl font-bold text-secondary border-b-2 border-primary-500 pb-2 mb-8 inline-block">
                            {category} Insurance
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {INSURANCE_SERVICES.filter(s => s.category === category).map((service, index) => (
                                <ServiceCard key={index} service={service} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ServicesPage;
