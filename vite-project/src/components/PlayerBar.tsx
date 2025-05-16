import React, { useEffect, useState, useRef } from 'react';
import './PlayerBar.css';
import { usePlayer } from '../context/PlayerContext';
import spotifyApi, { initializePlayer, playTrack, pauseTrack, resumeTrack, getCurrentState, seek, setVolume } from '../utils/spotifyAPI/spotify';

const PlayerBar = () => {
  const { currentTrack, trackList, currentIndex, isPlaying, play, pause, next, prev, source } = usePlayer();
  const [progress, setProgress] = useState(0); // ms
  const [duration, setDuration] = useState(0); // ms
  const [volume, setVolumeState] = useState(0.5);
  const [isPremium, setIsPremium] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const lastPlayedUri = useRef<string | null>(null);

  // Проверка Premium
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const res = await spotifyApi.get('me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsPremium(res.data.product === 'premium');
      } catch {
        setIsPremium(false);
      }
    };
    fetchMe();
  }, []);

  // Инициализация плеера
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      initializePlayer(token).then(() => setPlayerReady(true));
    }
  }, []);

  // Сброс прогресса при смене трека
  useEffect(() => {
    if (currentTrack) {
      setProgress(0);
      setDuration(currentTrack.duration_ms ?? 0);
    }
  }, [currentTrack]);

  // Реальный прогресс из getCurrentState
  useEffect(() => {
    if (isPlaying && currentTrack) {
      progressRef.current = setInterval(async () => {
        const state = await getCurrentState();
        if (state) {
          setProgress(state.position);
          setDuration(state.duration);
        }
      }, 1000);
    } else if (progressRef.current) {
      clearInterval(progressRef.current);
    }
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [isPlaying, currentTrack]);

  // Управление Spotify API
  const handlePlayPause = async () => {
    const token = localStorage.getItem('access_token');
    if (!token || !currentTrack || !playerReady) return;
    try {
      if (isPlaying) {
        await pauseTrack();
        pause();
      } else {
        await playTrack(currentTrack.uri);
        play();
      }
    } catch (e) { /* ignore */ }
  };

  const handlePrev = () => {
    console.log('Prev button clicked');
    if (playerReady) {
      prev();
      setProgress(0);
    }
  };

  const handleNext = () => {
    console.log('Next button clicked');
    if (playerReady) {
      next();
      setProgress(0);
    }
  };

  const handleProgressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setProgress(val);
    // Seek in Spotify (if Premium)
    if (isPremium && currentTrack && playerReady) {
      const token = localStorage.getItem('access_token');
      if (token) {
        await seek(val);
      }
    }
  };

  const handleVolumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolumeState(val);
    // Set volume in Spotify (if Premium)
    if (isPremium && playerReady) {
      const token = localStorage.getItem('access_token');
      if (token) {
        await setVolume(val);
      }
    }
  };

  const formatTime = (ms: number) => {
    const min = Math.floor((ms || 0) / 60000);
    const sec = Math.floor(((ms || 0) % 60000) / 1000);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  // Воспроизведение трека при изменении currentTrack
  useEffect(() => {
    let retryCount = 0;
    const tryPlay = async () => {
      if (!playerReady || !currentTrack) return;
      await playTrack(currentTrack.uri);
      play();
      setTimeout(async () => {
        const state = await getCurrentState();
        if (state && (state.paused || state.position === 0) && retryCount < 2) {
          retryCount++;
          await tryPlay();
        }
      }, 500);
    };
    if (playerReady && currentTrack && currentTrack.uri !== lastPlayedUri.current) {
      setTimeout(() => {
        tryPlay();
        lastPlayedUri.current = currentTrack.uri;
      }, 200); // небольшая задержка для гарантии инициализации
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack, playerReady]);

  if (!currentTrack) return null;

  return (
    <div className="player-bar">
      <div className="player-bar__left">
        <div className="player-bar__cover">
          {currentTrack.album.images[0]?.url && (
            <img src={currentTrack.album.images[0].url} alt={currentTrack.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
          )}
        </div>
        <div className="player-bar__info">
          <div className="player-bar__title">{currentTrack.name}</div>
          <div className="player-bar__artist">{currentTrack.artists.map(a => a.name).join(', ')}</div>
        </div>
      </div>
      <div className="player-bar__center">
        <div className="player-bar__buttons">
          <button className="player-bar__button" onClick={handlePrev} disabled={currentIndex === 0 || !playerReady}>⏮️</button>
          <button className="player-bar__button" onClick={handlePlayPause} disabled={!playerReady}>{isPlaying ? '⏸️' : '▶️'}</button>
          <button className="player-bar__button" onClick={handleNext} disabled={currentIndex === trackList.length - 1 || !playerReady}>⏭️</button>
        </div>
        <div className="player-bar__progress">
          <span>{formatTime(progress || 0)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={Number.isFinite(progress) ? progress : 0}
            onChange={handleProgressChange}
            disabled={!isPremium || !playerReady}
          />
          <span>{formatTime(duration || 0)}</span>
        </div>
      </div>
      <div className="player-bar__right">
        <input
          type="range"
          min={0}
          max={1}
          step="0.01"
          value={Number.isFinite(volume) ? volume : 0.5}
          onChange={handleVolumeChange}
          disabled={!isPremium || !playerReady}
        />
      </div>
    </div>
  );
};

export default PlayerBar; 