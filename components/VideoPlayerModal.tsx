import React from 'react';
import { CloseIcon } from './icons';

interface TrainingVideo {
    id: number;
    title: string;
    description: string;
    videoId: string;
    platform: 'youtube' | 'vimeo' | 'tiktok';
    duration: string;
    thumbnailUrl: string;
}

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: TrainingVideo | null;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ isOpen, onClose, video }) => {
  if (!isOpen || !video) return null;

  const getEmbedUrl = () => {
    switch(video.platform) {
      case 'youtube':
        return `https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0`;
      case 'vimeo':
        return `https://player.vimeo.com/video/${video.videoId}?autoplay=1`;
      case 'tiktok':
        return `https://www.tiktok.com/embed/v2/${video.videoId}`;
      default:
        return '';
    }
  };

  const embedUrl = getEmbedUrl();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 modal-backdrop">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-premium-lg w-full max-w-3xl m-4 modal-panel border border-white/50 overflow-hidden">
        <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-slate-900">{video.title}</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close modal" title="Close">
                <CloseIcon />
              </button>
            </div>
        </div>
        
        <div className="aspect-w-16 aspect-h-9 bg-black">
           {embedUrl ? (
            <iframe
                src={embedUrl}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
            ></iframe>
           ) : (
             <div className="flex items-center justify-center h-full text-white">Unsupported video platform.</div>
           )}
        </div>

        <div className="p-6">
            <p className="text-slate-600">{video.description}</p>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerModal;