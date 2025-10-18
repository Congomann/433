import React, { useState } from 'react';
import { TrophyIcon, TikTokIcon, VimeoIcon, YouTubeIcon } from './icons';
import VideoPlayerModal from './VideoPlayerModal';

interface TrainingVideo {
    id: number;
    title: string;
    description: string;
    videoId: string;
    platform: 'youtube' | 'vimeo' | 'tiktok';
    duration: string;
    thumbnailUrl: string;
}

const TRAINING_VIDEOS: TrainingVideo[] = [
    {
        id: 1,
        title: 'Mastering IUL: The Ultimate Guide',
        description: 'A deep dive into Indexed Universal Life insurance. This module covers product mechanics, illustration design, and advanced sales strategies to help you confidently present IUL solutions to your clients.',
        videoId: 'dQw4w9WgXcQ',
        platform: 'youtube',
        duration: '03:32',
        thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    },
    {
        id: 2,
        title: 'The Power of Financial Literacy',
        description: 'Understand the core concepts of financial literacy and how to communicate them effectively to empower your clients. A Vimeo Staff Pick on financial education.',
        videoId: '19231868',
        platform: 'vimeo',
        duration: '03:40',
        thumbnailUrl: 'https://i.vimeocdn.com/video/595198868-523e9e03_640x360.jpg',
    },
    {
        id: 3,
        title: 'Quick Sales Tip: The Assumptive Close',
        description: 'A short, powerful tip on using the assumptive close technique to increase your conversion rate. Straight from a top sales coach on TikTok.',
        videoId: '7130503756811439366',
        platform: 'tiktok',
        duration: '00:58',
        thumbnailUrl: 'https://images.unsplash.com/photo-1611162616805-6a40c7f339d6?auto=format&fit=crop&w=640&q=80',
    },
    {
        id: 4,
        title: 'Effective Prospecting Techniques',
        description: 'Fill your pipeline with qualified leads. This video explores modern prospecting methods, including social media strategies, networking events, and referral systems.',
        videoId: 'o-YBDTqX_ZU',
        platform: 'youtube',
        duration: '28:45',
        thumbnailUrl: 'https://img.youtube.com/vi/o-YBDTqX_ZU/hqdefault.jpg',
    },
];

const PLATFORM_ICONS = {
    youtube: <YouTubeIcon />,
    vimeo: <VimeoIcon />,
    tiktok: <TikTokIcon />,
};

const VideoCard: React.FC<{ video: TrainingVideo; onClick: () => void }> = ({ video, onClick }) => (
    <div onClick={onClick} className="bg-white rounded-2xl shadow-premium hover:shadow-premium-lg hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden border border-slate-200/50 cursor-pointer group card-enter">
        <div className="relative">
            <img src={video.thumbnailUrl} alt={video.title} className="w-full h-40 object-cover" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
            <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-md">{video.duration}</span>
            <div className="absolute top-2 left-2 bg-black/60 text-white p-1.5 rounded-full">
                {React.cloneElement(PLATFORM_ICONS[video.platform], { className: 'w-5 h-5' })}
            </div>
        </div>
        <div className="p-5">
            <h3 className="font-bold text-slate-800 group-hover:text-primary-600 transition-colors">{video.title}</h3>
        </div>
    </div>
);


const TrainingView = () => {
    const [selectedVideo, setSelectedVideo] = useState<TrainingVideo | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = (video: TrainingVideo) => {
        setSelectedVideo(video);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedVideo(null);
    };

    return (
        <>
            <div className="p-10 page-enter">
                <div className="flex items-center mb-8">
                    <TrophyIcon className="w-10 h-10 text-primary-600 mr-4" />
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-800">Training Center</h1>
                        <p className="text-slate-500">Access our library of training videos to sharpen your skills.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {TRAINING_VIDEOS.map(video => (
                        <VideoCard key={video.id} video={video} onClick={() => handleOpenModal(video)} />
                    ))}
                </div>
            </div>
            <VideoPlayerModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                video={selectedVideo}
            />
        </>
    );
};

export default TrainingView;