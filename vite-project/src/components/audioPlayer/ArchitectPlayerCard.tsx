import React from "react";
import './ArchitectPlayerCard.css';
import { FaPlay, FaPause, FaStepForward, FaStepBackward } from 'react-icons/fa';

interface ArchitectPlayerCardProps {
  percentage: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  track: {
    name: string;
    album: {
      name: string;
      images: Array<{ url: string }>;
      artists: Array<{ name: string }>;
    };
  };
  progress: number;
  duration: number;
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const BLOCKS = 24;

export default function ArchitectPlayerCard({
  percentage,
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  track,
  progress,
  duration,
  onSeek
}: ArchitectPlayerCardProps) {
  // Архитектурный прогресс-бар (стена)
  const filledBlocks = Math.round((percentage / 100) * BLOCKS);
  const blocks = Array.from({ length: BLOCKS }, (_, i) => i < filledBlocks);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="architect-player-card">
      <div className="apc-art-perspective">
        <div className="apc-art-shadow" />
        <img
          className="apc-art-img"
          src={track?.album?.images?.[0]?.url || null}
          alt={track?.name || 'Album Art'}
        />
        <div className="apc-art-lines" />
      </div>
      <div className="apc-info">
        <h3 className="apc-title">{track?.name || 'No track selected'}</h3>
        <p className="apc-artist">
          {track?.album?.artists?.map(artist => artist.name).join(', ') || 'Unknown artist'}
        </p>
      </div>
      <div className="apc-progress-wall">
        {blocks.map((filled, i) => (
          <div
            key={i}
            className={`apc-wall-block${filled ? ' filled' : ''}`}
            style={{ transitionDelay: `${i * 0.02}s` }}
          />
        ))}
      </div>
      <div className="apc-progress">
        <input
          type="range"
          min="0"
          max={duration}
          value={progress}
          onChange={onSeek}
          className="apc-progress-bar"
        />
        <div className="apc-time">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      <div className="apc-controls">
        <button className="apc-ctrl-btn" onClick={onPrev} title="Previous">
          <FaStepBackward />
        </button>
        <button className="apc-ctrl-btn apc-play-btn" onClick={onPlayPause} title={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
        <button className="apc-ctrl-btn" onClick={onNext} title="Next">
          <FaStepForward />
        </button>
      </div>
    </div>
  );
} 