import React from 'react';
import { BuildingOfficeIcon, CarIcon, ClientsIcon, EnvelopeIcon, HeartIcon, HomeIcon, PhoneIcon, ShieldIcon } from './icons';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white p-6 rounded-lg border border-slate-200 mb-8 card-enter">
    <h2 className="text-2xl font-bold text-slate-800 border-b border-slate-200 pb-3 mb-4">{title}</h2>
    <div className="prose prose-slate max-w-none">{children}</div>
  </div>
);

const ServiceCategory: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 not-prose">
        <div className="flex items-center text-xl font-semibold text-primary-700">
            {icon}
            <h3 className="ml-3 my-0">{title}</h3>
        </div>
        <div className="mt-4 pl-4 border-l-2 border-primary-200 space-y-6">
            {children}
        </div>
    </div>
);

const ServiceItem: React.FC<{ title: string; description: string; benefits: string }> = ({ title, description, benefits }) => (
    <div>
        <h4 className="font-bold text-slate-800 text-base my-0">{title}</h4>
        <p className="text-slate-600 mt-1 mb-0 text-sm">{description}</p>
        <p className="text-sm text-slate-500 mt-1 mb-0"><strong className="font-semibold text-slate-600">Benefits:</strong> {benefits}</p>
    </div>
);

