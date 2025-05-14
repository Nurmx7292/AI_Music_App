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
    preview_url?: string;
  };
  progress: number;
  duration: number;
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isPreview?: boolean;
  volume: number;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
  onSeek,
  isPreview,
  volume,
  onVolumeChange
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
        {/* Прогресс трека */}
        {duration > 0 ? (
          <input
            type="range"
            min="0"
            max={duration}
            value={progress}
            onChange={onSeek}
            className="apc-progress-bar"
            disabled={isPreview}
            style={isPreview ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          />
        ) : (
          <div style={{ color: '#b3b3b3', fontSize: '0.85rem', marginTop: 4, textAlign: 'center' }}>
            Нет данных для перемотки
          </div>
        )}
        {isPreview && duration > 0 && (
          <div style={{ color: '#b3b3b3', fontSize: '0.85rem', marginTop: 4, textAlign: 'center' }}>
            Перемотка недоступна для превью
          </div>
        )}
        <div className="apc-time">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        {/* Громкость */}
        <div style={{display: 'flex', alignItems: 'center', gap: 8, marginTop: 12}}>
          <span style={{fontSize: '1.1em', color: '#b3b3b3'}}>🔊</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={onVolumeChange}
            className="apc-progress-bar"
            style={{width: 90}}
          />
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