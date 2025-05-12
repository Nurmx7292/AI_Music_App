import React, { useState, useEffect } from "react";
import "./audioPlayer.css";
import ArchitectPlayerCard from "./ArchitectPlayerCard";
import { initializePlayer, playTrack, pauseTrack, resumeTrack, getCurrentState, seek } from "../../utils/spotifyAPI/spotify";

export default function AudioPLayer({
  currentTrack,
  currentIndex,
  setCurrentIndex,
  total,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackProgress, setTrackProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressInterval = React.useRef<NodeJS.Timeout | null>(null);

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

  const handleSeek = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPosition = parseInt(e.target.value);
    await seek(newPosition);
    setTrackProgress(newPosition);
  };

  const currentPercentage = duration ? (trackProgress / duration) * 100 : 0;

  const artists = [];
  currentTrack?.album?.artists.forEach((artist) => {
    artists.push(artist.name);
  });

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
        />
      </div>
    </div>
  );
}
