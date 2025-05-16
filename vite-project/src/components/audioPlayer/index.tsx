import React, { useState, useEffect } from "react";
import "./audioPlayer.css";
import ArchitectPlayerCard from "./ArchitectPlayerCard";
import { initializePlayer, playTrack, pauseTrack, resumeTrack, getCurrentState, seek, setVolume } from "../../utils/spotifyAPI/spotify";

export default function AudioPLayer({
  currentTrack,
  currentIndex,
  setCurrentIndex,
  total,
}: any) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackProgress, setTrackProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressInterval = React.useRef<NodeJS.Timeout | null>(null);
  const [volume, setVolumeState] = useState(0.5);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      initializePlayer(token);
      }
  }, []);

  useEffect(() => {
    const updateProgress = async () => {
      const state = await getCurrentState();
      if (state) {
        setTrackProgress(state.position);
        setDuration(state.duration);
        setIsPlaying(!state.paused);
      }
    };

    progressInterval.current = setInterval(updateProgress, 1000);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (currentTrack?.uri) {
      playTrack(currentTrack.uri);
      setIsPlaying(true);
    }
    if (currentTrack && !currentTrack.preview_url) {
      setTrackProgress(0);
    }
  }, [currentTrack]);

  const handlePlayPause = async () => {
    if (isPlaying) {
      await pauseTrack();
    } else {
      await resumeTrack();
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (currentIndex < total.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    if (currentIndex - 1 < 0) {
      setCurrentIndex(total.length - 1);
    } else {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const isPreview = Boolean(currentTrack?.preview_url);

  const handleSeek = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isPreview) return;
    const newPosition = parseInt(e.target.value);
    await seek(newPosition);
    setTrackProgress(newPosition);
  };

  const currentPercentage = duration ? (trackProgress / duration) * 100 : 0;

  const artists: string[] = [];
  currentTrack?.album?.artists.forEach((artist: { name: string }) => {
    artists.push(artist.name);
  });

  const handleVolumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolumeState(newVolume);
    await setVolume(newVolume);
  };

  return (
    <div className="player-body flex">
      <div className="player-right-body flex">
        <ArchitectPlayerCard
          percentage={currentPercentage}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onPrev={handlePrev}
          track={currentTrack}
          progress={trackProgress}
          duration={duration}
          onSeek={handleSeek}
          isPreview={isPreview}
          volume={volume}
          onVolumeChange={handleVolumeChange}
        />
      </div>
    </div>
  );
}
