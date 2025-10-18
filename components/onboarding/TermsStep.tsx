import React, { useState } from 'react';

interface TermsStepProps {
  title: string;
  content: string;
  onNext: () => void;
  onPrevious: () => void;
  isFirstStep: boolean;
}

const TermsStep: React.FC<TermsStepProps> = ({ title, content, onNext, onPrevious, isFirstStep }) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-premium border border-slate-200/50 flex flex-col h-full">
      <div className="p-8 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
      </div>
      <div className="p-8 flex-1 overflow-y-auto" style={{ maxHeight: '400px' }}>
        <div
          className="prose prose-sm max-w-none text-slate-600"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
      <div className="p-8 bg-slate-50 border-t border-slate-200/50 space-y-6">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="ml-3 text-sm text-slate-700">
            I have read and agree to the {title} and acknowledge I am bound by the same.
          </span>
        </label>
        <div className="flex justify-between items-center">
          <button
            onClick={onPrevious}
            disabled={isFirstStep}
            className="px-6 py-2.5 text-sm font-semibold text-slate-700 bg-white rounded-lg shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={onNext}
            disabled={!agreed}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg shadow-md hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsStep;
