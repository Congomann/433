import React, { useState, useMemo } from 'react';
import { Agent } from '../types';
import { SearchIcon, LocationPinIcon, PhoneIcon } from './icons';

interface FindAdvisorPageProps {
  agents: Agent[];
  onNavigate: (path: string) => void;
}

const FindAdvisorPage: React.FC<FindAdvisorPageProps> = ({ agents, onNavigate }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredAgents = useMemo(() => {
        return agents.filter(agent =>
            agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agent.location.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [agents, searchTerm]);

    return (
        <div className="bg-light py-16 page-enter">
            <div className="container mx-auto px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-secondary">Find an Advisor</h1>
                    <p className="text-slate-600 mt-4 max-w-2xl mx-auto text-lg">
                        Connect with one of our licensed insurance professionals. Our advisors are ready to help you find the perfect coverage for your needs.
                    </p>
                </div>

                <div className="max-w-xl mx-auto mb-12">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name or location (e.g., 'Dallas, TX')"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-lg"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredAgents.map(agent => (
                        <div key={agent.id} className="bg-white rounded-2xl shadow-premium hover:shadow-premium-lg hover:-translate-y-1 transition-all duration-300 flex flex-col text-center p-8 border border-slate-200/50 card-enter">
                            <img src={agent.avatar} alt={agent.name} className="w-28 h-28 rounded-full mx-auto border-4 border-white shadow-lg" />
                            <h3 className="text-xl font-bold text-secondary mt-4">{agent.name}</h3>
                            <p className="text-slate-500 text-sm font-medium">Insurance Advisor</p>
                            
                            <div className="mt-4 space-y-2 text-slate-600 text-sm">
                                <div className="flex items-center justify-center">
                                    <LocationPinIcon className="w-4 h-4 mr-2 text-slate-400" />
                                    <span>{agent.location}</span>
                                </div>
                                <div className="flex items-center justify-center">
                                    <PhoneIcon className="w-4 h-4 mr-2 text-slate-400" />
                                    <span>{agent.phone}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => onNavigate(`agent/${agent.slug}`)}
                                className="mt-6 w-full bg-primary-600 text-white font-bold py-2.5 px-4 rounded-lg shadow-md hover:bg-primary-700 transition-colors button-press"
                            >
                                View Profile
                            </button>
                        </div>
                    ))}
                </div>
                 {filteredAgents.length === 0 && (
                    <div className="text-center py-16 text-slate-500">
                        <p className="font-semibold text-lg">No advisors found.</p>
                        <p>Try adjusting your search terms.</p>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default FindAdvisorPage;
