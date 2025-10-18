import React from 'react';

const ResourcesPage: React.FC = () => {
    const articles = [
        { title: 'Understanding Term vs. Whole Life Insurance', category: 'Life Insurance', date: 'Oct 15, 2024', snippet: 'Dive into the fundamental differences between term and whole life insurance to decide which is right for your family...' },
        { title: '5 Questions to Ask When Buying Home Insurance', category: 'Property', date: 'Oct 10, 2024', snippet: 'Don\'t get caught underinsured. Here are five crucial questions to ask your agent before signing a new homeowner\'s policy...' },
        { title: 'Do I Need Commercial Auto Insurance?', category: 'Business', date: 'Oct 05, 2024', snippet: 'If you use your vehicle for work, your personal auto policy might not be enough. Learn when you need to upgrade to commercial coverage...' },
    ];

    return (
        <div className="bg-light py-16 page-enter">
            <div className="container mx-auto px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-secondary">Resources & Insights</h1>
                    <p className="text-slate-600 mt-4 max-w-2xl mx-auto text-lg">
                        Stay informed with the latest news, tips, and insights from our team of insurance experts.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {articles.map((article, index) => (
                        <div key={index} className="bg-white rounded-2xl shadow-premium hover:shadow-premium-lg hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden border border-slate-200/50 card-enter">
                            <div className="p-6">
                                <p className="text-sm font-semibold text-primary-600">{article.category}</p>
                                <h3 className="text-xl font-bold text-secondary mt-2 mb-3">{article.title}</h3>
                                <p className="text-slate-600 text-sm">{article.snippet}</p>
                            </div>
                            <div className="mt-auto bg-slate-50 px-6 py-4 border-t border-slate-200/80 flex justify-between items-center">
                                <p className="text-xs text-slate-500">{article.date}</p>
                                <a href="#" className="text-sm font-bold text-primary-600 hover:text-primary-700">Read More &rarr;</a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ResourcesPage;
