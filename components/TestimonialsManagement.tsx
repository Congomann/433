import React, { useState, useMemo } from 'react';
import { Testimonial, TestimonialStatus } from '../types';
import { CheckCircleIcon, TrashIcon, ChatBubbleLeftRightIcon } from './icons';

interface TestimonialsManagementProps {
  testimonials: Testimonial[];
  onUpdateTestimonialStatus: (testimonialId: number, status: TestimonialStatus) => Promise<any>;
  onDeleteTestimonial: (testimonialId: number) => Promise<any>;
  onNavigate: (view: string) => void;
}

const TestimonialsManagement: React.FC<TestimonialsManagementProps> = ({ testimonials, onUpdateTestimonialStatus, onDeleteTestimonial, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');

  const { pendingTestimonials, approvedTestimonials } = useMemo(() => {
    const pending: Testimonial[] = [];
    const approved: Testimonial[] = [];
    testimonials.forEach(t => {
      if (t.status === TestimonialStatus.PENDING) {
        pending.push(t);
      } else if (t.status === TestimonialStatus.APPROVED) {
        approved.push(t);
      }
    });
    return { 
        pendingTestimonials: pending.sort((a,b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()),
        approvedTestimonials: approved.sort((a,b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime())
    };
  }, [testimonials]);

  const TabButton: React.FC<{tabId: 'pending' | 'approved', label: string, count: number}> = ({ tabId, label, count }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`px-4 py-2 font-medium text-sm rounded-t-lg border-b-2 transition-colors ${activeTab === tabId ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
    >
      {label} <span className="ml-2 px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-xs">{count}</span>
    </button>
  );

  const TestimonialCard: React.FC<{ testimonial: Testimonial, isPending?: boolean }> = ({ testimonial, isPending = false }) => {
    const QuoteIcon = () => (
      <svg className="w-8 h-8 text-slate-200" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 14">
        <path d="M6 0H2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v1a3 3 0 0 1-3 3H2a1 1 0 0 0 0 2h1a5.006 5.006 0 0 0 5-5V2a2 2 0 0 0-2-2Zm10 0h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v1a3 3 0 0 1-3 3h-1a1 1 0 0 0 0 2h1a5.006 5.006 0 0 0 5-5V2a2 2 0 0 0-2-2Z"/>
      </svg>
    );

    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-lg transition-shadow flex flex-col h-full card-enter">
        <div className="p-6 flex-grow">
          <QuoteIcon />
          <blockquote className="mt-2 text-lg text-slate-700 leading-relaxed">
            "{testimonial.quote}"
          </blockquote>
        </div>
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
          <div className="flex justify-between items-center">
             <div>
                <p className="font-bold text-slate-800">{testimonial.author}</p>
                <p className="text-xs text-slate-500">Submitted: {testimonial.submissionDate}</p>
             </div>
             <div className="flex items-center space-x-2">
                {testimonial.status === TestimonialStatus.PENDING && (
                    <button 
                        onClick={async () => await onUpdateTestimonialStatus(testimonial.id, TestimonialStatus.APPROVED)}
                        className="flex items-center text-sm font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-md transition-colors button-press"
                        aria-label={`Approve testimonial from ${testimonial.author}`}
                    >
                        <CheckCircleIcon className="w-5 h-5 mr-1.5" /> Approve
                    </button>
                )}
                <button 
                    onClick={async () => {
                        if (window.confirm('Are you sure you want to permanently delete this testimonial?')) {
                            await onDeleteTestimonial(testimonial.id);
                        }
                    }}
                    className="flex items-center text-sm font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 px-3 py-1.5 rounded-md transition-colors button-press"
                    aria-label={`Delete testimonial from ${testimonial.author}`}
                >
                    <TrashIcon className="w-5 h-5 mr-1.5" /> Delete
                </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8">
        <button onClick={() => onNavigate('dashboard')} className="text-primary-600 hover:underline mb-6">&larr; Back to Dashboard</button>
        <div className="flex items-center mb-6">
            <ChatBubbleLeftRightIcon className="w-10 h-10 text-primary-600 mr-4" />
            <div>
                <h1 className="text-3xl font-extrabold text-slate-800">Testimonial Management</h1>
                <p className="text-slate-500">Approve new testimonials to display them on your public profile.</p>
            </div>
        </div>
        
        <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                <TabButton tabId="pending" label="Pending Approval" count={pendingTestimonials.length} />
                <TabButton tabId="approved" label="Approved" count={approvedTestimonials.length} />
            </nav>
        </div>

        <div className="mt-6">
            {activeTab === 'pending' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingTestimonials.length > 0 ? (
                        pendingTestimonials.map(t => <TestimonialCard key={t.id} testimonial={t} isPending />)
                    ) : (
                        <p className="text-slate-500 col-span-full text-center py-8">No pending testimonials.</p>
                    )}
                </div>
            )}
            {activeTab === 'approved' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {approvedTestimonials.length > 0 ? (
                        approvedTestimonials.map(t => <TestimonialCard key={t.id} testimonial={t} />)
                    ) : (
                        <p className="text-slate-500 col-span-full text-center py-8">No approved testimonials yet.</p>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

export default TestimonialsManagement;