const WebsiteStructureView: React.FC = () => {
    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-800">Website Structure – New Holland Financial Group</h1>
                <p className="text-slate-600 text-lg"><strong>Domain:</strong> www.newhollandfinancial.com</p>
                <div className="flex items-center gap-6 mt-2 text-slate-500 text-sm">
                    <p><strong>Headquarters:</strong> Des Moines, IA</p>
                    <div className="flex items-center gap-1"><PhoneIcon className="w-4 h-4" /> (717) 847-9638</div>
                    <div className="flex items-center gap-1"><EnvelopeIcon className="w-4 h-4" /> Info@newhollandfinancial.com</div>
                </div>
            </div>

            <Section title="1. Home Page">
                <h4>Goal</h4>
                <p>Build trust, highlight core services, capture leads.</p>
                <h4>Hero Section</h4>
                <ul>
                    <li><strong>Headline:</strong> “Protect What Matters Most — Your Life, Family & Future.”</li>
                    <li><strong>CTA Buttons:</strong> “Get a Free Quote” | “Speak with an Advisor”</li>
                    <li><strong>Background:</strong> Professional family / insurance imagery</li>
                </ul>
                <h4>About New Holland Financial</h4>
                <ul>
                    <li>Short intro about integrity, experience, and personalized service.</li>
                    <li><strong>Mission:</strong> “Providing tailored insurance solutions that secure financial peace of mind for individuals, families, and businesses.”</li>
                </ul>
                <h4>Core Services Overview</h4>
                <p>Cards for Life Insurance, Auto & Commercial, Property Insurance, Health Insurance, Group Benefits. Each card links to detailed pages.</p>
                <h4>Why Choose Us</h4>
                <ul>
                    <li>✅ Trusted Carriers</li>
                    <li>✅ Personalized Coverage</li>
                    <li>✅ Licensed Agents in Multiple States</li>
                    <li>✅ Fast Claims Assistance</li>
                </ul>
                 <h4>Quote Section</h4>
                <p>Embedded form (Name, Email, Phone, Service Needed)</p>
            </Section>

            <Section title="2. About Us Page">
                <h4>Purpose</h4>
                <p>Establish credibility.</p>
                <h4>Content</h4>
                <ul>
                    <li>Company history, mission, and vision.</li>
                    <li>Mention of professional ethics and customer commitment.</li>
                    <li><strong>Team highlight:</strong> “Licensed professionals dedicated to helping clients build long-term financial security.”</li>
                </ul>
            </Section>

            <Section title="3. Services">
                <div className="space-y-6">
                    <ServiceCategory title="Life Insurance" icon={<ShieldIcon className="w-6 h-6" />}>
                        <ServiceItem title="Whole Life Insurance" description="Permanent coverage that builds cash value over time." benefits="Lifetime protection, tax-deferred growth, and borrowing options." />
                        <ServiceItem title="Universal Life Insurance" description="Flexible premiums and adjustable death benefits." benefits="Cash value growth, flexibility, and tax advantages." />
                        <ServiceItem title="Indexed Universal Life (IUL)" description="Tied to market performance (S&P 500) with downside protection." benefits="Growth potential, living benefits, tax-free loans." />
                        <ServiceItem title="Annuities" description="Guaranteed income for retirement." benefits="Lifetime income, principal protection, and growth options." />
                        <ServiceItem title="Term Life" description="Affordable coverage for a set period (10, 20, 30 years)." benefits="High coverage, low cost, simple protection." />
                        <ServiceItem title="Term Life with Living Benefits" description="Adds protection for illness or injury." benefits="Access cash while living for critical, chronic, or terminal conditions." />
                    </ServiceCategory>
                    <ServiceCategory title="Auto & Commercial Insurance" icon={<CarIcon className="w-6 h-6" />}>
                         <ServiceItem title="Passenger Auto" description="Protection for everyday vehicles." benefits="Covers liability, collision, and comprehensive damages." />
                         <ServiceItem title="Classic & Custom Cars" description="Tailored coverage for collectible and modified vehicles." benefits="Agreed value coverage, specialized claims handling." />
                         <ServiceItem title="Commercial (Heavy-Duty) Vehicles" description="Coverage for trucks, fleets, and contractors." benefits="Protects against liability, damage, and downtime." />
                         <ServiceItem title="Property & Casualty" description="Bundled protection for your property (home, auto) and against liability." benefits="Comprehensive asset protection, bundled discounts." />
                    </ServiceCategory>
                     <ServiceCategory title="Property Insurance" icon={<HomeIcon className="w-6 h-6" />}>
                         <ServiceItem title="Homeowners Insurance" description="Protection for home, belongings, and liability." benefits="Covers damage, theft, and personal liability." />
                         <ServiceItem title="Renters Insurance" description="Protects personal items and provides liability coverage." benefits="Affordable way to protect your belongings." />
                         <ServiceItem title="Theft, Flood & Fire Coverage" description="Add-ons for natural and accidental damages." benefits="Comprehensive protection against specific perils." />
                         <ServiceItem title="Real Estate Insurance" description="Coverage for residential and commercial real estate investments." benefits="Landlord protection, loss of rent, and liability coverage." />
                    </ServiceCategory>
                    <ServiceCategory title="Health Insurance" icon={<HeartIcon className="w-6 h-6" />}>
                        <ServiceItem title="Health & Dental" description="Individual and family medical coverage." benefits="Access to quality care, preventive benefits, and affordable premiums." />
                        <ServiceItem title="Critical Illness" description="Provides a lump-sum payment upon diagnosis of a covered illness." benefits="Lump-sum cash, use funds for any purpose, supplements health insurance." />
                    </ServiceCategory>
                    <ServiceCategory title="Group Benefits" icon={<ClientsIcon className="w-6 h-6" />}>
                        <ServiceItem title="Supplemental Health Plans" description="Protect income during illness or injury." benefits="Cash benefits paid directly to you." />
                        <ServiceItem title="Family Health Insurance" description="Group options for dependents and employees." benefits="Affordable group rates and comprehensive coverage." />
                        <ServiceItem title="Income Protector" description="Provides monthly income if unable to work." benefits="Replaces a portion of your income during disability." />
                        <ServiceItem title="Accidental AD & Disability" description="Covers long and short-term disabilities and accidents." benefits="Financial support during recovery." />
                    </ServiceCategory>
                </div>
            </Section>

            <Section title="4. Get a Quote / Contact Page">
                <h4>Form Fields</h4>
                <ul>
                    <li>Name, Phone, Email, Type of Insurance, Notes / Message</li>
                </ul>
                <h4>Contact Info</h4>
                <ul>
                    <li>📍 Des Moines, IA</li>
                    <li>📞 (717) 847-9638</li>
                    <li>✉️ Info@newhollandfinancial.com</li>
                </ul>
                 <h4>CTA</h4>
                <p>“Request Your Free Quote Today!”</p>
            </Section>
            
            <Section title="5. Admin, Sub-Admin, & Agent Portal">
                 <p>This is the CRM integration point. Users with credentials can log in to:</p>
                 <ul>
                    <li>Upload and manage licenses.</li>
                    <li>Manage assigned leads and clients.</li>
                    <li>Track commissions and performance.</li>
                </ul>
            </Section>
            
            <Section title="6. Footer">
                 <ul>
                    <li><strong>Quick Links:</strong> Home, Services, Contact, Privacy Policy</li>
                    <li>License disclaimer</li>
                    <li>Copyright © 2025 New Holland Financial Group</li>
                    <li>Social icons (LinkedIn, Facebook, Instagram)</li>
                </ul>
            </Section>

        </div>
    );
};

export default WebsiteStructureView;