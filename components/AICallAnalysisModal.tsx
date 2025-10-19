import React, { useState, useEffect } from 'react';
import { AICallLog, AICallAnalysis } from '../types';
import { CloseIcon, AiSparklesIcon, SpeakerOnIcon, HeartIcon, DocumentTextIcon, CheckCircleIcon } from './icons';
import { analyzeCallRecording } from '../services/geminiService';

interface AICallAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  callLog: AICallLog | null;
}

const LoadingState: React.FC = () => (
    <div className="text-center py-16">
        <AiSparklesIcon className="w-12 h-12 text-primary-500 mx-auto animate-pulse" />
        <h3 className="text-xl font-bold text-slate-700 mt-4">Analyzing Call...</h3>
        <p className="text-slate-500 mt-2">The AI is processing the recording to extract key insights. This may take a moment.</p>
    </div>
);

const AnalysisDisplay: React.FC<{ analysis: AICallAnalysis }> = ({ analysis }) => {
    const sentimentStyles = {
        Positive: { icon: '😊', bg: 'bg-emerald-50', text: 'text-emerald-800' },
        Neutral: { icon: '😐', bg: 'bg-slate-100', text: 'text-slate-800' },
        Negative: { icon: '😞', bg: 'bg-rose-50', text: 'text-rose-800' },
    };
    const sentiment = sentimentStyles[analysis.sentiment] || sentimentStyles.Neutral;

    return (
        <div className="space-y-6">
            <div>
                <h4 className="text-lg font-semibold text-slate-800 mb-2 flex items-center"><DocumentTextIcon className="w-5 h-5 mr-2 text-primary-600" /> AI Summary</h4>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-200">{analysis.summary}</p>
            </div>
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <h4 className="text-lg font-semibold text-slate-800 mb-2 flex items-center"><HeartIcon className="w-5 h-5 mr-2 text-primary-600" /> Client Sentiment</h4>
                    <div className={`p-3 rounded-md border ${sentiment.bg} flex items-center`}>
                        <span className="text-2xl mr-3">{sentiment.icon}</span>
                        <span className={`font-bold ${sentiment.text}`}>{analysis.sentiment}</span>
                    </div>
                </div>
                <div>
                    <h4 className="text-lg font-semibold text-slate-800 mb-2">Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                        {analysis.keywords.map((keyword, i) => (
                            <span key={i} className="bg-primary-100 text-primary-800 text-xs font-semibold px-2 py-1 rounded-full">{keyword}</span>
                        ))}
                    </div>
                </div>
            </div>
             <div>
                <h4 className="text-lg font-semibold text-slate-800 mb-2 flex items-center"><CheckCircleIcon className="w-5 h-5 mr-2 text-primary-600" /> Action Items</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-700 bg-slate-50 p-3 rounded-md border border-slate-200">
                    {analysis.actionItems.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            </div>
        </div>
    );
};


const AICallAnalysisModal: React.FC<AICallAnalysisModalProps> = ({ isOpen, onClose, callLog }) => {
  const [analysis, setAnalysis] = useState<AICallAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && callLog) {
      setIsLoading(true);
      setError(null);
      setAnalysis(null);
      
      const timer = setTimeout(async () => {
          try {
            const result = await analyzeCallRecording({ intent: callLog.intent, status: callLog.status });
            setAnalysis(result);
          } catch (e: any) {
            setError(e.message || 'An unknown error occurred during analysis.');
          } finally {
            setIsLoading(false);
          }
      }, 1500); // Simulate network and processing time

      return () => clearTimeout(timer);
    }
  }, [isOpen, callLog]);

  if (!isOpen || !callLog) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 modal-backdrop">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-premium-lg w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto modal-panel border border-white/50">
        <div className="p-6 sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-200">
            <div className="flex justify-between items-start">
              <div>
                  <h2 className="text-2xl font-bold text-slate-900">AI Call Analysis</h2>
                  <p className="text-slate-500">For call with {callLog.name} on {new Date(callLog.timestamp).toLocaleDateString()}</p>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close modal" title="Close">
                <CloseIcon />
              </button>
            </div>
             {callLog.callRecordingUrl && (
                <div className="mt-4">
                    <audio controls className="w-full h-10" controlsList="nodownload">
                        <source src={callLog.callRecordingUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                    </audio>
                </div>
            )}
        </div>
        
        <div className="p-8">
            {isLoading && <LoadingState />}
            {error && <div className="text-center text-rose-600 bg-rose-50 p-4 rounded-md">{error}</div>}
            {analysis && <AnalysisDisplay analysis={analysis} />}
        </div>
      </div>
    </div>
  );
};

export default AICallAnalysisModal;