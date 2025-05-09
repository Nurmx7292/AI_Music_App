import React from "react";
import './ArchitectPlayerCard.css';
import { FaPlay, FaPause, FaStepForward, FaStepBackward } from 'react-icons/fa';

interface ArchitectPlayerCardProps {
  percentage: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  track: any;
  progress: number;
  duration: number;
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
  duration
}: ArchitectPlayerCardProps) {
  // Архитектурный прогресс-бар (стена)
  const filledBlocks = Math.round((percentage / 100) * BLOCKS);
  const blocks = Array.from({ length: BLOCKS }, (_, i) => i < filledBlocks);

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="architect-player-card">
      <div className="apc-art-perspective">
        <div className="apc-art-shadow" />
        <img
          className="apc-art-img"
          src={track?.album?.images?.[0]?.url || ''}
          alt={track?.name || 'Album Art'}
        />
        <div className="apc-art-lines" />
      </div>
      <div className="apc-info">
        <div className="apc-title">{track?.name || 'No Track'}</div>
        <div className="apc-artist">{track?.album?.artists?.map((a:any) => a.name).join(', ') || 'Unknown Artist'}</div>
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
      <div className="apc-time-row">
        <span>{formatTime(progress)}</span>
        <span>{formatTime(duration)}</span>
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